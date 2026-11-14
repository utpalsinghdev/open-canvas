import { useCallback, useEffect, useRef, useState } from 'react';
import { getBounds, isHidden, type Camera } from './model';
import { useEditor } from './store';
import { textNodeBounds } from './typography';

export function useCamera() {
  const viewport = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 0.7 });
  const fit = useCallback(() => {
    const element = viewport.current;
    if (!element) return;
    const { document } = useEditor.getState();
    const bounds = getBounds(document.nodes.filter((node) => node.parentId === null && !isHidden(node, document.nodes))
      .map((node) => node.kind === 'text' ? { ...node, ...textNodeBounds(node) } : node));
    if (!bounds) { setCamera({ x: element.clientWidth / 2 - 320, y: element.clientHeight / 2 - 240, zoom: 1 }); return; }
    const zoom = Math.min(1, Math.max(0.05, Math.min((element.clientWidth - 100) / bounds.width, (element.clientHeight - 140) / bounds.height)));
    setCamera({ zoom, x: (element.clientWidth - bounds.width * zoom) / 2 - bounds.x * zoom, y: (element.clientHeight - bounds.height * zoom) / 2 - bounds.y * zoom });
  }, []);
  const zoomTo = useCallback((zoom: number) => {
    const element = viewport.current;
    if (!element) return;
    setCamera((previous) => {
      const next = Math.min(4, Math.max(0.05, zoom));
      const cx = element.clientWidth / 2;
      const cy = element.clientHeight / 2;
      return { zoom: next, x: cx - (cx - previous.x) / previous.zoom * next, y: cy - (cy - previous.y) / previous.zoom * next };
    });
  }, []);
  useEffect(() => { fit(); }, [fit]);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    function wheel(event: WheelEvent) {
      event.preventDefault();
      if (!element) return;
      const rect = element.getBoundingClientRect();
      setCamera((previous) => {
        if (!event.ctrlKey && !event.metaKey) return { ...previous, x: previous.x - event.deltaX, y: previous.y - event.deltaY };
        const zoom = Math.min(4, Math.max(0.05, previous.zoom * Math.exp(-event.deltaY * 0.008)));
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return { zoom, x: x - (x - previous.x) / previous.zoom * zoom, y: y - (y - previous.y) / previous.zoom * zoom };
      });
    }
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, []);
  return { viewport, camera, setCamera, zoomTo, fit };
}
export type CameraControls = ReturnType<typeof useCamera>;
