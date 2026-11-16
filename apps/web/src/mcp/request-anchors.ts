import { z } from 'zod';
import { isHidden, type DesignDocument } from '@open-cavas/document/model';

export type ActivityAnchor = { key: string; nodeId?: string; x: number; y: number };
const point = { x: z.number().finite(), y: z.number().finite() };
const anchorArgs = z.object({
  nodeId: z.string().optional(),
  artboardId: z.string().optional(),
  artboardIds: z.array(z.string()).optional(),
  nodeIds: z.array(z.string()).optional(),
  updates: z.array(z.object({ nodeId: z.string() })).optional(),
  nodes: z.array(z.object({ ...point, parentId: z.string().nullable().optional() })).optional(),
  x: point.x.optional(),
  y: point.y.optional(),
});

/** Resolve validated request targets to their containing artwork, never current selection by default. */
export function requestAnchors(method: string, value: unknown, document: DesignDocument, selectedIds: string[]) {
  const args = anchorArgs.parse(value);
  const anchors = new Map<string, ActivityAnchor>();
  function addNode(id: string) {
    const node = document.nodes.find((item) => item.id === id);
    if (!node || isHidden(node, document.nodes)) return;
    const root = node.parentId ? document.nodes.find((item) => item.id === node.parentId) ?? node : node;
    anchors.set(root.id, { key: root.id, nodeId: root.id, x: root.x, y: root.y });
  }
  function addPoint(x: number, y: number) {
    const key = `point:${x}:${y}`;
    anchors.set(key, { key, x, y });
  }
  if (method === 'create_artboard' && args.x !== undefined && args.y !== undefined) addPoint(args.x, args.y);
  for (const draft of args.nodes ?? []) {
    if (draft.parentId) addNode(draft.parentId);
    else addPoint(draft.x, draft.y);
  }
  for (const id of [args.nodeId, args.artboardId, ...(args.nodeIds ?? []), ...(args.artboardIds ?? []), ...(args.updates ?? []).map((item) => item.nodeId)]) {
    if (id) addNode(id);
  }
  if (method === 'get_selection') for (const id of selectedIds) addNode(id);
  return [...anchors.values()];
}
