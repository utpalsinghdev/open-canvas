import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { connectBrowser } from '../mcp/browser';

/** Keep automatic connection alive; access controls live in the File menu. */
export function AgentConnection() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    if (enabled) return connectBrowser(() => {});
  }, [enabled]);

  return <button onClick={() => setEnabled((current) => !current)}>
    {enabled ? <Pause size={15} /> : <Play size={15} />}
    {enabled ? 'Pause agent access' : 'Resume agent access'}
  </button>;
}
