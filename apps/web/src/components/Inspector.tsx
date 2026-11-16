import { useEffect, useState } from 'react';
import { AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowUpToLine, Copy, File, Frame, Lock, MousePointer2, Trash2, Unlock } from 'lucide-react';
import { currentFile } from '@open-cavas/document/workspace';
import { isLocked, type DesignNode } from '@open-cavas/document/model';
import { useEditor } from '../editor/store';
import { fontDefinition, textLayout, textNodeBounds } from '@open-cavas/engine/typography';
import { fontStatus, useFontState } from '../editor/typography';
import { FontFamilyField } from './FontFamilyField';
import { IconButton } from './Button';

type NumericProps = { label: string; value: number; onCommit: (value: number) => void; min?: number; max?: number; disabled?: boolean };
function NumericField({ label, value, onCommit, min, max, disabled }: NumericProps) {
  const [draft, setDraft] = useState(String(Math.round(value * 100) / 100));
  useEffect(() => setDraft(String(Math.round(value * 100) / 100)), [value]);
  function commit() {
    const next = Number(draft);
    if (!draft.trim() || !Number.isFinite(next)) { setDraft(String(value)); return; }
    const bounded = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, next));
    setDraft(String(bounded));
    if (bounded !== value) onCommit(bounded);
  }
  return <label className="number-field"><span>{label}</span><input aria-label={label} type="number" step="any" min={min} max={max} disabled={disabled} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></label>;
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
  const loadedFonts = useFontState();
  const status = fontStatus(node.fontFamily, loadedFonts);
  const layout = textLayout(node);
  useEffect(() => setText(node.text), [node.text]);
  return <section className="inspector-section"><h3>Typography</h3>
    <FontFamilyField value={node.fontFamily} onCommit={(fontFamily) => {
      const [min, max] = fontDefinition(fontFamily).weight;
      patch(node.id, { fontFamily, fontWeight: Math.max(min, Math.min(max, node.fontWeight)) });
    }} />
    <p className="font-status" role="status">{status.availability === 'loading' ? `Loading ${status.requested}` : status.availability === 'unavailable' ? `${status.requested} not detected; showing ${status.resolved}` : status.availability === 'unverified' ? `${status.requested} availability unverified; browser may substitute` : status.method === 'browser-metrics' ? `${status.requested} detected in this browser` : `${status.requested} available`}</p>
    <div className="field-grid"><NumericField label="Font size" value={node.fontSize} min={6} max={500} onCommit={(fontSize) => patch(node.id, { fontSize })} />
      <NumericField label="Font weight" value={node.fontWeight} min={fontDefinition(node.fontFamily).weight[0]} max={fontDefinition(node.fontFamily).weight[1]} onCommit={(fontWeight) => patch(node.id, { fontWeight })} />
      <NumericField label="Line height" value={node.lineHeight} min={0.5} max={4} onCommit={(lineHeight) => patch(node.id, { lineHeight })} />
      <NumericField label="Tracking" value={node.letterSpacing} min={-100} max={100} onCommit={(letterSpacing) => patch(node.id, { letterSpacing })} />
    </div>
    <label className="stacked-field">Text sizing<select aria-label="Text sizing" value={node.sizing} onChange={(event) => {
      if (event.target.value === 'fixed' || event.target.value === 'auto-height' || event.target.value === 'auto-width') patch(node.id, { sizing: event.target.value });
    }}><option value="fixed">Fixed</option><option value="auto-height">Auto height</option><option value="auto-width">Auto width</option></select></label>
    <label className="text-option"><input type="checkbox" checked={node.wrap} onChange={(event) => patch(node.id, { wrap: event.target.checked })} /> Wrap text to width</label>
    <div className="alignment-controls">{([{ value: 'left', icon: AlignLeft }, { value: 'center', icon: AlignCenter }, { value: 'right', icon: AlignRight }] satisfies { value: typeof node.align; icon: typeof AlignLeft }[]).map(({ value, icon: Icon }) => <IconButton key={value} label={`Align ${value}`} aria-pressed={node.align === value} onClick={() => patch(node.id, { align: value })}><Icon size={15} /></IconButton>)}</div>
    <p className="font-status" role="status">{layout.overflow ? `Text overflows ${node.sizing === 'fixed' ? 'fixed bounds' : 'measurement'}` : 'No text overflow'}{layout.measured ? '' : ' · measurement uses fallback font'}</p>
    <textarea aria-label="Text content" className="content-input" value={text} maxLength={10_000} onChange={(event) => setText(event.target.value)} onBlur={() => { if (text !== node.text) patch(node.id, { text }); }} />
  </section>;
}

export function Inspector() {
  const { document, workspace, location, selectedIds, patch, duplicate, remove, reorder } = useEditor();
  const page = currentFile(workspace, location).document.pages.find((page) => page.id === location.pageId);
  const selected = document.nodes.filter((node) => selectedIds.includes(node.id));
  const node = selected[0];
  const locked = node ? isLocked(node, document.nodes) : false;
  const textBounds = node?.kind === 'text' ? textNodeBounds(node) : null;
  return <aside id="properties-panel" className="inspector-panel" aria-label="Properties">
    <div className="panel-heading"><span>Properties</span><span className="muted">{node && selected.length === 1 ? node.kind : 'Page'}</span></div>
    {!node ? <div className="inspector-welcome">
      <div className="page-overview-title"><File size={18} /><h2>{page?.name}</h2></div>
      <dl className="page-overview"><div><dt>Artboards</dt><dd>{document.nodes.filter((node) => node.kind === 'artboard').length}</dd></div><div><dt>Layers</dt><dd>{document.nodes.length}</dd></div></dl>
      <div className="selection-guidance"><MousePointer2 size={20} strokeWidth={1.5} /><h3>Select to edit</h3><p>Choose a layer on the canvas or in Layers to see its properties.</p></div>
      <div className="inspector-shortcuts"><span><Frame size={14} />Artboard<kbd>A</kbd></span><span><MousePointer2 size={14} />Select<kbd>V</kbd></span></div>
    </div>
      : selected.length > 1 ? <section className="inspector-section"><h3>{selected.length} layers selected</h3><p className="muted">Drag to move together. Shift-click to change selection.</p><div className="layer-command-grid"><button onClick={duplicate}><Copy size={16} />Duplicate</button><button onClick={remove}><Trash2 size={16} />Delete</button></div></section>
        : <>
          <div className="selected-heading"><TextField label="Layer name" value={node.name} onCommit={(name) => patch(node.id, { name })} /><IconButton label={node.locked ? 'Unlock layer' : 'Lock layer'} onClick={() => patch(node.id, { locked: !node.locked })}>{node.locked ? <Lock size={14} /> : <Unlock size={14} />}</IconButton></div>
          {locked && <p className="locked-note">Layer or parent is locked.</p>}
          <fieldset disabled={locked} className="properties-fields">
            <section className="inspector-section"><h3>Position</h3>
              <div className="field-grid"><NumericField label="X" value={node.x} min={-100_000} max={100_000} onCommit={(x) => patch(node.id, { x })} /><NumericField label="Y" value={node.y} min={-100_000} max={100_000} onCommit={(y) => patch(node.id, { y })} />
                {node.kind !== 'artboard' && <NumericField label="Rotation" value={node.rotation} min={-360} max={360} onCommit={(rotation) => patch(node.id, { rotation })} />}
              </div>
              {node.kind !== 'artboard' && <label className="stacked-field">Artboard<select aria-label="Parent artboard" value={node.parentId ?? ''} onChange={(event) => patch(node.id, { parentId: event.target.value || null })}><option value="">None</option>{document.nodes.filter((item) => item.kind === 'artboard').map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}</select></label>}
            </section>
            <section className="inspector-section"><h3>Dimensions</h3>
              <div className="field-grid">
                <NumericField label="Width" value={textBounds?.width ?? node.width} min={1} max={20_000} disabled={node.kind === 'text' && node.sizing === 'auto-width'} onCommit={(width) => patch(node.id, { width })} /><NumericField label="Height" value={textBounds?.height ?? node.height} min={1} max={20_000} disabled={node.kind === 'text' && node.sizing === 'auto-height'} onCommit={(height) => patch(node.id, { height })} />
                {(node.kind === 'rectangle' || node.kind === 'artboard') && <NumericField label="Radius" value={node.radius} min={0} max={10_000} onCommit={(radius) => patch(node.id, { radius })} />}
              </div>
            </section>
            {node.kind === 'text' && <TextProperties key={node.id} node={node} />}
            <section className="inspector-section"><h3>Appearance</h3>{node.kind !== 'image' && <FillField key={node.id} node={node} />}<NumericField label="Opacity %" value={node.opacity * 100} min={0} max={100} onCommit={(opacity) => patch(node.id, { opacity: opacity / 100 })} /></section>
            <section className="inspector-section"><h3>Arrange</h3><div className="layer-command-grid"><button aria-label="Bring to front" onClick={() => reorder('front')}><ArrowUpToLine size={16} />To front</button><button aria-label="Send to back" onClick={() => reorder('back')}><ArrowDownToLine size={16} />To back</button><button aria-label="Duplicate layer" onClick={duplicate}><Copy size={16} />Duplicate</button><button aria-label="Delete layer" onClick={remove}><Trash2 size={16} />Delete</button></div></section>
          </fieldset>
        </>}
  </aside>;
}
