import { Download } from 'lucide-react';
import { currentFile } from '@open-cavas/document/workspace';
import { useEditor } from '../editor/store';
import { useWorkspaceService } from '../workspace/persistence';
import { TooltipIconButton } from './Button';

const kindLabels = { artboard: 'Artboard', rectangle: 'Rectangle', ellipse: 'Ellipse', text: 'Text', image: 'Image' };

export function EditorFooter({ onSave }: { onSave: () => void }) {
  const { document, workspace, location, selectedIds } = useEditor();
  const workspaceName = useWorkspaceService((state) => state.record?.name);
  const page = currentFile(workspace, location).document.pages.find((page) => page.id === location.pageId);
  const selected = document.nodes.filter((node) => selectedIds.includes(node.id));
  const node = selected[0];
  const board = node?.kind === 'artboard' ? node : document.nodes.find((item) => item.kind === 'artboard' && item.id === node?.parentId);
  const artboards = document.nodes.filter((item) => item.kind === 'artboard').length;
  const context = selected.length > 1 ? `${selected.length} selected`
    : node ? `${kindLabels[node.kind]} · ${board?.name || node.name || 'No artboard'}`
      : `No selection · ${artboards} ${artboards === 1 ? 'artboard' : 'artboards'} · ${document.nodes.length} ${document.nodes.length === 1 ? 'layer' : 'layers'}`;
  return <footer className="status-bar">
    <span className="selection-context" title={context}>{context}</span>
    <span className="workspace-context" title={`Workspace: ${workspaceName ?? ''} / Page: ${page?.name ?? ''}`}>Workspace: {workspaceName} / {page?.name}</span>
    <TooltipIconButton className="icon-button footer-backup" label="Download editable backup (JSON)" onClick={onSave}>
      <Download size={15} />
    </TooltipIconButton>
  </footer>;
}
