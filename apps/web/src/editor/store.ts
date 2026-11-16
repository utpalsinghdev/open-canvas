import { useStore } from 'zustand';
import { createEditorStore, type EditorState } from '@open-cavas/engine/state';
import { pruneReviewDrafts } from '../review/drafts';
export type { EditorState } from '@open-cavas/engine/state';

const store = createEditorStore();
function editorHook(): EditorState;
function editorHook<T>(selector: (state: EditorState) => T): T;
function editorHook(selector?: (state: EditorState) => unknown) {
  return useStore(store, selector ?? ((state) => state));
}
export const useEditor = Object.assign(editorHook, {
  getState: store.getState, setState: store.setState, subscribe: store.subscribe,
});
useEditor.subscribe((state, previous) => {
  if (state.workspace !== previous.workspace) pruneReviewDrafts(state.workspace);
});
