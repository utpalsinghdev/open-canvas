import { memo, useMemo } from 'react';
import type { DesignNode } from '@open-cavas/document/model';
import { NodeView } from './Artwork';

/** Camera translation changes the enclosing SVG transform, not the artwork tree. */
export const CanvasArtwork = memo(function CanvasArtwork({ nodes, zoom, revealing }: { nodes: DesignNode[]; zoom: number; revealing: ReadonlySet<string> }) {
  const { roots, children } = useMemo(() => {
    const roots: DesignNode[] = [];
    const children = new Map<string, DesignNode[]>();
    for (const node of nodes) {
      if (node.parentId === null) roots.push(node);
      else {
        const siblings = children.get(node.parentId);
        if (siblings) siblings.push(node);
        else children.set(node.parentId, [node]);
      }
    }
    return { roots, children };
  }, [nodes]);

  return roots.map((node) => node.kind === 'artboard' ? <g key={node.id} className={revealing.has(node.id) ? 'agent-created-node' : undefined}>
    <defs><clipPath id={`board-${node.id}`}><rect x={node.x} y={node.y} width={node.width} height={node.height} rx={node.radius} /></clipPath></defs>
    <text className="artboard-label" x={node.x} y={node.y - 14 / zoom} fontSize={11 / zoom} data-node-id={node.id}>{node.name}</text>
    <g clipPath={`url(#board-${node.id})`} opacity={node.opacity}>
      <NodeView node={{ ...node, opacity: 1 }} />
      {children.get(node.id)?.map((child) => <g key={child.id} className={revealing.has(child.id) ? 'agent-created-node' : undefined}><NodeView node={child} /></g>)}
    </g>
  </g> : <g key={node.id} className={revealing.has(node.id) ? 'agent-created-node' : undefined}><NodeView node={node} /></g>);
});
