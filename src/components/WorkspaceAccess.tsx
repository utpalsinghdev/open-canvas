import { useState, type ReactNode } from 'react';
import { download } from '../editor/files';
import { useEditor } from '../editor/store';
import {
  createServiceWorkspace, openServiceWorkspace, refreshWorkspaces, useWorkspaceService,
} from '../workspace/persistence';

/** Selecting a service workspace never merges or replaces browser-profile data. */
export function WorkspaceAccess({ children }: { children: ReactNode }) {
  const { record, workspaces, busy, error, canCopyBrowser } = useWorkspaceService();
  const [name, setName] = useState('Personal');
  if (record) return <>{children}{error && <div className="toast" role="alert">Local service unavailable. Keep backups before reloading.</div>}</>;
  return (
    <main className="help-dialog" aria-labelledby="workspace-heading">
      <h1 id="workspace-heading">Local workspaces</h1>
      <p>Documents live on this machine. MCP can work here with the browser closed.</p>
      <p>Choose a workspace, or copy this browser’s workspace into a new one. Browser storage stays untouched. No workspaces are merged.</p>
      {error && <p role="alert">{error}</p>}
      <div className="workspace-choices">
        {workspaces.map((workspace) => (
          <button className="export-button" key={workspace.id} disabled={busy} onClick={() => { void openServiceWorkspace(workspace.id); }}>
            Open {workspace.name} ({workspace.id.slice(0, 8)})
          </button>
        ))}
      </div>
      <label>New workspace name <input className="text-input" value={name} maxLength={160} disabled={busy} onChange={(event) => setName(event.target.value)} /></label>
      <div className="workspace-choices">
        <button className="export-button" disabled={busy || !name.trim() || !canCopyBrowser} onClick={() => { void createServiceWorkspace(name.trim(), true); }}>Copy browser workspace</button>
        <button className="export-button" disabled={busy || !name.trim()} onClick={() => { void createServiceWorkspace(name.trim(), false); }}>Create empty workspace</button>
        <button className="export-button" disabled={busy || !canCopyBrowser} onClick={() => {
          download(JSON.stringify(useEditor.getState().workspace, null, 2), 'browser-workspace.cavas.json', 'application/json');
        }}>Download browser backup</button>
        <button className="export-button" disabled={busy} onClick={() => {
          void refreshWorkspaces().catch((error: unknown) => useWorkspaceService.setState({ error: error instanceof Error ? error.message : 'Service unavailable.' }));
        }}>Refresh workspaces</button>
      </div>
      <p>Agent access starts enabled for a new workspace. Pause it persistently from the File menu.</p>
    </main>
  );
}
