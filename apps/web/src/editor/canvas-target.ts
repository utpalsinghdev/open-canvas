import { isHidden, isLocked, type DesignNode } from '@open-cavas/document/model';

/** Resolve the browser's painted hit target identically for Select hover and clicks. */
export function selectableCanvasNode(target: EventTarget | null, nodes: DesignNode[]) {
  const id = target instanceof Element ? target.closest('[data-node-id]')?.getAttribute('data-node-id') : null;
  const node = nodes.find((node) => node.id === id);
  return node && !isHidden(node, nodes) && !isLocked(node, nodes) ? node : undefined;
}
