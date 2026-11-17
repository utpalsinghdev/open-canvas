import { isHidden, isLocked, type Bounds, type DesignNode } from '@open-cavas/document/model';
import { intersects } from '@open-cavas/engine/geometry';
import { textNodeBounds } from '@open-cavas/engine/typography';

/** Share the tentative marquee set with release, without changing selection during a drag. */
export function marqueeSelection({ start, current, additive, nodes, selectedIds }: {
  start: Pick<Bounds, 'x' | 'y'>;
  current: Pick<Bounds, 'x' | 'y'>;
  additive: boolean;
  nodes: DesignNode[];
  selectedIds: string[];
}) {
  const box = {
    x: Math.min(start.x, current.x), y: Math.min(start.y, current.y),
    width: Math.abs(current.x - start.x), height: Math.abs(current.y - start.y),
  };
  if (box.width <= 3 && box.height <= 3) return { box, ids: null };
  const candidates = nodes.filter((node) => node.kind !== 'artboard' && !isHidden(node, nodes) && !isLocked(node, nodes)
    && intersects(box, node.kind === 'text' ? { ...node, ...textNodeBounds(node) } : node)).map((node) => node.id);
  return { box, ids: [...new Set([...(additive ? selectedIds : []), ...candidates])] };
}
