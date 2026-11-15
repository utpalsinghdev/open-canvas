import { create } from 'zustand';
import { useEditor } from '../editor/store';
import { newId } from '../editor/model';
import { starterDocument } from '../editor/seed';
import { firstLocation, initialWorkspace, projectPage, workspaceId, type Location, type Workspace } from './model';
import { viewPatch } from './state';
import { loadWorkspace } from './storage';
import { workspaceRequest } from './remote';
import { serviceRecordSchema, workspaceListSchema, type ServiceRecord } from './service-schema';
import { hasReviewDrafts } from '../review/drafts';

const SELECTED = 'open-cavas.service-workspace.v1';
export const useWorkspaceService = create<{
  record: ServiceRecord | null;
  workspaces: ReturnType<typeof workspaceListSchema.parse>;
  busy: boolean;
  error: string;
  canCopyBrowser: boolean;
}>()(() => ({ record: null, workspaces: [], busy: false, error: '', canCopyBrowser: true }));
let timer: ReturnType<typeof setTimeout> | undefined;
let applying = false;
let saving = false;
let polling = false;
let browserWorkspace: Workspace;
let browserLocation: Location;

function localView(record: ServiceRecord, location: Location) {
  // The browser's displayed page is local navigation, not the agent's remembered page.
  const workspace = {
    ...record.workspace,
    projects: record.workspace.projects.map((project) => ({
      ...project, files: project.files.map((file) => file.id === location.fileId
        ? { ...file, pageId: location.pageId } : file),
    })),
  };
  return viewPatch(useEditor.getState(), workspace, location, {});
}
function applyRecord(record: ServiceRecord, opening = false) {
  if (opening) {
    const url = new URL(window.location.href);
    url.searchParams.set('workspace', record.id);
    history.replaceState(null, '', url);
  }
  const previous = useEditor.getState();
  let location = opening ? record.context : previous.location;
  try { projectPage(record.workspace, location); }
  catch {
    location = firstLocation(record.workspace);
    previous.notify('Displayed file or page was removed. Opened the first remaining page.');
  }
  applying = true;
  useEditor.setState({
    ...localView(record, location), ready: true, saveState: 'saved', persistenceBlocked: false, persistenceFailure: null,
  });
  applying = false;
  useWorkspaceService.setState({ record, error: '' });
}
export async function refreshWorkspaces() {
  const workspaces = workspaceListSchema.parse(await workspaceRequest({ method: 'list' }));
  useWorkspaceService.setState({ workspaces });
  return workspaces;
}
export async function openServiceWorkspace(id: string) {
  useWorkspaceService.setState({ busy: true, error: '' });
  try {
    const record = serviceRecordSchema.parse(await workspaceRequest({ method: 'read', id }));
    localStorage.setItem(SELECTED, record.id);
    applyRecord(record, true);
  } catch (error) {
    useWorkspaceService.setState({ error: error instanceof Error ? error.message : 'Workspace unavailable.' });
  } finally { useWorkspaceService.setState({ busy: false }); }
}
export async function createServiceWorkspace(name: string, content: 'introduction' | 'empty' | 'browser') {
  useWorkspaceService.setState({ busy: true, error: '' });
  const copyBrowser = content === 'browser';
  const workspace = copyBrowser ? browserWorkspace
    : initialWorkspace(content === 'introduction' ? starterDocument() : { version: 1, name: 'Untitled', nodes: [], tokens: {} });
  const id = newId();
  try {
    // Remember the explicit destination before dispatch, so an uncertain create can be read on reload.
    localStorage.setItem(SELECTED, id);
    const record = serviceRecordSchema.parse(await workspaceRequest({
      method: 'create', id, name, workspace,
      context: copyBrowser ? browserLocation : firstLocation(workspace),
    }));
    applyRecord(record, true);
  } catch (error) {
    useWorkspaceService.setState({ error: error instanceof Error ? error.message : 'Workspace creation failed.' });
  } finally { useWorkspaceService.setState({ busy: false }); }
}
export function switchServiceWorkspace() {
  if (useEditor.getState().saveState !== 'saved' || hasReviewDrafts()) {
    useEditor.getState().notify('Finish edits and save, or download a workspace backup before switching.');
    return;
  }
  localStorage.removeItem(SELECTED);
  window.location.assign('/');
}
export async function setWorkspaceAccess() {
  const record = useWorkspaceService.getState().record;
  if (!record || saving || useEditor.getState().saveState !== 'saved')
    throw new Error('Wait for workspace changes to save before changing agent access.');
  saving = true;
  try {
    const next = serviceRecordSchema.parse(await workspaceRequest({
      method: 'access', id: record.id, expectedRevision: record.revision, enabled: !record.agentEnabled,
    }));
    useWorkspaceService.setState({ record: next });
  } finally {
    saving = false;
    if (useEditor.getState().saveState === 'pending') timer = setTimeout(() => { void persist(); }, 350);
  }
}
async function persist() {
  const snapshot = useEditor.getState();
  const record = useWorkspaceService.getState().record;
  if (!record || saving || snapshot.persistenceBlocked || snapshot.saveState === 'saved') return;
  saving = true;
  try {
    const next = serviceRecordSchema.parse(await workspaceRequest({
      method: 'save', id: record.id, expectedRevision: record.revision, workspace: snapshot.workspace,
    }));
    useWorkspaceService.setState({ record: next });
    if (useEditor.getState().workspace === snapshot.workspace)
      useEditor.setState({ saveState: 'saved', persistenceFailure: null });
  } catch (error) {
    const conflict = error instanceof Error && error.message.startsWith('Workspace revision conflict.');
    useEditor.setState({
      saveState: 'failed', persistenceBlocked: true,
      persistenceFailure: {
        kind: conflict ? 'conflict' : 'write',
        name: error instanceof Error ? error.name.slice(0, 80) : 'UnknownError',
        message: error instanceof Error ? error.message.slice(0, 500) : 'Workspace save failed.',
        recovery: conflict
          ? 'Workspace changed elsewhere. Download a workspace backup from Projects, then reload before editing again.'
          : 'Your unsaved browser state was kept. Download a workspace backup from Projects before reloading.',
      },
    });
  } finally {
    saving = false;
    if (!useEditor.getState().persistenceBlocked && useEditor.getState().saveState === 'pending')
      timer = setTimeout(() => { void persist(); }, 350);
  }
}
function busyWithDraft() {
  const focused = document.activeElement;
  return useEditor.getState().interactionActive || hasReviewDrafts() ||
    (focused instanceof Element && Boolean(focused.closest('input,textarea,[contenteditable=true],[role=dialog]')));
}
async function poll() {
  const record = useWorkspaceService.getState().record;
  if (!record || polling || saving || useEditor.getState().saveState !== 'saved' || busyWithDraft()) return;
  polling = true;
  const snapshot = useEditor.getState().workspace;
  try {
    const list = await refreshWorkspaces();
    if (list.find((item) => item.id === record.id)?.revision !== record.revision) {
      const next = serviceRecordSchema.parse(await workspaceRequest({ method: 'read', id: record.id }));
      if (!saving && useWorkspaceService.getState().record === record &&
          useEditor.getState().workspace === snapshot && !busyWithDraft()) applyRecord(next);
    }
  } catch (error) {
    useWorkspaceService.setState({ error: error instanceof Error ? error.message : 'Local workspace service unavailable.' });
  } finally { polling = false; }
}
export async function initializeWorkspace() {
  const initial = useEditor.getState();
  browserWorkspace = initial.workspace;
  browserLocation = initial.location;
  try {
    const loaded = await loadWorkspace(initial.workspace);
    browserWorkspace = loaded.workspace;
    browserLocation = loaded.location;
    useEditor.setState({ ...viewPatch(initial, loaded.workspace, loaded.location), ready: true });
  } catch {
    useWorkspaceService.setState({ canCopyBrowser: false, error: 'Browser storage could not be read safely. Original data was not changed. Choose a local service workspace or create an empty one.' });
    useEditor.setState({ ready: true });
  }
  try {
    await refreshWorkspaces();
    const url = new URL(window.location.href);
    const targets = url.searchParams.getAll('workspace');
    if (targets.length > 1 || (targets.length === 1 && !workspaceId.safeParse(targets[0]).success))
      throw new Error('Invalid workspace link. Select a local workspace explicitly.');
    const legacyDestination = url.pathname !== '/' || ['project', 'file', 'page'].some((key) => url.searchParams.has(key));
    // Legacy file links lack service identity. Require explicit selection, never last-profile fallback.
    const selected = targets[0] ?? (legacyDestination ? null : localStorage.getItem(SELECTED));
    if (selected) await openServiceWorkspace(selected);
  } catch (error) {
    useWorkspaceService.setState({ error: error instanceof Error ? error.message : 'Local workspace service unavailable.' });
  }
}
useEditor.subscribe((state, previous) => {
  if (applying || !useWorkspaceService.getState().record || state.workspace === previous.workspace) return;
  if (!state.persistenceBlocked) useEditor.setState({ saveState: 'pending' });
  clearTimeout(timer);
  timer = setTimeout(() => { void persist(); }, 350);
});
setInterval(() => { void poll(); }, 2000);
const flush = () => { clearTimeout(timer); void persist(); };
window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
