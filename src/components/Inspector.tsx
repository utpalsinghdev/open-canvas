import { useEffect, useState } from 'react';
import { AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowUpToLine, Copy, Lock, Trash2, Unlock } from 'lucide-react';
import { fonts, isLocked, type DesignNode } from '../editor/model';
import { useEditor } from '../editor/store';
import { IconButton } from './Button';

type NumericProps = { label: string; value: number; onCommit: (value: number) => void; min?: number; max?: number };
function NumericField({ label, value, onCommit, min, max }: NumericProps) {
  const [draft, setDraft] = useState(String(Math.round(value * 100) / 100));
  useEffect(() => setDraft(String(Math.round(value * 100) / 100)), [value]);
  function commit() {
    const next = Number(draft);
    if (!draft.trim() || !Number.isFinite(next)) { setDraft(String(value)); return; }
    const bounded = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, next));
    setDraft(String(bounded));
    if (bounded !== value) onCommit(bounded);
  }
  return <label className="number-field"><span>{label}</span><input aria-label={label} type="number" step="any" min={min} max={max} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></label>;
}
function TextField({ label, value, onCommit }: { label: string; value: string; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <input className="text-input" aria-label={label} value={draft} maxLength={160} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (draft !== value) onCommit(draft); }} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} />;
}
function FillField({ node }: { node: DesignNode }) {
  const patch = useEditor((state) => state.patch);
  const [draft, setDraft] = useState(node.fill);
  useEffect(() => setDraft(node.fill), [node.fill]);
  return <div className="fill-field"><input type="color" aria-label="Fill color" value={/^#[0-9a-f]{6}$/i.test(draft) ? draft : node.fill} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (draft !== node.fill) patch(node.id, { fill: draft }); }} />
    <input aria-label="Fill hex" value={draft.toUpperCase()} maxLength={7} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (/^#[0-9a-f]{6}$/i.test(draft)) { if (draft !== node.fill) patch(node.id, { fill: draft }); } else setDraft(node.fill); }} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
  </div>;
}
function TextProperties({ node }: { node: Extract<DesignNode, { kind: 'text' }> }) {
  const patch = useEditor((state) => state.patch);
  const [text, setText] = useState(node.text);
  useEffect(() => setText(node.text), [node.text]);
  return <section className="inspector-section"><h3>Typography</h3>
    <select aria-label="Font family" value={node.fontFamily} onChange={(event) => {
      const font = fonts.find((value) => value === event.target.value); if (font) patch(node.id, { fontFamily: font });
    }}>{fonts.map((font) => <option key={font}>{font}</option>)}</select>
    <div className="field-grid"><NumericField label="Font size" value={node.fontSize} min={6} max={500} onCommit={(fontSize) => patch(node.id, { fontSize })} />
      <select aria-label="Font weight" value={node.fontWeight} onChange={(event) => {
        const value = event.target.value;
        if (value === '400' || value === '500' || value === '600' || value === '700') patch(node.id, { fontWeight: value });
      }}><option value="400">Regular</option><option value="500">Medium</option><option value="600">Semibold</option><option value="700">Bold</option></select>
    </div>
    <div className="alignment-controls">{([{ value: 'left', icon: AlignLeft }, { value: 'center', icon: AlignCenter }, { value: 'right', icon: AlignRight }] satisfies { value: typeof node.align; icon: typeof AlignLeft }[]).map(({ value, icon: Icon }) => <IconButton key={value} label={`Align ${value}`} aria-pressed={node.align === value} onClick={() => patch(node.id, { align: value })}><Icon size={15} /></IconButton>)}</div>
    <textarea aria-label="Text content" className="content-input" value={text} maxLength={10_000} onChange={(event) => setText(event.target.value)} onBlur={() => { if (text !== node.text) patch(node.id, { text }); }} />
  </section>;
}

export function Inspector() {
  const { document, selectedIds, patch, duplicate, remove, reorder } = useEditor();
  const selected = document.nodes.filter((node) => selectedIds.includes(node.id));
  const node = selected[0];
  const locked = node ? isLocked(node, document.nodes) : false;
  return <aside id="properties-panel" className="inspector-panel" aria-label="Properties">
    <div className="panel-heading"><span>Design</span><span className="muted">{node && selected.length === 1 ? node.kind : 'Canvas'}</span></div>
    {!node ? <div className="inspector-welcome"><div className="mini-canvas-mark" /><h2>Make space for ideas.</h2><p>Select a layer to edit its properties.</p><div className="welcome-shortcuts"><span>Select</span><kbd>V</kbd><span>Artboard</span><kbd>A</kbd><span>Rectangle</span><kbd>R</kbd><span>Text</span><kbd>T</kbd></div><p className="local-note">Stored in this browser.<br />Download JSON for a backup.</p></div>
      : selected.length > 1 ? <section className="inspector-section"><h3>{selected.length} layers selected</h3><p className="muted">Drag to move together. Shift-click to change selection.</p><div className="alignment-controls"><IconButton label="Duplicate selected layers" onClick={duplicate}><Copy size={16} /></IconButton><IconButton label="Delete selected layers" onClick={remove}><Trash2 size={16} /></IconButton></div></section>
        : <>
          <div className="selected-heading"><TextField label="Layer name" value={node.name} onCommit={(name) => patch(node.id, { name })} /><IconButton label={node.locked ? 'Unlock layer' : 'Lock layer'} onClick={() => patch(node.id, { locked: !node.locked })}>{node.locked ? <Lock size={14} /> : <Unlock size={14} />}</IconButton></div>
          {locked && <p className="locked-note">Layer or parent is locked.</p>}
          <fieldset disabled={locked} className="properties-fields">
            <section className="inspector-section"><h3>Layout</h3>
              <div className="field-grid"><NumericField label="X" value={node.x} min={-100_000} max={100_000} onCommit={(x) => patch(node.id, { x })} /><NumericField label="Y" value={node.y} min={-100_000} max={100_000} onCommit={(y) => patch(node.id, { y })} />
                <NumericField label="Width" value={node.width} min={1} max={20_000} onCommit={(width) => patch(node.id, { width })} /><NumericField label="Height" value={node.height} min={1} max={20_000} onCommit={(height) => patch(node.id, { height })} />
                {node.kind !== 'artboard' && <NumericField label="Rotation" value={node.rotation} min={-360} max={360} onCommit={(rotation) => patch(node.id, { rotation })} />}
                {(node.kind === 'rectangle' || node.kind === 'artboard') && <NumericField label="Radius" value={node.radius} min={0} max={10_000} onCommit={(radius) => patch(node.id, { radius })} />}
              </div>
              {node.kind !== 'artboard' && <label className="stacked-field">Artboard<select aria-label="Parent artboard" value={node.parentId ?? ''} onChange={(event) => patch(node.id, { parentId: event.target.value || null })}><option value="">None</option>{document.nodes.filter((item) => item.kind === 'artboard').map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}</select></label>}
            </section>
            <section className="inspector-section"><h3>Appearance</h3>{node.kind !== 'image' && <FillField key={node.id} node={node} />}<NumericField label="Opacity %" value={node.opacity * 100} min={0} max={100} onCommit={(opacity) => patch(node.id, { opacity: opacity / 100 })} /></section>
            {node.kind === 'text' && <TextProperties key={node.id} node={node} />}
            <section className="inspector-section"><h3>Arrange</h3><div className="alignment-controls"><IconButton label="Bring to front" onClick={() => reorder('front')}><ArrowUpToLine size={16} /></IconButton><IconButton label="Send to back" onClick={() => reorder('back')}><ArrowDownToLine size={16} /></IconButton><IconButton label="Duplicate layer" onClick={duplicate}><Copy size={16} /></IconButton><IconButton label="Delete layer" onClick={remove}><Trash2 size={16} /></IconButton></div></section>
          </fieldset>
        </>}
  </aside>;
}
