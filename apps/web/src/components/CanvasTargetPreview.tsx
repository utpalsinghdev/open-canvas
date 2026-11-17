import { useEffect, useId, useRef, useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import type { DesignNode } from '@open-cavas/document/model';
import { textNodeBounds } from '@open-cavas/engine/typography';
import type { CameraControls } from '../editor/useCamera';
import { selectableCanvasNode } from '../editor/canvas-target';
import { CanvasOutline } from './CanvasOutline';

export function CanvasTargetPreview({ controls, nodes, tool, selectedIds }: {
  controls: CameraControls;
  nodes: DesignNode[];
  tool: 'select' | 'comment';
  selectedIds: string[];
}) {
  const [hover, setHover] = useState<{ nodeId: string | null; x: number; y: number } | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const clipId = useId();
  useEffect(() => {
    const viewport = controls.viewport.current;
    const canvas = viewport?.querySelector('.design-canvas');
    if (!canvas || !viewport) return;
    function refresh() {
      if (!pointer.current || !viewport || !canvas) return;
      const target = canvas.ownerDocument.elementFromPoint(pointer.current.x, pointer.current.y);
      if (!target || !canvas.contains(target)) { setHover(null); return; }
      const nodeId = tool === 'select' ? selectableCanvasNode(target, nodes)?.id ?? null
        : target.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null;
      const bounds = viewport.getBoundingClientRect();
      const next = { nodeId, x: pointer.current.x - bounds.left, y: pointer.current.y - bounds.top };
      setHover((previous) => previous?.nodeId === next.nodeId && (tool === 'select' || (previous.x === next.x && previous.y === next.y)) ? previous : next);
    }
    const clear = () => { pointer.current = null; setHover(null); };
    function move(event: Event) {
      if (!(event instanceof PointerEvent)) return;
      if (event.pointerType === 'touch' || event.buttons !== 0) { clear(); return; }
      pointer.current = { x: event.clientX, y: event.clientY };
      refresh();
    }
    // Re-hit-test a stationary pointer after artwork or camera changes.
    refresh();
    const observer = new ResizeObserver(refresh);
    observer.observe(viewport);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', clear);
    canvas.addEventListener('pointerdown', clear);
    canvas.addEventListener('pointercancel', clear);
    window.addEventListener('blur', clear);
    return () => {
      observer.disconnect();
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', clear);
      canvas.removeEventListener('pointerdown', clear);
      canvas.removeEventListener('pointercancel', clear);
      window.removeEventListener('blur', clear);
    };
  }, [controls.viewport, controls.camera, nodes, tool]);
  const viewport = controls.viewport.current;
  if (!hover || !viewport) return null;
  const node = nodes.find((node) => node.id === hover.nodeId);
  if (tool === 'select' && (!node || selectedIds.includes(node.id))) return null;
  const bounds = node?.kind === 'text' ? textNodeBounds(node) : node;
  const board = nodes.find((board) => board.kind === 'artboard' && board.id === node?.parentId);
  const { camera } = controls;
  return <>
    {node && bounds && <svg className={`${tool}-target-outline`} aria-hidden="true">
      <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.zoom})`}>
        {board && <defs><clipPath id={clipId}><rect x={board.x} y={board.y} width={board.width} height={board.height} rx={board.radius} /></clipPath></defs>}
        <g clipPath={board ? `url(#${clipId})` : undefined}>
          <CanvasOutline zoom={camera.zoom} x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height}
            transform={`rotate(${node.rotation} ${bounds.x + bounds.width / 2} ${bounds.y + bounds.height / 2})`}
            strokeWidth={1.5} strokeDasharray={tool === 'select' ? `${4 / camera.zoom} ${3 / camera.zoom}` : undefined} />
        </g>
      </g>
    </svg>}
    {tool === 'comment' && <div className="comment-target-hint" role="status" style={{
      left: Math.max(12, Math.min(hover.x + 16, viewport.clientWidth - 252)),
      top: Math.max(12, Math.min(hover.y + 20, viewport.clientHeight - 48)),
    }}><MessageSquarePlus size={14} /><span>{node ? `Comment on ${node.name || node.kind}` : 'Comment at canvas position'}</span></div>}
  </>;
}
