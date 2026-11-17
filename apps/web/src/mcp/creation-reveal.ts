import { create } from 'zustand';
import type { Location } from '@open-cavas/document/workspace';
import { useEditor, type EditorState } from '../editor/store';

type Snapshot = Pick<EditorState, 'document' | 'location'>;
type CreationBatch = { target: Location; nodeIds: ReadonlySet<string> };
const creationMethods = new Set(['create_artboard', 'create_nodes', 'write_html', 'duplicate_nodes']);

export const useCreationReveal = create<{ batches: ReadonlyMap<symbol, CreationBatch> }>(() => ({
  batches: new Map(),
}));

export function clearCreationReveals() {
  if (useCreationReveal.getState().batches.size) useCreationReveal.setState({ batches: new Map() });
}

function samePage(a: Location, b: Location) {
  return a.projectId === b.projectId && a.fileId === b.fileId && a.pageId === b.pageId;
}

// Leaving a page or removing a revealed layer consumes its entrance permanently.
useEditor.subscribe((state, previous) => {
  if (state.document === previous.document && state.location === previous.location) return;
  const { batches } = useCreationReveal.getState();
  if (!batches.size) return;
  const visibleIds = new Set(state.document.nodes.map((node) => node.id));
  const next = new Map([...batches].filter(([, batch]) =>
    samePage(batch.target, state.location) && [...batch.nodeIds].every((id) => visibleIds.has(id))
  ));
  if (next.size !== batches.size) useCreationReveal.setState({ batches: next });
});

/** Present only newly committed MCP artwork, never navigation, undo or partial drafts.
 * Request-owned batches expire independently and never enter document/history/export state.
 */
export function revealCommittedCreation(method: string, before: Snapshot, after: Snapshot) {
  if (!creationMethods.has(method) || before.document === after.document) return;
  const target = after.location;
  if (!samePage(before.location, target)) return;
  const previousIds = new Set(before.document.nodes.map((node) => node.id));
  const created = after.document.nodes.filter((node) => !previousIds.has(node.id));
  const parentReveals = new Set([
    ...created.map((node) => node.id),
    ...[...useCreationReveal.getState().batches.values()].filter((batch) => samePage(batch.target, target)).flatMap((batch) => [...batch.nodeIds]),
  ]);
  // An artboard wrapper already reveals its children; never multiply presentation opacity.
  const nodeIds = new Set(created.filter((node) => !node.parentId || !parentReveals.has(node.parentId)).map((node) => node.id));
  if (!nodeIds.size) return;
  const key = Symbol();
  useCreationReveal.setState(({ batches }) => ({ batches: new Map(batches).set(key, { target, nodeIds }) }));
  // Matches the canvas-only opacity animation; no stagger or delayed node insertion.
  setTimeout(() => useCreationReveal.setState(({ batches }) => {
    if (!batches.has(key)) return { batches };
    const next = new Map(batches);
    next.delete(key);
    return { batches: next };
  }), 220);
}
