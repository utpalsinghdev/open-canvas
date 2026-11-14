import { z } from 'zod';
import { newId, nodeSchema, type DesignNode } from '../editor/model';
import { textNodeBounds } from '../editor/typography';

const id = nodeSchema.options[1].shape.id;
const coordinate = nodeSchema.options[1].shape.x;
export const anchorSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('layer'), nodeId: id }).strict(),
  z.object({ kind: z.literal('position'), x: coordinate, y: coordinate }).strict(),
]);
export const commentBodySchema = z.string().trim().min(1).max(4000);
export const threadStatusSchema = z.enum(['open', 'resolved']);
export const commentSchema = z.object({
  id,
  body: commentBodySchema,
  createdAt: z.number().int().nonnegative().max(8_640_000_000_000_000),
});
export const threadSchema = z.object({
  id,
  anchor: anchorSchema,
  status: threadStatusSchema,
  comments: z.array(commentSchema).min(1).max(100),
});
export const threadsSchema = z.array(threadSchema).max(100).default([]);
export type ReviewAnchor = z.infer<typeof anchorSchema>;
export type ReviewThread = z.infer<typeof threadSchema>;

export function newComment(body: string) {
  return { id: newId(), body: commentBodySchema.parse(body), createdAt: Date.now() };
}

/** Missing layer anchors are retained as feedback, never silently retargeted. */
export function anchorPoint(anchor: ReviewAnchor, nodes: DesignNode[]) {
  if (anchor.kind === 'position') return { x: anchor.x, y: anchor.y };
  const node = nodes.find((node) => node.id === anchor.nodeId);
  if (!node) return null;
  const bounds = node.kind === 'text' ? textNodeBounds(node) : node;
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

export function requireAnchor(anchor: ReviewAnchor, nodes: DesignNode[]) {
  if (!anchorPoint(anchor, nodes))
    throw new Error('Thread anchor layer is missing from this page. Restore the layer with undo or review the retained feedback.');
}

export function copyThreads(threads: ReviewThread[], layerIds: Map<string, string>): ReviewThread[] {
  return threads.map((thread) => ({
    ...thread,
    id: newId(),
    anchor: thread.anchor.kind === 'layer'
      ? { kind: 'layer', nodeId: layerIds.get(thread.anchor.nodeId) ?? newId() }
      : thread.anchor,
    comments: thread.comments.map((comment) => ({ ...comment, id: newId() })),
  }));
}
