import { createStore } from 'zustand/vanilla';
import {
  newId,
  documentSchema,
  isLocked,
  withChildren,
  type DesignDocument,
  type DesignNode,
  type Tool,
} from './model';
import { starterDocument } from './seed';
import { createWorkspaceActions } from '../workspace/actions';
import { createReviewActions } from '../review/actions';
import {
  currentFile,
  firstLocation,
  initialWorkspace,
  projectPage,
} from '../workspace/model';
import type { WorkspaceState } from '../workspace/state';

type EditorActions = {
  edit: (update: (doc: DesignDocument) => DesignDocument) => boolean;
  select: (ids: string[]) => void;
  setTool: (tool: Tool) => void;
  patch: (id: string, patch: Partial<DesignNode>) => void;
  remove: () => void;
  duplicate: () => void;
  reorder: (direction: 'front' | 'back') => void;
  notify: (message: string) => void;
};
export type EditorState = WorkspaceState &
  EditorActions &
  ReturnType<typeof createWorkspaceActions> &
  ReturnType<typeof createReviewActions>;
export function createEditorStore(workspace = initialWorkspace(starterDocument())) {
const location = firstLocation(workspace);
return createStore<EditorState>((set, get) => ({
  ready: false,
  workspace,
  location,
  document: projectPage(workspace, location),
  histories: {},
  interactionActive: false,
  message: '',
  selectedIds: [],
  tool: 'select',
  past: [],
  future: [],
  saveState: 'pending',
  persistenceBlocked: false,
  ...createWorkspaceActions(get, set),
  ...createReviewActions(get),
  edit: (update) => {
    const state = get();
    const next = update(state.document);
    if (next === state.document) return false;
    const valid = documentSchema.safeParse(next);
    if (!valid.success) {
      state.notify(
        'Change exceeds document limits. Check geometry and layer count.'
      );
      return false;
    }
    const file = currentFile(state.workspace, state.location);
    try {
      state.commitFile(state.location.projectId, {
        ...file,
        document: {
          ...file.document,
          name: valid.data.name,
          tokens: valid.data.tokens,
          pages: file.document.pages.map((page) =>
            page.id === state.location.pageId
              ? { ...page, nodes: valid.data.nodes }
              : page
          ),
        },
      });
      return true;
    } catch (error) {
      state.notify(
        error instanceof Error ? error.message : 'File change rejected.'
      );
      return false;
    }
  },
  select: (ids) => set({ selectedIds: ids }),
  setTool: (tool) => set({ tool }),
  patch: (id, patch) =>
    get().edit((doc) => {
      const target = doc.nodes.find((node) => node.id === id);
      if (!target) return doc;
      const result = documentSchema.safeParse({
        ...doc,
        nodes: doc.nodes.map((node) =>
          node.id === id ? { ...node, ...patch } : node
        ),
      });
      if (!result.success) {
        get().notify('Value is outside the supported range.');
        return doc;
      }
      const dx = (patch.x ?? target.x) - target.x;
      const dy = (patch.y ?? target.y) - target.y;
      return {
        ...result.data,
        nodes: result.data.nodes.map((node) =>
          target.kind === 'artboard' && node.parentId === id
            ? { ...node, x: node.x + dx, y: node.y + dy }
            : node
        ),
      };
    }),
  remove: () => {
    const { document, selectedIds } = get();
    const ids = withChildren(
      selectedIds.filter((id) =>
        document.nodes.some(
          (node) => node.id === id && !isLocked(node, document.nodes)
        )
      ),
      document.nodes
    );
    if (!ids.size) return;
    get().edit((doc) => ({
      ...doc,
      nodes: doc.nodes.filter((node) => !ids.has(node.id)),
    }));
    set({ selectedIds: [] });
  },
  duplicate: () => {
    const { document, selectedIds } = get();
    const ids = withChildren(selectedIds, document.nodes);
    const mapping = new Map([...ids].map((id) => [id, newId()]));
    const copies = document.nodes
      .filter((node) => ids.has(node.id))
      .map((node): DesignNode => {
        const common = {
          id: mapping.get(node.id) ?? node.id,
          name: `${node.name.slice(0, 155)} copy`,
          x: node.x + 24,
          y: node.y + 24,
        };
        return node.kind === 'artboard'
          ? { ...node, ...common, parentId: null }
          : {
              ...node,
              ...common,
              parentId: node.parentId
                ? (mapping.get(node.parentId) ?? node.parentId)
                : null,
            };
      });
    if (!copies.length || document.nodes.length + copies.length > 1000) {
      get().notify('Select layers to duplicate, within the 1,000-layer limit.');
      return;
    }
    if (get().edit((doc) => ({ ...doc, nodes: [...doc.nodes, ...copies] }))) {
      set({ selectedIds: selectedIds.map((id) => mapping.get(id) ?? id) });
    }
  },
  reorder: (direction) =>
    get().edit((doc) => {
      const ids = new Set(get().selectedIds);
      const selected = doc.nodes.filter((node) => ids.has(node.id));
      if (!selected.length) return doc;
      const rest = doc.nodes.filter((node) => !ids.has(node.id));
      return {
        ...doc,
        nodes:
          direction === 'front'
            ? [...rest, ...selected]
            : [...selected, ...rest],
      };
    }),
  notify: (message) => set({ message }),
}));
}

export type EditorStore = ReturnType<typeof createEditorStore>;
