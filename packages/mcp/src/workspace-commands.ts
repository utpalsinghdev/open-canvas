import type { EditorStore } from '@open-cavas/engine/state';
import { workspaceTools } from './workspace-tools';
import { withoutImageBytes } from './reads';

export function createWorkspaceHandlers(useEditor: Pick<EditorStore, 'getState'>) {
function fileAt(projectId: string, fileId: string) {
  const file = useEditor
    .getState()
    .workspace.projects.find((project) => project.id === projectId)
    ?.files.find((file) => file.id === fileId);
  if (!file) throw new Error('Project or file does not exist.');
  return file;
}
const workspaceHandlers: Record<string, (value: unknown) => unknown> = {
  list_projects(value) {
    workspaceTools.list_projects.schema.parse(value);
    const state = useEditor.getState();
    return {
      projects: state.workspace.projects.map((project) => ({
        id: project.id,
        name: project.name,
        files: project.files.map((file) => ({
          id: file.id,
          name: file.document.name,
          activePageId: file.pageId,
          pages: file.document.pages.map((page) => ({
            id: page.id,
            name: page.name,
            layerCount: page.nodes.length,
          })),
        })),
      })),
      active: state.location,
    };
  },
  get_file(value) {
    const args = workspaceTools.get_file.schema.parse(value);
    const file = fileAt(args.projectId, args.fileId);
    return {
      projectId: args.projectId,
      fileId: file.id,
      document: args.includeImages
        ? file.document
        : {
            ...file.document,
            pages: file.document.pages.map((page) => ({
              ...page,
              nodes: page.nodes.map(withoutImageBytes),
            })),
          },
      imageBytesIncluded: args.includeImages,
    };
  },
  list_pages(value) {
    const args = workspaceTools.list_pages.schema.parse(value);
    return {
      projectId: args.projectId,
      fileId: args.fileId,
      pages: fileAt(args.projectId, args.fileId).document.pages.map((page) => ({
        id: page.id,
        name: page.name,
        layerCount: page.nodes.length,
      })),
    };
  },
  create_project(value) {
    const args = workspaceTools.create_project.schema.parse(value);
    return { projectId: useEditor.getState().createProject(args.name) };
  },
  rename_project(value) {
    const args = workspaceTools.rename_project.schema.parse(value);
    useEditor.getState().renameProject(args.projectId, args.name);
    return { renamedProjectId: args.projectId };
  },
  delete_project(value) {
    const args = workspaceTools.delete_project.schema.parse(value);
    useEditor.getState().deleteProject(args.projectId);
    return { deletedProjectId: args.projectId };
  },
  create_file(value) {
    const args = workspaceTools.create_file.schema.parse(value);
    return {
      fileId: useEditor.getState().createFile(args.projectId, args.name),
    };
  },
  rename_file(value) {
    const args = workspaceTools.rename_file.schema.parse(value);
    useEditor.getState().renameFile(args.projectId, args.fileId, args.name);
    return { renamedFileId: args.fileId };
  },
  delete_file(value) {
    const args = workspaceTools.delete_file.schema.parse(value);
    useEditor.getState().deleteFile(args.projectId, args.fileId);
    return { deletedFileId: args.fileId };
  },
  duplicate_file(value) {
    const args = workspaceTools.duplicate_file.schema.parse(value);
    return {
      fileId: useEditor.getState().duplicateFile(args.projectId, args.fileId),
    };
  },
  open_file(value) {
    const args = workspaceTools.open_file.schema.parse(value);
    useEditor.getState().openFile(args.projectId, args.fileId, args.pageId);
    return { opened: useEditor.getState().location };
  },
  create_page(value) {
    const args = workspaceTools.create_page.schema.parse(value);
    return {
      pageId: useEditor
        .getState()
        .createPage(args.projectId, args.fileId, args.name),
    };
  },
  rename_page(value) {
    const args = workspaceTools.rename_page.schema.parse(value);
    useEditor
      .getState()
      .renamePage(args.projectId, args.fileId, args.pageId, args.name);
    return { renamedPageId: args.pageId };
  },
  delete_page(value) {
    const args = workspaceTools.delete_page.schema.parse(value);
    useEditor.getState().deletePage(args.projectId, args.fileId, args.pageId);
    return { deletedPageId: args.pageId };
  },
  duplicate_page(value) {
    const args = workspaceTools.duplicate_page.schema.parse(value);
    return {
      pageId: useEditor
        .getState()
        .duplicatePage(args.projectId, args.fileId, args.pageId),
    };
  },
  export_project(value) {
    const args = workspaceTools.export_project.schema.parse(value);
    const project = useEditor
      .getState()
      .workspace.projects.find((project) => project.id === args.projectId);
    if (!project) throw new Error('Project does not exist.');
    return {
      content: JSON.stringify(
        { kind: 'open-cavas-project', version: 1, project },
        null,
        2
      ),
    };
  },
  export_workspace(value) {
    workspaceTools.export_workspace.schema.parse(value);
    return { content: JSON.stringify(useEditor.getState().workspace, null, 2) };
  },
};

return workspaceHandlers;
}
