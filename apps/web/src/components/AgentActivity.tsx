import { useEditor } from '../editor/store';
import { usePageActivity } from '../mcp/page-activity';
import { isHidden } from '@open-cavas/document/model';
import type { CameraControls } from '../editor/useCamera';
import type { ActivityAnchor } from '../mcp/request-anchors';

/** Editor chrome anchored to requested artwork, never part of exports. */
export function AgentActivity({ camera }: Pick<CameraControls, 'camera'>) {
  const location = useEditor((state) => state.location);
  const nodes = useEditor((state) => state.document.nodes);
  const requests = usePageActivity((state) => state.requests);
  const marks = new Map<string, { x: number; y: number; pending: boolean }>();
  const visible = nodes.filter((node) => !isHidden(node, nodes));
  const pageOrigin: ActivityAnchor = {
    key: 'page',
    x: visible.length ? Math.min(...visible.map((node) => node.x)) : 0,
    y: visible.length ? Math.min(...visible.map((node) => node.y)) : 0,
  };
  for (const { target, anchors, pending } of requests.values()) {
    if (target.projectId !== location.projectId || target.fileId !== location.fileId || target.pageId !== location.pageId) continue;
    for (const anchor of anchors.length ? anchors : [pageOrigin]) {
      const node = anchor.nodeId ? nodes.find((item) => item.id === anchor.nodeId) : undefined;
      if (node && isHidden(node, nodes)) continue;
      const x = node?.x ?? anchor.x;
      const y = node?.y ?? anchor.y;
      const key = `${x}:${y}`;
      marks.set(key, { x, y, pending: pending || Boolean(marks.get(key)?.pending) });
    }
  }
  return <>{[...marks].map(([key, { x, y, pending }]) => {
    const status = pending ? 'pending' : 'recent';
    const label = pending ? 'Agent processing a request on this artwork' : 'Recent agent request on this artwork';
    return <div key={key} className="agent-activity-region" role="status" aria-live="polite" aria-atomic="true"
      style={{ left: `clamp(16px, ${x * camera.zoom + camera.x}px, calc(100% - 56px))`, top: `clamp(16px, ${y * camera.zoom + camera.y - 52}px, calc(100% - 44px))` }}>
      <div className="agent-activity" data-state={status} title={label}>
        <span className="sr-only">{label}</span>
        <span className="agent-activity-dots" aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
        </span>
      </div>
    </div>;
  })}</>;
}
