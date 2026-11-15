import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ChevronDown } from 'lucide-react';
import { useEditor } from '../editor/store';
import { download } from '../editor/files';
import { renderPdf } from '../editor/pdf';
import { currentFile } from '../workspace/model';
import { exportActivity } from '../editor/export-activity';

export function ExportMenu({ onSvg }: { onSvg: () => void }) {
  const artwork = useEditor((state) => state.document);
  const selectedIds = useEditor((state) => state.selectedIds);
  const selectedBoards = artwork.nodes.filter((node) => node.kind === 'artboard' && selectedIds.includes(node.id));
  const [pending, setPending] = useState(false);
  const running = useRef(false);
  const menu = useRef<HTMLDetailsElement>(null);
  const label = `PDF · ${selectedBoards.length ? 'Selected artboards' : 'Current page'}`;
  const svgLabel = `SVG · ${selectedIds.length === 1 && selectedBoards.length === 1 ? 'Selected artboard' : 'Current page'}`;

  function closeMenu(restoreFocus = false) {
    if (!menu.current?.open) return;
    menu.current.open = false;
    if (restoreFocus) menu.current.querySelector('summary')?.focus();
  }
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !menu.current?.contains(event.target)) closeMenu();
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !menu.current?.open) return;
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape, true);
    };
  }, []);

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

  return <details
    ref={menu}
    className="export-menu"
    onKeyDown={(event) => event.stopPropagation()}
    onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) closeMenu();
    }}
  >
    <summary className="export-button" aria-label="Export artwork">
      <ArrowDownToLine size={14} />
      <span>Export</span>
      <ChevronDown size={12} />
    </summary>
    <div className="export-menu-items" role="group" aria-label="Artwork export formats">
      <button onClick={() => { closeMenu(true); onSvg(); }}>{svgLabel}</button>
      <button
        title={`${label}. 2× raster artwork, 96 px/in, white page background.`}
        disabled={pending}
        onClick={() => { closeMenu(true); void exportPdf(); }}
      >
        {pending ? 'PDF · Exporting…' : label}
      </button>
    </div>
  </details>;
}
