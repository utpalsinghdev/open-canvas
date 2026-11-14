import { z } from 'zod';
import { workspaceId, locationSchema } from '../workspace/model';

export const target = {
  canvasId: workspaceId.describe(
    'Use the browser canvas ID returned by list_canvases.'
  ),
};
export const revisionTarget = {
  ...target,
  expectedRevision: z
    .number()
    .int()
    .nonnegative()
    .describe(
      'Read current state before mutations. Stale writes fail without changes.'
    ),
};
export const pageMutationTarget = {
  ...revisionTarget,
  context: locationSchema.describe(
    'Exact project/file/page IDs from the latest response context. Required to prevent editing another file after navigation.'
  ),
};
export const targetSchema = z.object(target);
export const mutationTargetSchema = z.object({
  ...revisionTarget,
  context: locationSchema.optional(),
});
