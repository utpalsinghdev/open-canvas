import { z } from 'zod';
import { documentSchema } from '@open-cavas/document/model';
import {
  firstLocation,
  initialWorkspace,
  locationSchema,
  workspaceSchema,
  type Location,
  type Workspace,
} from '@open-cavas/document/workspace';

const savedSchema = z.object({
  revision: z.number().int().nonnegative(),
  workspace: workspaceSchema,
  location: locationSchema,
});
const DATABASE = 'open-cavas';
const STORE = 'workspace';
const KEY = 'current';
let database: Promise<IDBDatabase> | undefined;
export class WorkspaceConflict extends Error {}
function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onerror = () =>
      reject(request.error ?? new Error('Could not open workspace storage.'));
    request.onblocked = () =>
      reject(
        new Error(
          'Workspace storage is blocked by another tab. Close older tabs and reload.'
        )
      );
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
  });
  return database;
}
export async function loadWorkspace(fallback: Workspace) {
  const db = await openDatabase();
  const raw: unknown = await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get(KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Could not read workspace.'));
  });
  if (raw !== undefined) {
    const parsed = savedSchema.parse(raw);
    const project = parsed.workspace.projects.find(
      (item) => item.id === parsed.location.projectId
    );
    const file = project?.files.find(
      (item) => item.id === parsed.location.fileId
    );
    const location =
      project && file
        ? { projectId: project.id, fileId: file.id, pageId: file.pageId }
        : firstLocation(parsed.workspace);
    return { ...parsed, location, needsSave: false, migrated: false, hasBrowserData: true };
  }
  const legacy = localStorage.getItem('open-cavas.document.v1');
  const workspace = legacy !== null
    ? initialWorkspace(documentSchema.parse(JSON.parse(legacy)))
    : fallback;
  return {
    workspace,
    location: firstLocation(workspace),
    revision: 0,
    needsSave: true,
    migrated: Boolean(legacy),
    hasBrowserData: legacy !== null,
  };
}
/** Read and compare the disk revision inside the same write transaction. */
export async function saveWorkspace(
  workspace: Workspace,
  location: Location,
  expectedRevision: number
) {
  const db = await openDatabase();
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    let failure: Error | null = null;
    const request = store.get(KEY);
    request.onsuccess = () => {
      const current = z
        .object({ revision: z.number().int().nonnegative() })
        .safeParse(request.result);
      const revision =
        request.result === undefined
          ? 0
          : current.success
            ? current.data.revision
            : -1;
      if (revision !== expectedRevision) {
        failure = new WorkspaceConflict(
          'Workspace changed in another tab. Download a workspace backup, then reload before editing again.'
        );
        transaction.abort();
        return;
      }
      store.put({ revision: expectedRevision + 1, workspace, location }, KEY);
    };
    transaction.oncomplete = () => resolve(expectedRevision + 1);
    transaction.onerror = () =>
      reject(
        failure ?? transaction.error ?? new Error('Workspace save failed.')
      );
    transaction.onabort = () =>
      reject(
        failure ?? transaction.error ?? new Error('Workspace save was aborted.')
      );
  });
}
