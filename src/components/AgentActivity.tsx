import { useEditor } from '../editor/store';
import { usePageActivity } from '../mcp/page-activity';
import { isHidden } from '../editor/model';
import type { CameraControls } from '../editor/useCamera';

/** Editor chrome only: never part of artwork, screenshots, or exports. */
export function AgentActivity({ camera }: Pick<CameraControls, 'camera'>) {
  const location = useEditor((state) => state.location);
  const nodes = useEditor((state) => state.document.nodes);
  const visible = nodes.filter((node) => !isHidden(node, nodes));
  const x = visible.length ? Math.min(...visible.map((node) => node.x)) * camera.zoom + camera.x : 24;
  const y = visible.length ? Math.min(...visible.map((node) => node.y)) * camera.zoom + camera.y - 48 : 18;
  const active = usePageActivity((state) => [...state.requests.values()].some((target) =>
    target.projectId === location.projectId &&
    target.fileId === location.fileId &&
    target.pageId === location.pageId
  ));

  return <div className="agent-activity-region" role="status" aria-live="polite" aria-atomic="true"
    style={{ left: `clamp(16px, ${x}px, calc(100% - 40px))`, top: `clamp(16px, ${y}px, calc(100% - 32px))` }}>
    {active && <div className="agent-activity" title="Agent processing a request on this page">
      <span className="sr-only">Agent processing a request on this page</span>
      <span className="agent-activity-dots" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <i key={index} />)}
      </span>
    </div>}
  </div>;
}
