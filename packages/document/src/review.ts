import { z } from 'zod';
import { newId, nodeSchema } from './model';

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
