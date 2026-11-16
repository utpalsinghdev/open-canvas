import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';

export function Help({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="help-dialog" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) ref.current?.close(); }}>
    <div className="dialog-heading"><h2>Find your way around</h2><IconButton label="Close help" onClick={() => ref.current?.close()}><X size={18} /></IconButton></div>
    <div className="shortcut-list">{[
      ['Select / Hand', 'V / H'], ['Artboard / Rectangle / Ellipse / Text', 'A / R / O / T'],
      ['Pan', 'Space + drag'], ['Pan / Zoom', 'Scroll / Ctrl + scroll'], ['Fit canvas / Actual size', 'Shift + 1 / Shift + 0'],
      ['Add to selection', 'Shift + click'], ['Move / Move 10 px', 'Arrow / Shift + arrow'], ['Undo / Redo', '⌘/Ctrl + Z / Shift + Z'],
      ['Duplicate', '⌘/Ctrl + D'], ['Download JSON', '⌘/Ctrl + S'], ['Export SVG', '⌘/Ctrl + E'], ['Delete selection', 'Delete / Backspace'],
    ].map(([action, shortcut]) => <div key={action}><span>{action}</span><kbd>{shortcut}</kbd></div>)}</div>
    <p>Double-click text to edit. Drag a corner to resize. Select an artboard to export only that artboard.</p>
    <p>Work saves in this browser. Download JSON for a portable backup. Images stay local. Starter artwork is an editable example.</p>
    <p>Choose Add comment, then click a layer or canvas position. Save feedback in the small box beside it. Review opens all threads. Escape closes a comment without discarding its draft; Ctrl/Cmd+Enter submits it.</p>
  </dialog>;
}
