import { useWorkspaceService } from '../workspace/persistence';

/** Show the service's actual destination, not a browser-profile storage claim. */
export function WorkspaceStorage() {
  const { record, storageDirectory } = useWorkspaceService();
  if (!storageDirectory) return null;
  return (
    <details className="workspace-storage">
      <summary>{record ? `Save destination: ${record.name}` : 'Save destination on app server'}</summary>
      <p>Documents save on the machine running Open Cavas, shared by browsers using this service.</p>
      <code>{storageDirectory}{record ? `/${record.id}.json` : '/'}</code>
      {record && <p>Workspace ID: <code>{record.id}</code></p>}
      <p>Main and development use separate directories. Release updates keep this data in place.</p>
    </details>
  );
}
