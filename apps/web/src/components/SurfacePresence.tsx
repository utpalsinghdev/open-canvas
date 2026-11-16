import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

const SurfaceVisible = createContext(true);
export const useSurfaceVisible = () => useContext(SurfaceVisible);

/** Keep only the last visible content for a short, inert exit, never its actions. */
export function SurfacePresence({ visible, children }: { visible: boolean; children: ReactNode }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const [retained, setRetained] = useState<ReactNode>(null);
  useLayoutEffect(() => {
    if (visible) setRetained(children);
  }, [visible, children]);

  useLayoutEffect(() => {
    const element = wrapper.current?.firstElementChild;
    if (!(element instanceof HTMLElement)) return;
    const styles = getComputedStyle(element);
    const interrupted = animation.current?.playState === 'running';
    const from = interrupted ? { opacity: styles.opacity, translate: styles.translate } : null;
    if (animation.current) {
      animation.current.onfinish = null;
      animation.current.cancel();
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    function finish() {
      if (!visible) {
        setRetained(null);
        return;
      }
      animation.current?.cancel();
      animation.current = null;
    }
    if (reduced.matches || typeof element.animate !== 'function') {
      finish();
      return;
    }
    const offset = styles.getPropertyValue('--ui-surface-offset').trim() || '0 4px';
    const duration = Number.parseFloat(styles.getPropertyValue(visible ? '--ui-enter-duration' : '--ui-exit-duration')) || 0;
    const easing = styles.getPropertyValue(visible ? '--ui-enter-easing' : '--ui-exit-easing').trim();
    animation.current = element.animate([
      from ?? { opacity: visible ? 0 : 1, translate: visible ? offset : '0 0' },
      { opacity: visible ? 1 : 0, translate: visible ? '0 0' : offset },
    ], { duration, easing, fill: 'both' });
    animation.current.onfinish = finish;
    const preferenceChanged = () => { if (reduced.matches) finish(); };
    reduced.addEventListener('change', preferenceChanged);
    return () => reduced.removeEventListener('change', preferenceChanged);
  }, [visible]);

  // Keep the filled exit frame until React has removed the retained element.
  useLayoutEffect(() => {
    if (!visible && retained === null) {
      animation.current?.cancel();
      animation.current = null;
    }
  }, [visible, retained]);
  useLayoutEffect(() => () => animation.current?.cancel(), []);

  return <SurfaceVisible value={visible}>
    <div ref={wrapper} className="surface-presence" inert={!visible} aria-hidden={!visible || undefined}>
      {visible ? children : retained}
    </div>
  </SurfaceVisible>;
}
