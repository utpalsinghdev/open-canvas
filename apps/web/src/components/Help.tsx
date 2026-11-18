import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import changelog from '../../CHANGELOG.md?raw';
import { version } from '../../package.json';

const releaseNotes = (changelog.split(/^## /m).find((section) => section.split('\n', 1)[0].trim() === version) ?? '')
  .split(/^(?=- |### )/m)
  .filter((entry) => entry.startsWith('- '))
  .map((entry) => entry.slice(2).replace(/^[a-f0-9]{7,40}: /, '').trim());

export function Help({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="help-dialog" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) ref.current?.close(); }}>
    <div className="dialog-heading"><h2>Find your way around</h2><IconButton label="Close help" onClick={() => ref.current?.close()}><X size={18} /></IconButton></div>
    <details className="help-changelog">
      <summary>Changelog · v{version}</summary>
      {releaseNotes.length > 0
        ? <ul>{releaseNotes.map((note) => <li key={note}>{note}</li>)}</ul>
        : <p>No bundled notes for this version.</p>}
      <a href="https://github.com/utpalsinghdev/open-canvas/releases" target="_blank" rel="noreferrer">All releases on GitHub</a>
      {document.querySelector('meta[name="cavas-profile"]')?.getAttribute('content') === 'installed' && (
        <p>In a terminal, run <code>open-cavas update --check</code> to check for updates.</p>
      )}
    </details>
    <div className="shortcut-list">{[
      ['Select / Hand', 'V / H'], ['Artboard / Rectangle / Ellipse / Text', 'A / R / O / T'],
      ['Pan', 'Space + drag'], ['Pan / Zoom', 'Scroll / Ctrl + scroll'], ['Fit canvas / Actual size', 'Shift + 1 / Shift + 0'],
      ['Add to selection', 'Shift + click'], ['Move / Move 10 px', 'Arrow / Shift + arrow'], ['Undo / Redo', '⌘/Ctrl + Z / Shift + Z'],
      ['Duplicate', '⌘/Ctrl + D'], ['Download JSON', '⌘/Ctrl + S'], ['Export SVG', '⌘/Ctrl + E'], ['Delete selection', 'Delete / Backspace'],
    ].map(([action, shortcut]) => <div key={action}><span>{action}</span><kbd>{shortcut}</kbd></div>)}</div>
    <p>Double-click text to edit. Drag a corner to resize. Select an artboard to export only that artboard.</p>
    <p>Work saves to the selected workspace on the app server. Download JSON for an editable backup; SVG and PDF export artwork. Starter artwork is an editable example.</p>
    <p>Choose Add comment, then click a layer or canvas position. Save feedback in the small box beside it. Review opens all threads. Escape closes a comment without discarding its draft; Ctrl/Cmd+Enter submits it.</p>
  </dialog>;
}
