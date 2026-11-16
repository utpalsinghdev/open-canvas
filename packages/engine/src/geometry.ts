import type { Bounds, DesignNode } from '@open-cavas/document/model';

export function translated(node: DesignNode, dx: number, dy: number): DesignNode {
  return { ...node, x: node.x + dx, y: node.y + dy };
}

/** Resize in the node's local axes, keeping the opposite corner stationary. */
export function resized(node: DesignNode, dx: number, dy: number, corner: string): DesignNode {
  const angle = node.rotation * Math.PI / 180;
  const localX = dx * Math.cos(angle) + dy * Math.sin(angle);
  const localY = -dx * Math.sin(angle) + dy * Math.cos(angle);
  const west = corner.includes('w');
  const north = corner.includes('n');
  const width = corner.includes('w') || corner.includes('e')
    ? Math.min(20_000, Math.max(1, node.width + (west ? -localX : localX))) : node.width;
  const height = corner.includes('n') || corner.includes('s')
    ? Math.min(20_000, Math.max(1, node.height + (north ? -localY : localY))) : node.height;
  const shiftX = (width - node.width) * (west ? -0.5 : 0.5);
  const shiftY = (height - node.height) * (north ? -0.5 : 0.5);
  return { ...node, width, height,
    x: node.x + node.width / 2 + shiftX * Math.cos(angle) - shiftY * Math.sin(angle) - width / 2,
    y: node.y + node.height / 2 + shiftX * Math.sin(angle) + shiftY * Math.cos(angle) - height / 2,
  };
}

export function intersects(a: Bounds, b: Bounds) {
  return a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y;
}
