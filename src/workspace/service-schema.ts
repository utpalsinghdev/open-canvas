import { z } from 'zod';
import { itemName, locationSchema, workspaceId, workspaceSchema } from './model';

export const serviceRecordSchema = z.object({
  id: workspaceId,
  name: itemName,
  revision: z.number().int().nonnegative(),
  agentEnabled: z.boolean(),
  workspace: workspaceSchema,
  context: locationSchema,
});
export const workspaceSummarySchema = serviceRecordSchema.omit({ workspace: true });
export const workspaceListSchema = z.array(workspaceSummarySchema);
export const workspaceStorageSchema = z.object({ directory: z.string().min(1).max(4096) });
export type ServiceRecord = z.infer<typeof serviceRecordSchema>;
export const serviceRequestSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('list') }).strict(),
  z.object({ method: z.literal('storage') }).strict(),
  z.object({ method: z.literal('read'), id: workspaceId }).strict(),
  z.object({
    method: z.literal('create'), id: workspaceId, name: itemName,
    workspace: workspaceSchema, context: locationSchema,
  }).strict(),
  z.object({
    method: z.literal('save'), id: workspaceId,
    expectedRevision: z.number().int().nonnegative(), workspace: workspaceSchema,
  }).strict(),
  z.object({
    method: z.literal('access'), id: workspaceId,
    expectedRevision: z.number().int().nonnegative(), enabled: z.boolean(),
  }).strict(),
  z.object({
    method: z.literal('call'), id: workspaceId, tool: z.string(), args: z.unknown(),
  }).strict(),
]);
export type ServiceRequest = z.infer<typeof serviceRequestSchema>;
