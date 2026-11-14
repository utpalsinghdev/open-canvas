import { z } from 'zod';
import { itemName, workspaceId } from '../workspace/model';
import { revisionTarget, target } from './target';

const fileTarget = { projectId: workspaceId, fileId: workspaceId };
const pageTarget = { ...fileTarget, pageId: workspaceId };
const read = <T extends z.ZodRawShape>(description: string, fields: T) => ({
  description,
  schema: z.object({ ...target, ...fields }).strict(),
  mutation: false,
});
const write = <T extends z.ZodRawShape>(description: string, fields: T) => ({
  description,
  schema: z.object({ ...revisionTarget, ...fields }).strict(),
  mutation: true,
});
export const workspaceTools = {
  list_projects: read(
    'List every project, its files, and page IDs/names. No artwork payloads. Use explicit IDs from this result.',
    {}
  ),
  get_file: read(
    'Read an explicitly targeted complete version-2 file, including all pages and file tokens. Base64 image bytes are omitted by default.',
    { ...fileTarget, includeImages: z.boolean().default(false) }
  ),
  list_pages: read(
    'List pages in an explicitly targeted file with layer counts.',
    fileTarget
  ),
  create_project: write(
    'Create a project containing an empty Untitled file and Page 1. Opens the new project.',
    { name: itemName }
  ),
  rename_project: write(
    'Rename a project. This library operation is not part of canvas undo history.',
    { projectId: workspaceId, name: itemName }
  ),
  delete_project: write(
    'Permanently remove a project and its files from this browser workspace. Keep at least one project. Download a backup first; not undoable.',
    { projectId: workspaceId }
  ),
  create_file: write(
    'Create an empty file in an explicit project and open its first page.',
    { projectId: workspaceId, name: itemName }
  ),
  rename_file: write(
    "Rename an explicit file. This participates in that file's undo history.",
    { ...fileTarget, name: itemName }
  ),
  delete_file: write(
    'Permanently remove a file. Keep at least one file in each project. Download a backup first; not undoable.',
    fileTarget
  ),
  duplicate_file: write(
    'Copy a complete file with all pages/tokens into its project, assign a new file ID, and open it.',
    fileTarget
  ),
  open_file: write(
    "Open a file and optionally a specific page. Without pageId, restores that file's last active page. Clears selection; changes the active context and revision.",
    { ...fileTarget, pageId: workspaceId.optional() }
  ),
  create_page: write(
    'Add an empty page to a file and open it. One file-history undo step.',
    { ...fileTarget, name: itemName }
  ),
  rename_page: write('Rename an explicit page. One file-history undo step.', {
    ...pageTarget,
    name: itemName,
  }),
  delete_page: write(
    "Remove an explicit page and its layers. Keep at least one page per file. Can be undone through that file's history.",
    pageTarget
  ),
  duplicate_page: write(
    'Duplicate a page and its layers with new page/layer IDs in the same file, then open it.',
    pageTarget
  ),
  export_project: read(
    'Return a complete project JSON backup with all files/pages. No filesystem writes. Use browser backup for payloads over 12 MB.',
    { projectId: workspaceId }
  ),
  export_workspace: read(
    'Return a complete workspace JSON backup. No filesystem writes. Use browser backup for payloads over 12 MB.',
    {}
  ),
};
