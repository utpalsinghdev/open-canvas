import { newId, nodeSchema } from '../editor/model';
import { copyThreads } from '../review/model';
import {
  currentFile,
  fileRecordSchema,
  firstLocation,
  fromLegacy,
  itemName,
  newFile,
  workspaceSchema,
  type FileRecord,
  type ImportData,
  type Location,
  type Workspace,
} from './model';
import { historyFor, viewPatch, type WorkspaceState } from './state';
import { shareFile } from './sharing';

const HISTORY_LIMIT = 80;
export function createWorkspaceActions(
  get: () => WorkspaceState,
  set: (patch: Partial<WorkspaceState>) => void
) {
  function apply(
    workspace: Workspace,
    location: Location,
    histories = get().histories
  ) {
    const state = get();
    const valid = workspaceSchema.parse(workspace);
    const previousFiles = new Map(
      state.workspace.projects.flatMap((project) =>
        project.files.map((file) => [file.id, file] as const)
      )
    );
    const shared = {
      ...valid,
      projects: valid.projects.map((project, projectIndex) => ({
        ...project,
        files: project.files.map((file, fileIndex) =>
          shareFile(
            previousFiles.get(file.id),
            workspace.projects[projectIndex].files[fileIndex],
            file
          )
        ),
      })),
    };
    set(viewPatch(state, shared, location, histories));
  }
  function fileAt(projectId: string, fileId: string) {
    return currentFile(get().workspace, { projectId, fileId });
  }
  function replaceFile(
    workspace: Workspace,
    projectId: string,
    file: FileRecord
  ) {
    return {
      ...workspace,
      projects: workspace.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              files: project.files.map((item) =>
                item.id === file.id ? file : item
              ),
            }
          : project
      ),
    };
  }
  function commitFile(projectId: string, next: FileRecord, focus = false) {
    const state = get();
    const previous = fileAt(projectId, next.id);
    const file = shareFile(previous, next, fileRecordSchema.parse(next));
    const history = historyFor(state.histories, file.id);
    const histories = {
      ...state.histories,
      [file.id]: {
        past: [...history.past, previous].slice(-HISTORY_LIMIT),
        future: [],
      },
    };
    const workspace = replaceFile(state.workspace, projectId, file);
    const location =
      focus || state.location.fileId === file.id
        ? { projectId, fileId: file.id, pageId: file.pageId }
        : state.location;
    set(viewPatch(state, workspace, location, histories));
  }
  function createProject(name: string) {
    const state = get();
    const file = newFile('Untitled');
    const project = { id: newId(), name: itemName.parse(name), files: [file] };
    apply(
      { ...state.workspace, projects: [...state.workspace.projects, project] },
      { projectId: project.id, fileId: file.id, pageId: file.pageId }
    );
    return project.id;
  }
  function renameProject(projectId: string, name: string) {
    const state = get();
    if (!state.workspace.projects.some((project) => project.id === projectId))
      throw new Error('Project does not exist.');
    const validName = itemName.parse(name);
    apply(
      {
        ...state.workspace,
        projects: state.workspace.projects.map((project) =>
          project.id === projectId ? { ...project, name: validName } : project
        ),
      },
      state.location
    );
  }
  function deleteProject(projectId: string) {
    const state = get();
    const target = state.workspace.projects.find(
      (project) => project.id === projectId
    );
    if (!target) throw new Error('Project does not exist.');
    if (state.workspace.projects.length === 1)
      throw new Error(
        'Keep at least one project. Create another project before deleting this one.'
      );
    const workspace = {
      ...state.workspace,
      projects: state.workspace.projects.filter(
        (project) => project.id !== projectId
      ),
    };
    const deletedFiles = new Set(target.files.map((file) => file.id));
    const histories = Object.fromEntries(
      Object.entries(state.histories).filter(([id]) => !deletedFiles.has(id))
    );
    apply(
      workspace,
      state.location.projectId === projectId
        ? firstLocation(workspace)
        : state.location,
      histories
    );
  }
  function createFile(projectId: string, name: string, imported?: ImportData) {
    const state = get();
    const project = state.workspace.projects.find(
      (item) => item.id === projectId
    );
    if (!project) throw new Error('Project does not exist.');
    if (imported && 'kind' in imported)
      throw new Error(
        'Expected a file document, not a workspace or project archive.'
      );
    const document = imported
      ? imported.version === 1
        ? fromLegacy(imported)
        : imported
      : undefined;
    const file = newFile(itemName.parse(name), document);
    const workspace = {
      ...state.workspace,
      projects: state.workspace.projects.map((item) =>
        item.id === projectId ? { ...item, files: [...item.files, file] } : item
      ),
    };
    apply(workspace, { projectId, fileId: file.id, pageId: file.pageId });
    return file.id;
  }
  function renameFile(projectId: string, fileId: string, name: string) {
    const file = fileAt(projectId, fileId);
    commitFile(projectId, {
      ...file,
      document: { ...file.document, name: itemName.parse(name) },
    });
  }
  function deleteFile(projectId: string, fileId: string) {
    const state = get();
    fileAt(projectId, fileId);
    const project = state.workspace.projects.find(
      (item) => item.id === projectId
    );
    if (!project || project.files.length === 1)
      throw new Error('Keep at least one file in each project.');
    const files = project.files.filter((item) => item.id !== fileId);
    const workspace = {
      ...state.workspace,
      projects: state.workspace.projects.map((item) =>
        item.id === projectId ? { ...item, files } : item
      ),
    };
    const histories = Object.fromEntries(
      Object.entries(state.histories).filter(([id]) => id !== fileId)
    );
    const location =
      state.location.fileId === fileId
        ? { projectId, fileId: files[0].id, pageId: files[0].pageId }
        : state.location;
    apply(workspace, location, histories);
  }
  function openFile(projectId: string, fileId: string, pageId?: string) {
    const state = get();
    const file = fileAt(projectId, fileId);
    const targetPage = pageId ?? file.pageId;
    if (!file.document.pages.some((page) => page.id === targetPage))
      throw new Error('Page does not exist in this file.');
    const workspace = replaceFile(state.workspace, projectId, {
      ...file,
      pageId: targetPage,
    });
    // Navigation changes only an existing file's active page. Its artwork is
    // already validated; reparsing it scans every embedded image again.
    set(viewPatch(state, workspace, { projectId, fileId, pageId: targetPage }));
  }
  function createPage(projectId: string, fileId: string, name: string) {
    const file = fileAt(projectId, fileId);
    const page = { id: newId(), name: itemName.parse(name), nodes: [], threads: [] };
    commitFile(
      projectId,
      {
        ...file,
        document: { ...file.document, pages: [...file.document.pages, page] },
        pageId: page.id,
      },
      true
    );
    return page.id;
  }
  function renamePage(
    projectId: string,
    fileId: string,
    pageId: string,
    name: string
  ) {
    const file = fileAt(projectId, fileId);
    if (!file.document.pages.some((page) => page.id === pageId))
      throw new Error('Page does not exist.');
    const validName = itemName.parse(name);
    commitFile(projectId, {
      ...file,
      document: {
        ...file.document,
        pages: file.document.pages.map((page) =>
          page.id === pageId ? { ...page, name: validName } : page
        ),
      },
    });
  }
  function deletePage(projectId: string, fileId: string, pageId: string) {
    const file = fileAt(projectId, fileId);
    if (!file.document.pages.some((page) => page.id === pageId))
      throw new Error('Page does not exist.');
    if (file.document.pages.length === 1)
      throw new Error('Keep at least one page in each file.');
    const pages = file.document.pages.filter((page) => page.id !== pageId);
    commitFile(projectId, {
      ...file,
      document: { ...file.document, pages },
      pageId: file.pageId === pageId ? pages[0].id : file.pageId,
    });
  }
  function duplicatePage(projectId: string, fileId: string, pageId: string) {
    const file = fileAt(projectId, fileId);
    const page = file.document.pages.find((item) => item.id === pageId);
    if (!page) throw new Error('Page does not exist.');
    const ids = new Map(page.nodes.map((node) => [node.id, newId()]));
    const copy = {
      ...page,
      id: newId(),
      name: `${page.name.slice(0, 155)} copy`,
      threads: copyThreads(page.threads, ids),
      nodes: page.nodes.map((node) =>
        nodeSchema.parse({
          ...node,
          id: ids.get(node.id),
          parentId: node.parentId ? ids.get(node.parentId) : null,
        })
      ),
    };
    commitFile(
      projectId,
      {
        ...file,
        document: { ...file.document, pages: [...file.document.pages, copy] },
        pageId: copy.id,
      },
      true
    );
    return copy.id;
  }
  function duplicateFile(projectId: string, fileId: string) {
    const file = fileAt(projectId, fileId);
    const name = `${file.document.name.slice(0, 155)} copy`;
    return createFile(projectId, name, { ...file.document, name });
  }
  function importData(data: ImportData, projectId = get().location.projectId) {
    if (!('kind' in data)) return createFile(projectId, data.name, data);
    const imported =
      data.kind === 'open-cavas-project' ? [data.project] : data.projects;
    const projects = imported.map((project) => ({
      ...project,
      id: newId(),
      files: project.files.map((file) => ({ ...file, id: newId() })),
    }));
    const state = get();
    const first = projects[0];
    const file = first.files[0];
    apply(
      {
        ...state.workspace,
        projects: [...state.workspace.projects, ...projects],
      },
      { projectId: first.id, fileId: file.id, pageId: file.pageId }
    );
    return first.id;
  }
  function restore(direction: 'undo' | 'redo') {
    const state = get();
    const current = currentFile(state.workspace, state.location);
    const history = historyFor(state.histories, current.id);
    const previous =
      direction === 'undo' ? history.past.at(-1) : history.future[0];
    if (!previous) return;
    const nextHistory =
      direction === 'undo'
        ? {
            past: history.past.slice(0, -1),
            future: [current, ...history.future].slice(0, HISTORY_LIMIT),
          }
        : {
            past: [...history.past, current].slice(-HISTORY_LIMIT),
            future: history.future.slice(1),
          };
    const histories = { ...state.histories, [current.id]: nextHistory };
    const workspace = replaceFile(
      state.workspace,
      state.location.projectId,
      previous
    );
    set(
      viewPatch(
        state,
        workspace,
        { ...state.location, pageId: previous.pageId },
        histories,
        true
      )
    );
  }
  return {
    commitFile,
    createProject,
    renameProject,
    deleteProject,
    createFile,
    renameFile,
    deleteFile,
    openFile,
    createPage,
    renamePage,
    deletePage,
    duplicatePage,
    duplicateFile,
    importData,
    undo: () => restore('undo'),
    redo: () => restore('redo'),
  };
}
