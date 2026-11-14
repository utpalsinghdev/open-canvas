import { create } from 'zustand';
import { newId, documentSchema, isLocked, withChildren, type DesignDocument, type DesignNode, type Tool } from './model';
import { starterDocument } from './seed';

const STORAGE_KEY = 'open-cavas.document.v1';
const HISTORY_LIMIT = 80;
function loadDocument(): { document: DesignDocument; message: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { document: starterDocument(), message: '' };
    const parsed = documentSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return { document: parsed.data, message: '' };
    return { document: starterDocument(), message: 'Saved data could not be read. Import a JSON backup to recover.' };
  } catch {
    return { document: starterDocument(), message: 'Browser storage is unavailable. Download JSON to keep your work.' };
  }
}
const loaded = loadDocument();
type EditorState = {
  document: DesignDocument;
  selectedIds: string[];
  tool: Tool;
  past: DesignDocument[];
  future: DesignDocument[];
  message: string;
  saveState: 'saved' | 'pending' | 'failed';
  edit: (update: (doc: DesignDocument) => DesignDocument) => boolean;
  select: (ids: string[]) => void;
  setTool: (tool: Tool) => void;
  patch: (id: string, patch: Partial<DesignNode>) => void;
  remove: () => void;
  duplicate: () => void;
  reorder: (direction: 'front' | 'back') => void;
  undo: () => void;
  redo: () => void;
  replace: (doc: DesignDocument) => void;
  notify: (message: string) => void;
};
export const useEditor = create<EditorState>((set, get) => ({
  document: loaded.document, message: loaded.message, selectedIds: [], tool: 'select', past: [], future: [], saveState: 'saved',
  edit: (update) => {
    const state = get();
    const next = update(state.document);
    if (next === state.document) return false;
    const valid = documentSchema.safeParse(next);
    if (!valid.success) { get().notify('Change exceeds document limits. Check geometry and layer count.'); return false; }
    set({ document: next, past: [...state.past, state.document].slice(-HISTORY_LIMIT), future: [], saveState: 'pending' });
    return true;
  },
  select: (ids) => set({ selectedIds: ids }),
  setTool: (tool) => set({ tool }),
  patch: (id, patch) => get().edit((doc) => {
    const target = doc.nodes.find((node) => node.id === id);
    if (!target) return doc;
    const result = documentSchema.safeParse({ ...doc, nodes: doc.nodes.map((node) => node.id === id ? { ...node, ...patch } : node) });
    if (!result.success) { get().notify('Value is outside the supported range.'); return doc; }
    const dx = (patch.x ?? target.x) - target.x;
    const dy = (patch.y ?? target.y) - target.y;
    return { ...result.data, nodes: result.data.nodes.map((node) => target.kind === 'artboard' && node.parentId === id ? { ...node, x: node.x + dx, y: node.y + dy } : node) };
  }),
  remove: () => {
    const { document, selectedIds } = get();
    const ids = withChildren(selectedIds.filter((id) => document.nodes.some((node) => node.id === id && !isLocked(node, document.nodes))), document.nodes);
    if (!ids.size) return;
    get().edit((doc) => ({ ...doc, nodes: doc.nodes.filter((node) => !ids.has(node.id)) }));
    set({ selectedIds: [] });
  },
  duplicate: () => {
    const { document, selectedIds } = get();
    const ids = withChildren(selectedIds, document.nodes);
    const mapping = new Map([...ids].map((id) => [id, newId()]));
    const copies = document.nodes.filter((node) => ids.has(node.id)).map((node): DesignNode => {
      const common = {
        id: mapping.get(node.id) ?? node.id, name: `${node.name.slice(0, 155)} copy`, x: node.x + 24, y: node.y + 24,
      };
      return node.kind === 'artboard' ? { ...node, ...common, parentId: null } : { ...node, ...common, parentId: node.parentId ? mapping.get(node.parentId) ?? node.parentId : null };
    });
    if (!copies.length || document.nodes.length + copies.length > 1000) { get().notify('Select layers to duplicate, within the 1,000-layer limit.'); return; }
    if (get().edit((doc) => ({ ...doc, nodes: [...doc.nodes, ...copies] }))) {
      set({ selectedIds: selectedIds.map((id) => mapping.get(id) ?? id) });
    }
  },
  reorder: (direction) => get().edit((doc) => {
    const ids = new Set(get().selectedIds);
    const selected = doc.nodes.filter((node) => ids.has(node.id));
    if (!selected.length) return doc;
    const rest = doc.nodes.filter((node) => !ids.has(node.id));
    return { ...doc, nodes: direction === 'front' ? [...rest, ...selected] : [...selected, ...rest] };
  }),
  undo: () => {
    const { past, document, future } = get();
    const previous = past.at(-1);
    if (previous) set({ document: previous, past: past.slice(0, -1), future: [document, ...future].slice(0, HISTORY_LIMIT), selectedIds: [], saveState: 'pending' });
  },
  redo: () => {
    const { past, document, future } = get();
    const next = future[0];
    if (next) set({ document: next, past: [...past, document].slice(-HISTORY_LIMIT), future: future.slice(1), selectedIds: [], saveState: 'pending' });
  },
  replace: (document) => { get().edit(() => document); set({ selectedIds: [], tool: 'select' }); },
  notify: (message) => set({ message }),
}));

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(useEditor.getState().document));
    useEditor.setState({ saveState: 'saved' });
  } catch {
    useEditor.setState({ saveState: 'failed', message: 'Local save failed. Storage may be full. Download JSON to keep your work.' });
  }
}
useEditor.subscribe((state, previous) => {
  if (state.document === previous.document) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 350);
});
window.addEventListener('pagehide', () => { clearTimeout(saveTimer); if (useEditor.getState().saveState !== 'saved') persist(); });
