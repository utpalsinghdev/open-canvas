import { useEditor } from '../editor/store';
import { documentSchema } from '../editor/model';
import { firstLocation, initialWorkspace } from './model';
import { viewPatch } from './state';
import { loadWorkspace, saveWorkspace, WorkspaceConflict } from './storage';

let revision = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let queue = Promise.resolve();
function persist() {
  const snapshot = useEditor.getState();
  if (!snapshot.ready || snapshot.persistenceBlocked) return;
  queue = queue.then(async () => {
    if (useEditor.getState().persistenceBlocked) return;
    try {
      revision = await saveWorkspace(
        snapshot.workspace,
        snapshot.location,
        revision
      );
      const current = useEditor.getState();
      if (
        current.workspace === snapshot.workspace &&
        current.location === snapshot.location
      )
        useEditor.setState({ saveState: 'saved', persistenceFailure: null });
    } catch (error) {
      const conflict = error instanceof WorkspaceConflict;
      useEditor.setState({
        saveState: 'failed',
        persistenceBlocked: conflict,
        persistenceFailure: {
          kind: conflict ? 'conflict' : 'write',
          name: error instanceof Error ? error.name.slice(0, 80) : 'UnknownError',
          message: error instanceof Error ? error.message.slice(0, 500) : 'Workspace save failed.',
          recovery: conflict
            ? 'Workspace changed in another tab. Download a workspace backup from Projects, then reload before editing again.'
            : 'Workspace save failed. Download a workspace backup from Projects before reloading. Storage may be full or unavailable.',
        },
      });
    }
  });
}
export async function initializeWorkspace() {
  const initial = useEditor.getState();
  try {
    const loaded = await loadWorkspace(initial.workspace);
    revision = loaded.revision;
    useEditor.setState({
      ...viewPatch(initial, loaded.workspace, loaded.location),
      ready: true,
      saveState: loaded.needsSave ? 'pending' : 'saved',
      persistenceFailure: null,
      message: loaded.migrated
        ? 'Existing canvas migrated into Personal. Original local-storage data kept as a backup.'
        : '',
    });
    if (loaded.needsSave) {
      persist();
      await queue;
    }
  } catch (error) {
    let workspace = initial.workspace;
    try {
      const raw = localStorage.getItem('open-cavas.document.v1');
      if (raw)
        workspace = initialWorkspace(documentSchema.parse(JSON.parse(raw)));
    } catch {
      /* Leave unreadable original storage untouched. */
    }
    useEditor.setState({
      ...viewPatch(initial, workspace, firstLocation(workspace)),
      ready: true,
      persistenceBlocked: true,
      saveState: 'failed',
      persistenceFailure: {
        kind: 'load',
        name: error instanceof Error ? error.name.slice(0, 80) : 'UnknownError',
        // Validation errors can include document values; do not expose their details.
        message: error instanceof DOMException ? error.message.slice(0, 500) : 'Stored workspace could not be read or validated.',
        recovery: 'Workspace could not be loaded safely. Original data was not overwritten. Download a workspace backup from Projects before reloading.',
      },
    });
  }
}
useEditor.subscribe((state, previous) => {
  if (
    !state.ready ||
    !previous.ready ||
    (state.workspace === previous.workspace &&
      state.location === previous.location)
  )
    return;
  clearTimeout(timer);
  timer = setTimeout(persist, 350);
});
const flush = () => {
  clearTimeout(timer);
  if (useEditor.getState().saveState !== 'saved') persist();
};
window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
});
