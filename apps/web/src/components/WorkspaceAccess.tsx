import { useState, type ReactNode } from 'react';
import { download } from '../editor/files';
import { useEditor } from '../editor/store';
import { WorkspaceStorage } from './WorkspaceStorage';
import {
  createServiceWorkspace, openServiceWorkspace, refreshWorkspaces, useWorkspaceService,
} from '../workspace/persistence';

/** Selecting a service workspace never merges or replaces browser-profile data. */
export function WorkspaceAccess({ children }: { children: ReactNode }) {
  const { record, workspaces, busy, error, browserRecovery, storageDirectory } = useWorkspaceService();
  const canCopyBrowser = browserRecovery === 'available';
  const [name, setName] = useState('Personal');
  if (record) return <>{children}{error && <div className="toast" role="alert">Local service unavailable. Keep backups before reloading.</div>}</>;
  return (
    <main className="help-dialog workspace-access" aria-labelledby="workspace-heading">
      <h1 id="workspace-heading">Local workspaces</h1>
      <p>Open a workspace saved on the app server, start a new one, or copy saved browser data.</p>
      <WorkspaceStorage />
      {error && <p role="alert">{error}</p>}
      {!error && storageDirectory && workspaces.length === 0 && <p>No service workspaces found here. This does not mean browser-only work was deleted.</p>}
      <div className="workspace-choices">
        {workspaces.map((workspace) => (
          <button className="export-button" key={workspace.id} disabled={busy} onClick={() => { void openServiceWorkspace(workspace.id); }}>
            Open {workspace.name} ({workspace.id.slice(0, 8)})
          </button>
        ))}
      </div>
      <details className="workspace-storage">
        <summary>Recover browser-only work</summary>
        <p>Reopen the original browser profile at the exact app address used before, including its port. Another profile or address cannot read that browser storage.</p>
        <p>Download a browser backup, then copy into a new service workspace. Project, file, page, and layer IDs stay unchanged. Browser data stays untouched; workspaces never merge automatically.</p>
      </details>
      <p role={browserRecovery === 'unavailable' ? 'alert' : 'status'}>
        {browserRecovery === 'loading' && 'Checking this browser for saved work.'}
        {browserRecovery === 'empty' && 'No saved browser workspace found in this profile at this address. Reopen the original profile and address to recover older work.'}
        {browserRecovery === 'unavailable' && 'Browser storage could not be read safely. Original data was not changed. You can still open a service workspace or create a new one.'}
        {browserRecovery === 'available' && 'Saved browser workspace found. Download a backup before copying valuable work.'}
      </p>
      <label>New workspace name <input className="text-input" value={name} maxLength={160} disabled={busy} onChange={(event) => setName(event.target.value)} /></label>
      <div className="workspace-choices">
        <button className="export-button" disabled={busy || !name.trim()} onClick={() => { void createServiceWorkspace(name.trim(), 'introduction'); }}>Start with introductory canvas</button>
        <button className="export-button" disabled={busy || !name.trim()} onClick={() => { void createServiceWorkspace(name.trim(), 'empty'); }}>Create empty workspace</button>
        <button className="export-button" disabled={busy || !name.trim() || !canCopyBrowser} onClick={() => { void createServiceWorkspace(name.trim(), 'browser'); }}>Copy browser workspace</button>
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
