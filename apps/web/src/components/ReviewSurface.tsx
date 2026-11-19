import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { CameraControls } from '../editor/useCamera';

export function ReviewSurface({ controls, point, compact, composing, onClose, children }: {
  controls: CameraControls;
  point: { x: number; y: number } | null;
  compact: boolean;
  composing: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({ left: 12, top: 12 });
  useLayoutEffect(() => {
    const surface = ref.current;
    const viewport = controls.viewport.current;
    if (!surface || !viewport || !compact) return;
    function place() {
      if (!surface || !viewport) return;
      const x = point ? point.x * controls.camera.zoom + controls.camera.x : viewport.clientWidth;
      const y = point ? point.y * controls.camera.zoom + controls.camera.y : 12;
      const width = surface.offsetWidth;
      const height = surface.offsetHeight;
      const preferred = x + 20 + width <= viewport.clientWidth - 12 ? x + 20 : x - width - 20;
      setPosition({
        left: Math.max(12, Math.min(preferred, viewport.clientWidth - width - 12)),
        top: Math.max(12, Math.min(y - 16, viewport.clientHeight - height - 56)),
      });
    }
    place();
    const observer = new ResizeObserver(place);
    observer.observe(surface);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [compact, point?.x, point?.y, controls.camera, controls.viewport]);

  useLayoutEffect(() => {
    const previous = document.activeElement;
    const surface = ref.current;
    (surface?.querySelector<HTMLElement>('textarea, .review-filter') ?? surface?.querySelector<HTMLElement>('button'))?.focus({ preventScroll: true });
    return () => {
      if ((previous instanceof HTMLElement || previous instanceof SVGElement) && previous.isConnected && surface?.contains(document.activeElement))
        previous.focus({ preventScroll: true });
    };
  }, []);

  return <aside ref={ref} className={`${compact ? 'review-popover' : 'review-panel'}${composing ? ' review-draft' : ''}`}
    style={compact ? position : undefined} aria-label={composing ? 'New comment' : compact ? 'Comment' : 'Review threads'}
    onKeyDown={(event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && event.target instanceof HTMLTextAreaElement) {
        event.preventDefault();
        event.target.form?.requestSubmit();
      }
    }}>{children}</aside>;
}
