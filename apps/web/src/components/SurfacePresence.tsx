import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

const SurfaceVisible = createContext(true);
/** Live visibility for content that SurfacePresence keeps mounted while it exits. */
export const useSurfaceVisible = () => useContext(SurfaceVisible);

/**
 * Keeps a surface mounted until its CSS exit transition finishes. `motion.css` owns
 * timing: this component only marks the surface open or closed, makes the exiting
 * copy inert, and unmounts it once no animation is left. With reduced motion no
 * transition runs, so unmounting is immediate. The exit shows the last open content,
 * and `inert` keeps its stale handlers from ever running.
 */
export function SurfacePresence({ visible, children }: { visible: boolean; children: ReactNode }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const latest = useRef(children);
  if (visible) latest.current = children;
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  useLayoutEffect(() => {
    if (visible || !mounted) return;
    let current = true;
    // Reopening, a canceled transition or a reduced-motion change settles these promises too.
    const animations = wrapper.current?.getAnimations({ subtree: true }) ?? [];
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (current) setMounted(false);
    });
    return () => { current = false; };
  }, [visible, mounted]);

  if (!mounted) return null;
  return <SurfaceVisible value={visible}>
    <div ref={wrapper} className="surface-presence" data-presence={visible ? 'open' : 'closed'} inert={!visible}>
      {latest.current}
    </div>
  </SurfaceVisible>;
}
