import { create } from 'zustand';
import { locationSchema, type Location } from '@open-cavas/document/workspace';
import type { ActivityAnchor } from './request-anchors';

const activePageReads = new Set([
  'get_document', 'get_tree', 'get_node', 'get_styles', 'get_selection',
  'export_document', 'export_combined_pdf', 'get_screenshot',
]);
const fileWideCalls = new Set([
  'rename_document', 'create_document', 'open_document',
  'get_design_tokens', 'set_design_tokens',
]);

/** Library/file-wide calls do not establish work on any particular page. */
export function activityTarget(method: string, args: Record<string, unknown>, current: Location) {
  if (fileWideCalls.has(method) || (method === 'export_document' && args.format === 'json')) return null;
  const explicit = locationSchema.safeParse(args.context ?? args);
  if (explicit.success) return explicit.data;
  return activePageReads.has(method) ? { ...current } : null;
}

type PageActivity = { target: Location; anchors: ActivityAnchor[]; pending: boolean };
const MIN_VISIBLE_MS = 600;

export const usePageActivity = create<{ requests: ReadonlyMap<symbol, PageActivity> }>(() => ({
  requests: new Map(),
}));

/** Fast calls leave a neutral receipt, never a false pending or save status.
 * Each request owns its timers; cancellation/disconnect removes even its receipt.
 */
export function beginPageActivity(target: Location, anchors: ActivityAnchor[], onRemove: () => void) {
  const key = Symbol();
  const started = performance.now();
  let ended = false;
  let receipt: ReturnType<typeof setTimeout> | undefined;
  usePageActivity.setState(({ requests }) => ({ requests: new Map(requests).set(key, { target, anchors, pending: true }) }));
  const remove = () => {
    usePageActivity.setState(({ requests }) => {
      if (!requests.has(key)) return { requests };
      const next = new Map(requests);
      next.delete(key);
      return { requests: next };
    });
    onRemove();
  };
  const finish = (immediate = false) => {
    clearTimeout(deadline);
    if (immediate) {
      ended = true;
      clearTimeout(receipt);
      remove();
      return;
    }
    if (ended) return;
    ended = true;
    const remaining = MIN_VISIBLE_MS - (performance.now() - started);
    if (remaining <= 0) { remove(); return; }
    usePageActivity.setState(({ requests }) => ({ requests: new Map(requests).set(key, { target, anchors, pending: false }) }));
    receipt = setTimeout(remove, remaining);
  };
  // Matches the broker deadline. This clears presence, not an uncertain write.
  const deadline = setTimeout(() => finish(true), 30_000);
  return finish;
}

/** Allow the pending label to paint before synchronous editor handlers run.
 * Background tabs use a bounded fallback rather than waiting for animation frames.
 */
export function paintPageActivity() {
  return new Promise<void>((resolve) => {
    let frame = 0;
    const finish = () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      resolve();
    };
    const timer = setTimeout(finish, 100);
    frame = requestAnimationFrame(() => { frame = requestAnimationFrame(finish); });
  });
}
