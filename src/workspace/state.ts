import type { DesignDocument, Tool } from '../editor/model';
import {
  currentFile,
  projectPage,
  type FileRecord,
  type Location,
  type Workspace,
} from './model';

export type History = { past: FileRecord[]; future: FileRecord[] };
export type WorkspaceState = {
  ready: boolean;
  workspace: Workspace;
  location: Location;
  document: DesignDocument;
  histories: Record<string, History>;
  past: FileRecord[];
  future: FileRecord[];
  selectedIds: string[];
  tool: Tool;
  interactionActive: boolean;
  message: string;
  saveState: 'saved' | 'pending' | 'failed';
  persistenceBlocked: boolean;
  persistenceFailure: {
    kind: 'conflict' | 'write' | 'load';
    name: string;
    message: string;
    recovery: string;
  } | null;
};
/** IDs originate in imported files; inherited object keys are not history entries. */
export function historyFor(
  histories: Record<string, History>,
  fileId: string
): History {
  return Object.hasOwn(histories, fileId)
    ? histories[fileId]
    : { past: [], future: [] };
}
export function viewPatch(
  state: WorkspaceState,
  workspace: Workspace,
  location: Location,
  histories = state.histories,
  clearSelection = false
): Partial<WorkspaceState> {
  const file = currentFile(workspace, location);
  const document = projectPage(workspace, location);
  const samePage =
    state.location.projectId === location.projectId &&
    state.location.fileId === location.fileId &&
    state.location.pageId === location.pageId;
  const history = historyFor(histories, file.id);
  return {
    workspace,
    location,
    document,
    histories,
    past: history.past,
    future: history.future,
    selectedIds:
      !samePage || clearSelection
        ? []
        : state.selectedIds.filter((id) =>
            document.nodes.some((node) => node.id === id)
          ),
    tool: samePage ? state.tool : 'select',
    interactionActive: samePage ? state.interactionActive : false,
    saveState: state.persistenceBlocked ? 'failed' : 'pending',
  };
}
