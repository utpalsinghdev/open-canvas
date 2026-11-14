import { useEffect, useState } from 'react';
import { Bot, Pause, Play } from 'lucide-react';
import { connectBrowser } from '../mcp/browser';
import type { ConnectionStatus } from '../mcp/connection';

export function AgentConnection() {
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState<ConnectionStatus>('waiting');
  useEffect(() => {
    if (enabled) return connectBrowser(setStatus);
  }, [enabled]);
  const label = !enabled
    ? 'Agent access paused'
    : status === 'connected'
      ? 'Agent connected'
      : 'Waiting for agent';
  return (
    <details className="agent-menu">
      <summary aria-label={label}>
        <Bot size={15} />
        <span>{label}</span>
      </summary>
      <div className="agent-menu-content">
        <h2>Agent connection</h2>
        <p>
          Local MCP agents automatically access this workspace while this tab is
          open. No pairing code required.
        </p>
        {enabled && status === 'waiting' && (
          <p>
            Waiting for the local MCP server. Start or reconnect your agent.
            This tab will connect automatically.
          </p>
        )}
        <button
          className="agent-access-button"
          onClick={() => setEnabled(!enabled)}
        >
          {enabled ? <Pause size={14} /> : <Play size={14} />}
          {enabled ? 'Pause agent access' : 'Resume agent access'}
        </button>
      </div>
    </details>
  );
}
