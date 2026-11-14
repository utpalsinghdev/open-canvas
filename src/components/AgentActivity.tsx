import { useMemo } from 'react';
import { useEditor } from '../editor/store';
import { usePageActivity } from '../mcp/page-activity';
import type { CameraControls } from '../editor/useCamera';

/** Editor chrome only: never part of artwork, screenshots, or exports. */
export function AgentActivity({ camera }: Pick<CameraControls, 'camera'>) {
  const location = useEditor((state) => state.location);
  const nodes = useEditor((state) => state.document.nodes);
  const origin = useMemo(() => {
    const hidden = new Set(nodes.filter((node) => node.hidden).map((node) => node.id));
    let x = Infinity;
    let y = Infinity;
    for (const node of nodes) {
      if (node.hidden || (node.parentId && hidden.has(node.parentId))) continue;
      x = Math.min(x, node.x);
      y = Math.min(y, node.y);
    }
    return Number.isFinite(x) ? { x, y } : null;
  }, [nodes]);
  const x = origin ? origin.x * camera.zoom + camera.x : 24;
  const y = origin ? origin.y * camera.zoom + camera.y - 52 : 18;
  const active = usePageActivity((state) => [...state.requests.values()].some((target) =>
    target.projectId === location.projectId &&
    target.fileId === location.fileId &&
    target.pageId === location.pageId
  ));

  return <div className="agent-activity-region" role="status" aria-live="polite" aria-atomic="true"
    style={{ left: `clamp(16px, ${x}px, calc(100% - 56px))`, top: `clamp(16px, ${y}px, calc(100% - 44px))` }}>
    {active && <div className="agent-activity" title="Agent processing a request on this page">
      <span className="sr-only">Agent processing a request on this page</span>
      <span className="agent-activity-dots" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
      </span>
    </div>}
  </div>;
}
