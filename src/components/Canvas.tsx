import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Maximize, Minus, Plus } from 'lucide-react';
import { createNode, isHidden, isLocked, withChildren, type DesignNode } from '../editor/model';
import { intersects, resized, translated } from '../editor/geometry';
import type { CameraControls } from '../editor/useCamera';
import { useEditor } from '../editor/store';
import { NodeView } from './Artwork';

type Point = { x: number; y: number };
type Gesture =
  | { mode: 'pan'; start: Point; origin: Point }
  | { mode: 'move'; start: Point; delta: Point; ids: Set<string> }
  | { mode: 'resize'; start: Point; delta: Point; node: DesignNode; corner: string }
  | { mode: 'draw'; start: Point; current: Point; node: DesignNode }
  | { mode: 'marquee'; start: Point; current: Point; additive: boolean };

export function Canvas({ controls }: { controls: CameraControls }) {
  const { viewport, camera, setCamera, zoomTo, fit } = controls;
  const { document, selectedIds, tool, select, setTool, edit, patch } = useEditor();
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [space, setSpace] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const textInput = useRef<HTMLTextAreaElement>(null);
  const editing = document.nodes.find((node) => node.id === editingId);
  const editingNode = editing?.kind === 'text' ? editing : null;

  useEffect(() => {
    function down(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && (event.target.closest('input,textarea,select') || event.target.isContentEditable)) return;
      if (event.code === 'Space') { event.preventDefault(); setSpace(true); }
      if (event.key === 'Escape') { setGesture(null); setEditingId(null); }
    }
    const up = (event: KeyboardEvent) => { if (event.code === 'Space') setSpace(false); };
    const blur = () => { setSpace(false); setGesture(null); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);
  useEffect(() => {
    useEditor.setState({ interactionActive: gesture !== null || editingId !== null });
    return () => { useEditor.setState({ interactionActive: false }); };
  }, [gesture, editingId]);
  useEffect(() => { if (editingId) { textInput.current?.focus(); textInput.current?.select(); } }, [editingId]);

  function world(event: PointerEvent): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left - camera.x) / camera.zoom, y: (event.clientY - rect.top - camera.y) / camera.zoom };
  }
  function down(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 && event.button !== 1) return;
    if (editingId) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    useEditor.setState({ interactionActive: true });
    const point = world(event);
    if (tool === 'hand' || space || event.button === 1) {
      setGesture({ mode: 'pan', start: { x: event.clientX, y: event.clientY }, origin: { x: camera.x, y: camera.y } });
      return;
    }
    if (tool !== 'select') {
      const node = createNode(tool, Math.round(point.x), Math.round(point.y));
      if (node.kind !== 'artboard') {
        const board = [...document.nodes].reverse().find((candidate) => candidate.kind === 'artboard' && !isHidden(candidate, document.nodes) && !isLocked(candidate, document.nodes) && point.x >= candidate.x && point.x <= candidate.x + candidate.width && point.y >= candidate.y && point.y <= candidate.y + candidate.height);
        node.parentId = board?.id ?? null;
        if (node.kind === 'text' && board) {
          const rgb = Number.parseInt(board.fill.slice(1), 16);
          const brightness = ((rgb >> 16) * 299 + ((rgb >> 8) & 255) * 587 + (rgb & 255) * 114) / 1000;
          node.fill = brightness > 150 ? '#172015' : '#ffffff';
        } else if (board?.fill.toLowerCase() === node.fill) node.fill = '#65618c';
      }
      setGesture({ mode: 'draw', start: point, current: point, node });
      return;
    }
    const target = event.target instanceof Element ? event.target : null;
    const handle = target?.getAttribute('data-handle');
    const selected = document.nodes.find((node) => node.id === selectedIds[0]);
    if (handle && selected && !isLocked(selected, document.nodes)) {
      setGesture({ mode: 'resize', start: point, delta: { x: 0, y: 0 }, node: selected, corner: handle });
      return;
    }
    const id = target?.closest('[data-node-id]')?.getAttribute('data-node-id');
    const node = document.nodes.find((candidate) => candidate.id === id);
    if (node && !isLocked(node, document.nodes)) {
      const ids = event.shiftKey ? selectedIds.includes(node.id) ? selectedIds.filter((item) => item !== node.id) : [...selectedIds, node.id] : selectedIds.includes(node.id) ? selectedIds : [node.id];
      select(ids);
      const movable = ids.filter((item) => document.nodes.some((candidate) => candidate.id === item && !isLocked(candidate, document.nodes)));
      setGesture({ mode: 'move', start: point, delta: { x: 0, y: 0 }, ids: withChildren(movable, document.nodes) });
    } else {
      if (!event.shiftKey) select([]);
      setGesture({ mode: 'marquee', start: point, current: point, additive: event.shiftKey });
    }
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    if (!gesture) return;
    if (gesture.mode === 'pan') {
      setCamera({ ...camera, x: gesture.origin.x + event.clientX - gesture.start.x, y: gesture.origin.y + event.clientY - gesture.start.y });
      return;
    }
    const current = world(event);
    if (gesture.mode === 'draw' || gesture.mode === 'marquee') setGesture({ ...gesture, current });
    else setGesture({ ...gesture, delta: { x: Math.round(current.x - gesture.start.x), y: Math.round(current.y - gesture.start.y) } });
  }
  function drawnNode(drag: Extract<Gesture, { mode: 'draw' }>) {
    const width = Math.abs(drag.current.x - drag.start.x);
    const height = Math.abs(drag.current.y - drag.start.y);
    if (width < 4 && height < 4) return drag.node;
    return { ...drag.node, x: Math.round(Math.min(drag.start.x, drag.current.x)), y: Math.round(Math.min(drag.start.y, drag.current.y)), width: Math.min(20_000, Math.max(1, Math.round(width))), height: Math.min(20_000, Math.max(1, Math.round(height))) };
  }
  function finish() {
    if (!gesture) return;
    if (gesture.mode === 'move' && (gesture.delta.x || gesture.delta.y)) {
      edit((doc) => ({ ...doc, nodes: doc.nodes.map((node) => gesture.ids.has(node.id) ? translated(node, gesture.delta.x, gesture.delta.y) : node) }));
    }
    if (gesture.mode === 'resize' && (gesture.delta.x || gesture.delta.y)) {
      const resizedNode = resized(gesture.node, gesture.delta.x, gesture.delta.y, gesture.corner);
      const dx = resizedNode.x - gesture.node.x;
      const dy = resizedNode.y - gesture.node.y;
      edit((doc) => ({ ...doc, nodes: doc.nodes.map((node) => node.id === resizedNode.id ? resizedNode : gesture.node.kind === 'artboard' && node.parentId === gesture.node.id ? translated(node, dx, dy) : node) }));
    }
    if (gesture.mode === 'draw') {
      const node = drawnNode(gesture);
      if (edit((doc) => ({ ...doc, nodes: [...doc.nodes, node] }))) {
        select([node.id]);
        setTool('select');
        if (node.kind === 'text') setEditingId(node.id);
      }
    }
    if (gesture.mode === 'marquee') {
      const box = { x: Math.min(gesture.start.x, gesture.current.x), y: Math.min(gesture.start.y, gesture.current.y), width: Math.abs(gesture.current.x - gesture.start.x), height: Math.abs(gesture.current.y - gesture.start.y) };
      const ids = document.nodes.filter((node) => node.kind !== 'artboard' && !isHidden(node, document.nodes) && !isLocked(node, document.nodes) && intersects(box, node)).map((node) => node.id);
      if (box.width > 3 || box.height > 3) select([...new Set([...(gesture.additive ? selectedIds : []), ...ids])]);
    }
    useEditor.setState({ interactionActive: false });
    setGesture(null);
  }
  const nodes = document.nodes.map((node) => {
    if (gesture?.mode === 'move' && gesture.ids.has(node.id)) return translated(node, gesture.delta.x, gesture.delta.y);
    if (gesture?.mode === 'resize') {
      const next = resized(gesture.node, gesture.delta.x, gesture.delta.y, gesture.corner);
      if (node.id === gesture.node.id) return next;
      if (gesture.node.kind === 'artboard' && node.parentId === gesture.node.id) return translated(node, next.x - gesture.node.x, next.y - gesture.node.y);
    }
    return node;
  });
  const preview = gesture?.mode === 'draw' ? drawnNode(gesture) : null;
  const visible = nodes.filter((node) => !isHidden(node, nodes));
  const selected = visible.filter((node) => selectedIds.includes(node.id));

  return <div ref={viewport} className={`canvas-viewport ${space || tool === 'hand' ? 'is-panning' : tool !== 'select' ? 'is-drawing' : ''}`}>
    <svg className="design-canvas" aria-label="Design canvas" onPointerDown={down} onPointerMove={move} onPointerUp={finish} onPointerCancel={() => setGesture(null)} onContextMenu={(event) => event.preventDefault()} onDoubleClick={(event) => {
      // Pointer capture retargets dblclick to the SVG; hit-test the artwork instead.
      const target = event.currentTarget.ownerDocument.elementFromPoint(event.clientX, event.clientY)?.closest('[data-node-id]');
      const node = nodes.find((item) => item.id === target?.getAttribute('data-node-id'));
      if (node?.kind === 'text' && !isLocked(node, nodes)) { useEditor.setState({ interactionActive: true }); select([node.id]); setEditingId(node.id); }
    }}>
      <defs><pattern id="canvas-dots" width={24 * camera.zoom} height={24 * camera.zoom} patternUnits="userSpaceOnUse" x={camera.x} y={camera.y}><circle cx="1" cy="1" r="0.7" className="grid-dot" /></pattern></defs>
      <rect width="100%" height="100%" fill="url(#canvas-dots)" />
      <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.zoom})`}>
        {visible.filter((node) => node.parentId === null).map((node) => node.kind === 'artboard' ? <g key={node.id}>
          <defs><clipPath id={`board-${node.id}`}><rect x={node.x} y={node.y} width={node.width} height={node.height} rx={node.radius} /></clipPath></defs>
          <text className="artboard-label" x={node.x} y={node.y - 14 / camera.zoom} fontSize={11 / camera.zoom} data-node-id={node.id}>{node.name}</text>
          <g clipPath={`url(#board-${node.id})`} opacity={node.opacity}>
            <NodeView node={{ ...node, opacity: 1 }} />
            {visible.filter((child) => child.parentId === node.id).map((child) => <NodeView key={child.id} node={child} />)}
          </g>
        </g> : <NodeView key={node.id} node={node} />)}
        {preview && <NodeView node={preview} />}
        {selected.map((node) => <g key={node.id} transform={`rotate(${node.rotation} ${node.x + node.width / 2} ${node.y + node.height / 2})`}>
          <rect x={node.x} y={node.y} width={node.width} height={node.height} className="selection-outline" strokeWidth={1 / camera.zoom} pointerEvents="none" />
          {selected.length === 1 && !isLocked(node, nodes) && ['nw', 'ne', 'sw', 'se'].map((corner) => <rect key={corner} data-handle={corner} className={`resize-handle ${corner}`} x={node.x + (corner.includes('e') ? node.width : 0) - 4 / camera.zoom} y={node.y + (corner.includes('s') ? node.height : 0) - 4 / camera.zoom} width={8 / camera.zoom} height={8 / camera.zoom} strokeWidth={1 / camera.zoom} />)}
        </g>)}
        {gesture?.mode === 'marquee' && <rect className="marquee" x={Math.min(gesture.start.x, gesture.current.x)} y={Math.min(gesture.start.y, gesture.current.y)} width={Math.abs(gesture.current.x - gesture.start.x)} height={Math.abs(gesture.current.y - gesture.start.y)} strokeWidth={1 / camera.zoom} />}
      </g>
    </svg>
    {editingNode && <textarea ref={textInput} key={editingNode.id} className="canvas-text-editor" aria-label="Edit text on canvas" defaultValue={editingNode.text}
      style={{ left: camera.x + editingNode.x * camera.zoom, top: camera.y + editingNode.y * camera.zoom, width: Math.max(120, editingNode.width * camera.zoom), height: Math.max(60, editingNode.height * camera.zoom), fontSize: editingNode.fontSize * camera.zoom, fontFamily: editingNode.fontFamily, fontWeight: editingNode.fontWeight, color: editingNode.fill, textAlign: editingNode.align, transform: `rotate(${editingNode.rotation}deg)` }}
      onBlur={(event) => { if (event.currentTarget.value !== editingNode.text) patch(editingNode.id, { text: event.currentTarget.value }); setEditingId(null); }}
      onKeyDown={(event) => { if (event.key === 'Escape') { setEditingId(null); } if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') event.currentTarget.blur(); }} />}
    {!nodes.length && <div className="canvas-empty"><h2>Your space to make.</h2><p>Choose artboard, then click or drag on the canvas.</p><button className="text-button" onClick={() => setTool('artboard')}>Create an artboard</button></div>}
    <div className="canvas-caption">{tool === 'select' ? 'Space to pan / Double-click text to edit' : tool === 'hand' ? 'Drag to move around' : `Click or drag to create ${tool}`}</div>
    <div className="zoom-controls">
      <button title="Zoom out" aria-label="Zoom out" onClick={() => zoomTo(camera.zoom / 1.2)}><Minus size={14} /></button>
      <button className="zoom-value" title="Reset zoom to 100%" onClick={() => zoomTo(1)}>{Math.round(camera.zoom * 100)}%</button>
      <button title="Zoom in" aria-label="Zoom in" onClick={() => zoomTo(camera.zoom * 1.2)}><Plus size={14} /></button>
      <span className="control-divider" />
      <button title="Fit canvas (Shift+1)" aria-label="Fit canvas" onClick={fit}><Maximize size={14} /></button>
    </div>
  </div>;
}
