import type { DesignNode } from '@open-cavas/document/model';
import type { ReviewAnchor } from '@open-cavas/document/review';
import { textNodeBounds } from '../typography';

/** Missing layer anchors are retained as feedback, never silently retargeted. */
export function anchorPoint(anchor: ReviewAnchor, nodes: DesignNode[]) {
  if (anchor.kind === 'position') return { x: anchor.x, y: anchor.y };
  const node = nodes.find((node) => node.id === anchor.nodeId);
  if (!node) return null;
  const bounds = node.kind === 'text' ? textNodeBounds(node) : node;
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

export function requireAnchor(anchor: ReviewAnchor, nodes: DesignNode[]) {
  if (!anchorPoint(anchor, nodes))
    throw new Error('Thread anchor layer is missing from this page. Restore the layer with undo or review the retained feedback.');
}
