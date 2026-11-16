import { z } from 'zod';
import { workspaceId, locationSchema } from '@open-cavas/document/workspace';

export const target = {
  canvasId: workspaceId.optional().describe(
    'Browser-only target from list_canvases. Do not combine with workspaceId.'
  ),
  workspaceId: workspaceId.optional().describe(
    'Durable local workspace ID from list_workspaces. No browser required.'
  ),
  context: locationSchema.optional().describe(
    'Explicit project/file/page target for backend reads; never redirects the browser.'
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
