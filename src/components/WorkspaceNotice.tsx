import { X } from 'lucide-react';
import { useEditor } from '../editor/store';
import { IconButton } from './Button';

/** Recovery and action feedback remain visible on Home as well as in the editor. */
export function WorkspaceNotice({ onProjects }: { onProjects: () => void }) {
  const { persistenceFailure, message, notify } = useEditor();
  const feedback = message && <>
    <span>{message}</span>
    <IconButton label="Dismiss message" onClick={() => notify('')}>
      <X size={14} />
    </IconButton>
  </>;
  if (persistenceFailure) return (
    <div className="toast persistence-notice" role="alert">
      <span>{persistenceFailure.recovery}</span>
      <details>
        <summary>Storage error details</summary>
        <p>{persistenceFailure.name}: {persistenceFailure.message}</p>
      </details>
      <button className="text-button" onClick={onProjects}>
        Open Projects for workspace backup
      </button>
      {message && <div className="persistence-action-message" role="status">{feedback}</div>}
    </div>
  );
  return message ? <div className="toast" role="status">{feedback}</div> : null;
}
