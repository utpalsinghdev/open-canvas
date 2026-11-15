import { create } from 'zustand';
import { locationSchema, type Location } from '../workspace/model';

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

export const usePageActivity = create<{ requests: ReadonlyMap<symbol, Location> }>(() => ({
  requests: new Map(),
}));

/** Each request owns its cleanup; late completion cannot remove another call. */
export function beginPageActivity(target: Location) {
  const key = Symbol();
  usePageActivity.setState(({ requests }) => ({ requests: new Map(requests).set(key, target) }));
  const finish = () => {
    clearTimeout(deadline);
    usePageActivity.setState(({ requests }) => {
      if (!requests.has(key)) return { requests };
      const next = new Map(requests);
      next.delete(key);
      return { requests: next };
    });
  };
  // Matches the broker deadline. This clears presence, not an uncertain write.
  const deadline = setTimeout(finish, 30_000);
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
