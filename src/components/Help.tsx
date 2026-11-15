import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import { IntroductionContent } from './Introduction';

export function Help({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [section, setSection] = useState<'shortcuts' | 'introduction'>('shortcuts');
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} role="dialog" className={`help-dialog ${section === 'introduction' ? 'introduction-dialog' : ''}`} aria-label="Help" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) ref.current?.close(); }}>
    <div className="dialog-heading"><h2>Find your way around</h2><IconButton label="Close help" onClick={() => ref.current?.close()}><X size={18} /></IconButton></div>
    <nav className="help-tabs" aria-label="Help sections">
      <button aria-pressed={section === 'shortcuts'} onClick={() => setSection('shortcuts')}>Keyboard shortcuts</button>
      <button aria-pressed={section === 'introduction'} onClick={() => setSection('introduction')}>Introduction</button>
    </nav>
    {section === 'introduction' ? <IntroductionContent /> : <>
    <div className="shortcut-list">{[
      ['Select / Hand', 'V / H'], ['Artboard / Rectangle / Ellipse / Text', 'A / R / O / T'],
      ['Pan', 'Space + drag'], ['Pan / Zoom', 'Scroll / Ctrl + scroll'], ['Fit canvas / Actual size', 'Shift + 1 / Shift + 0'],
      ['Add to selection', 'Shift + click'], ['Move / Move 10 px', 'Arrow / Shift + arrow'], ['Undo / Redo', '⌘/Ctrl + Z / Shift + Z'],
      ['Duplicate', '⌘/Ctrl + D'], ['Download JSON', '⌘/Ctrl + S'], ['Export SVG', '⌘/Ctrl + E'], ['Delete selection', 'Delete / Backspace'],
    ].map(([action, shortcut]) => <div key={action}><span>{action}</span><kbd>{shortcut}</kbd></div>)}</div>
    <p>Double-click text to edit. Drag a corner to resize. Select an artboard to export only that artboard.</p>
    <p>Work saves to the local workspace service on this machine. Download JSON for a portable backup. Images stay local. Starter artwork is an editable example.</p>
    </> }
  </dialog>;
}
