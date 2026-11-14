import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { connectBrowser } from '../mcp/browser';
import { useEditor } from '../editor/store';
import { setWorkspaceAccess, switchServiceWorkspace, useWorkspaceService } from '../workspace/persistence';

/** Workspace opt-out persists independently of tabs and browser profiles. */
export function AgentConnection() {
  const record = useWorkspaceService((state) => state.record);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (record?.agentEnabled) return connectBrowser(() => {});
  }, [record?.agentEnabled]);
  return <>
    <button disabled={busy} onClick={() => {
      setBusy(true);
      void setWorkspaceAccess().catch((error: unknown) => {
        useEditor.getState().notify(error instanceof Error ? error.message : 'Could not change agent access.');
      }).finally(() => setBusy(false));
    }}>
      {record?.agentEnabled ? <Pause size={15} /> : <Play size={15} />}
      {record?.agentEnabled ? 'Pause agent access' : 'Resume agent access'}
    </button>
    <button onClick={switchServiceWorkspace}>Switch local workspace</button>
  </>;
}
