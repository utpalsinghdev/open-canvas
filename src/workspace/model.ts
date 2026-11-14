import { z } from 'zod';
import { documentSchema, newId, type DesignDocument } from '../editor/model';

export const workspaceId = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_-]+$/);
export const itemName = z.string().trim().min(1).max(160);
export const pageSchema = z
  .object({
    id: workspaceId,
    name: itemName,
    nodes: documentSchema.shape.nodes,
  })
  .superRefine((page, ctx) => {
    const parsed = documentSchema.safeParse({
      version: 1,
      name: page.name,
      nodes: page.nodes,
      tokens: {},
    });
    if (!parsed.success)
      ctx.addIssue({
        code: 'custom',
        message:
          'Page has invalid or duplicate layer IDs or parent references.',
      });
  });
export const fileDocumentSchema = z
  .object({
    version: z.literal(2),
    name: itemName,
    tokens: documentSchema.shape.tokens,
    pages: z.array(pageSchema).min(1).max(100),
  })
  .superRefine((file, ctx) => {
    const pageIds = new Set<string>();
    const nodeIds = new Set<string>();
    for (const page of file.pages) {
      if (pageIds.has(page.id))
        ctx.addIssue({
          code: 'custom',
          message: 'Page IDs must be unique in a file.',
        });
      pageIds.add(page.id);
      for (const node of page.nodes) {
        if (nodeIds.has(node.id))
          ctx.addIssue({
            code: 'custom',
            message: 'Layer IDs must be unique across a file.',
          });
        nodeIds.add(node.id);
      }
    }
    if (nodeIds.size > 10_000)
      ctx.addIssue({
        code: 'custom',
        message: 'A file supports at most 10,000 layers across its pages.',
      });
  });
export const fileRecordSchema = z
  .object({
    id: workspaceId,
    document: fileDocumentSchema,
    pageId: workspaceId,
  })
  .refine(
    (file) => file.document.pages.some((page) => page.id === file.pageId),
    'Active page must exist.'
  );
export const projectSchema = z.object({
  id: workspaceId,
  name: itemName,
  files: z.array(fileRecordSchema).min(1).max(50),
});
export const workspaceSchema = z
  .object({
    kind: z.literal('open-cavas-workspace'),
    version: z.literal(1),
    projects: z.array(projectSchema).min(1).max(50),
  })
  .superRefine((workspace, ctx) => {
    const projects = new Set<string>();
    const files = new Set<string>();
    for (const project of workspace.projects) {
      if (projects.has(project.id))
        ctx.addIssue({ code: 'custom', message: 'Duplicate project ID.' });
      projects.add(project.id);
      for (const file of project.files) {
        if (files.has(file.id))
          ctx.addIssue({
            code: 'custom',
            message: 'File IDs must be unique across the workspace.',
          });
        files.add(file.id);
      }
    }
    if (files.size > 200)
      ctx.addIssue({
        code: 'custom',
        message: 'Workspace supports at most 200 files.',
      });
  });
export const locationSchema = z.object({
  projectId: workspaceId,
  fileId: workspaceId,
  pageId: workspaceId,
});
export const projectArchiveSchema = z.object({
  kind: z.literal('open-cavas-project'),
  version: z.literal(1),
  project: projectSchema,
});
export const importSchema = z.union([
  workspaceSchema,
  projectArchiveSchema,
  fileDocumentSchema,
  documentSchema,
]);
export type Page = z.infer<typeof pageSchema>;
export type FileDocument = z.infer<typeof fileDocumentSchema>;
export type FileRecord = z.infer<typeof fileRecordSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type Location = z.infer<typeof locationSchema>;
export type ImportData = z.infer<typeof importSchema>;

export function fromLegacy(document: DesignDocument): FileDocument {
  return {
    version: 2,
    name: document.name.trim() || 'Untitled',
    tokens: document.tokens,
    pages: [{ id: newId(), name: 'Page 1', nodes: document.nodes }],
  };
}
export function newFile(name: string, document?: FileDocument): FileRecord {
  const data = document ?? {
    version: 2,
    name,
    tokens: {},
    pages: [{ id: newId(), name: 'Page 1', nodes: [] }],
  };
  return { id: newId(), document: data, pageId: data.pages[0].id };
}
export function firstLocation(workspace: Workspace): Location {
  const project = workspace.projects[0];
  const file = project.files[0];
  return { projectId: project.id, fileId: file.id, pageId: file.pageId };
}
export function currentFile(
  workspace: Workspace,
  location: Pick<Location, 'projectId' | 'fileId'>
): FileRecord {
  const file = workspace.projects
    .find((project) => project.id === location.projectId)
    ?.files.find((file) => file.id === location.fileId);
  if (!file) throw new Error('Project or file does not exist.');
  return file;
}
export function projectPage(
  workspace: Workspace,
  location: Location
): DesignDocument {
  const file = currentFile(workspace, location);
  const page = file.document.pages.find((page) => page.id === location.pageId);
  if (!page) throw new Error('Page does not exist in this file.');
  return {
    version: 1,
    name: file.document.name,
    tokens: file.document.tokens,
    nodes: page.nodes,
  };
}
export function initialWorkspace(document: DesignDocument): Workspace {
  return {
    kind: 'open-cavas-workspace',
    version: 1,
    projects: [
      {
        id: newId(),
        name: 'Personal',
        files: [newFile(document.name, fromLegacy(document))],
      },
    ],
  };
}
