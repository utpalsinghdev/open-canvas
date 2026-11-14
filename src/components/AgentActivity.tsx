import { Bot } from 'lucide-react';
import { useEditor } from '../editor/store';
import { usePageActivity } from '../mcp/page-activity';

/** Editor chrome only: never part of artwork, screenshots, or exports. */
export function AgentActivity() {
  const location = useEditor((state) => state.location);
  const active = usePageActivity((state) => [...state.requests.values()].some((target) =>
    target.projectId === location.projectId &&
    target.fileId === location.fileId &&
    target.pageId === location.pageId
  ));

  return <div className="agent-activity-region" role="status" aria-live="polite" aria-atomic="true">
    {active && <div className="agent-activity">
      <Bot size={14} aria-hidden="true" />
      <span>Agent processing request</span>
    </div>}
  </div>;
}
