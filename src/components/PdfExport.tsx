import { useRef, useState } from 'react';
import { FileDown } from 'lucide-react';
import { useEditor } from '../editor/store';
import { download } from '../editor/files';
import { renderPdf } from '../editor/pdf';
import { currentFile } from '../workspace/model';
import { exportActivity } from '../editor/export-activity';

export function PdfExport() {
  const document = useEditor((state) => state.document);
  const selectedIds = useEditor((state) => state.selectedIds);
  const selectedBoards = document.nodes.filter((node) => node.kind === 'artboard' && selectedIds.includes(node.id));
  const [pending, setPending] = useState(false);
  const running = useRef(false);
  const label = selectedBoards.length ? 'Export artboards PDF' : 'Export page PDF';

  async function exportPdf() {
    if (running.current) return;
    running.current = true;
    setPending(true);
    exportActivity.active++;
    const state = useEditor.getState();
    const file = currentFile(state.workspace, state.location);
    const page = file.document.pages.find((page) => page.id === state.location.pageId);
    const snapshot = { ...state.document, name: `${state.document.name} - ${page?.name ?? 'Page'}` };
    state.notify('Exporting PDF…');
    try {
      const result = await renderPdf(snapshot, selectedBoards.length
        ? { kind: 'artboards', artboardIds: selectedBoards.map((board) => board.id) }
        : { kind: 'page' });
      download(new Blob([new Uint8Array(result.bytes)], { type: 'application/pdf' }), `${result.name}.pdf`, 'application/pdf');
      useEditor.getState().notify(`PDF exported. ${result.pages.length} ${result.pages.length === 1 ? 'page' : 'pages'}.`);
    } catch (error) {
      useEditor.getState().notify(error instanceof Error ? error.message : 'PDF export failed.');
    } finally {
      exportActivity.active--;
      exportActivity.lastUsed = Date.now();
      running.current = false;
      setPending(false);
    }
  }

  return <button
    className="export-button"
    aria-label={pending ? 'Exporting PDF' : label}
    title={`${label}. 2× raster artwork, 96 px/in, white page background.`}
    disabled={pending}
    onClick={() => void exportPdf()}
  >
    <FileDown size={14} />
    <span>{pending ? 'Exporting PDF…' : label}</span>
  </button>;
}
