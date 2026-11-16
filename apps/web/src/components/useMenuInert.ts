import { useLayoutEffect, useRef } from 'react';

/** Native details closes immediately, even while CSS paints its exiting contents. */
export function useMenuInert() {
  const ref = useRef<HTMLDetailsElement>(null);
  useLayoutEffect(() => {
    const details = ref.current;
    const items = details?.querySelector<HTMLElement>(':scope > div');
    if (!details || !items) return;
    const update = () => { items.inert = !details.open; };
    update();
    const observer = new MutationObserver(update);
    observer.observe(details, { attributes: true, attributeFilter: ['open'] });
    return () => observer.disconnect();
  }, []);
  return ref;
}
