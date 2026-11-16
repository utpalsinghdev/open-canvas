import { useEffect, useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import type { DesignNode } from '@open-cavas/document/model';
import { textNodeBounds } from '@open-cavas/engine/typography';
import type { CameraControls } from '../editor/useCamera';

export function CommentTargetPreview({ controls, nodes }: {
  controls: CameraControls;
  nodes: DesignNode[];
}) {
  const [hover, setHover] = useState<{ nodeId: string | null; x: number; y: number } | null>(null);
  useEffect(() => {
    const viewport = controls.viewport.current;
    const canvas = viewport?.querySelector('.design-canvas');
    if (!canvas || !viewport) return;
    function move(event: Event) {
      if (!(event instanceof PointerEvent) || event.pointerType === 'touch' || !viewport) return;
      const bounds = viewport.getBoundingClientRect();
      setHover({
        nodeId: event.target instanceof Element ? event.target.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null : null,
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    }
    const clear = () => setHover(null);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', clear);
    canvas.addEventListener('pointerdown', clear);
    return () => {
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', clear);
      canvas.removeEventListener('pointerdown', clear);
    };
  }, [controls.viewport]);
  const viewport = controls.viewport.current;
  if (!hover || !viewport) return null;
  const node = nodes.find((node) => node.id === hover.nodeId);
  const bounds = node?.kind === 'text' ? textNodeBounds(node) : node;
  const board = nodes.find((board) => board.kind === 'artboard' && board.id === node?.parentId);
  const { camera } = controls;
  return <>
    {node && bounds && <svg className="comment-target-outline" aria-hidden="true">
      <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.zoom})`}>
        {board && <defs><clipPath id="comment-target-clip"><rect x={board.x} y={board.y} width={board.width} height={board.height} rx={board.radius} /></clipPath></defs>}
        <g clipPath={board ? 'url(#comment-target-clip)' : undefined}>
          <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height}
            transform={`rotate(${node.rotation} ${bounds.x + bounds.width / 2} ${bounds.y + bounds.height / 2})`}
            strokeWidth={1.5 / camera.zoom} />
        </g>
      </g>
    </svg>}
    <div className="comment-target-hint" role="status" style={{
      left: Math.max(12, Math.min(hover.x + 16, viewport.clientWidth - 252)),
      top: Math.max(12, Math.min(hover.y + 20, viewport.clientHeight - 48)),
    }}><MessageSquarePlus size={14} /><span>{node ? `Comment on ${node.name || node.kind}` : 'Comment at canvas position'}</span></div>
  </>;
}
