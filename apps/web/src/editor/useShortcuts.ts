import { useEffect } from 'react';
import { isHidden, isLocked, withChildren, type Tool } from '@open-cavas/document/model';
import { useEditor } from './store';
import { translated } from '@open-cavas/engine/geometry';

type Actions = { fit: () => void; zoomTo: (zoom: number) => void; save: () => void; exportFile: () => void };
const toolKeys: Record<string, Tool | undefined> = { v: 'select', h: 'hand', a: 'artboard', r: 'rectangle', o: 'ellipse', t: 'text' };
export function useShortcuts({ fit, zoomTo, save, exportFile }: Actions) {
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && (event.target.closest('input,textarea,select,[role="dialog"]') || event.target.isContentEditable)) return;
      const state = useEditor.getState();
      const command = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (command) {
        if (key === 'z') { event.preventDefault(); if (event.shiftKey) state.redo(); else state.undo(); }
        if (key === 'y') { event.preventDefault(); state.redo(); }
        if (key === 'd') { event.preventDefault(); state.duplicate(); }
        if (key === 's') { event.preventDefault(); save(); }
        if (key === 'e') { event.preventDefault(); exportFile(); }
        if (key === 'a') { event.preventDefault(); state.select(state.document.nodes.filter((node) => node.kind !== 'artboard' && !isHidden(node, state.document.nodes) && !isLocked(node, state.document.nodes)).map((node) => node.id)); }
        return;
      }
      if (key === 'escape') { state.select([]); state.setTool('select'); return; }
      if (key === 'delete' || key === 'backspace') { event.preventDefault(); state.remove(); return; }
      if (event.shiftKey && key === '!') { event.preventDefault(); fit(); return; }
      if (event.shiftKey && key === ')') { event.preventDefault(); zoomTo(1); return; }
      const tool = toolKeys[key];
      if (tool) { event.preventDefault(); state.setTool(tool); return; }
      const offsets: Record<string, [number, number] | undefined> = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] };
      const offset = offsets[key];
      if (!offset || !state.selectedIds.length) return;
      event.preventDefault();
      const ids = withChildren(state.selectedIds.filter((id) => state.document.nodes.some((node) => node.id === id && !isLocked(node, state.document.nodes))), state.document.nodes);
      const step = event.shiftKey ? 10 : 1;
      state.edit((doc) => ({ ...doc, nodes: doc.nodes.map((node) => ids.has(node.id) ? translated(node, offset[0] * step, offset[1] * step) : node) }));
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [fit, zoomTo, save, exportFile]);
}
