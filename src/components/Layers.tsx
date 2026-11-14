import { useState } from 'react';
import { ChevronDown, ChevronRight, Circle, Eye, EyeOff, Frame, Image, Lock, RectangleHorizontal, Type, Unlock } from 'lucide-react';
import type { DesignNode } from '../editor/model';
import { useEditor } from '../editor/store';
import { Pages } from './Pages';
import { IconButton } from './Button';

const icons = { artboard: Frame, rectangle: RectangleHorizontal, ellipse: Circle, text: Type, image: Image };
export function Layers() {
  const { document, selectedIds, select, patch } = useEditor();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  function row(node: DesignNode, child = false) {
    const Icon = icons[node.kind];
    return <div className={`layer-row ${selectedIds.includes(node.id) ? 'selected' : ''} ${node.hidden ? 'layer-hidden' : ''}`} key={node.id}>
      {node.kind === 'artboard' ? <button className="collapse-button" aria-label={`${collapsed.has(node.id) ? 'Expand' : 'Collapse'} ${node.name}`} aria-expanded={!collapsed.has(node.id)} onClick={() => setCollapsed((previous) => {
        const next = new Set(previous); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next;
      })}>{collapsed.has(node.id) ? <ChevronRight size={12} /> : <ChevronDown size={12} />}</button> : <span className={child ? 'child-indent' : 'root-indent'} />}
      <button className="layer-select" title={node.name} aria-pressed={selectedIds.includes(node.id)} onClick={(event) => select(event.shiftKey ? selectedIds.includes(node.id) ? selectedIds.filter((id) => id !== node.id) : [...selectedIds, node.id] : [node.id])}>
        <Icon size={14} strokeWidth={1.5} /><span>{node.name || node.kind}</span>
      </button>
      <div className="layer-actions">
        <IconButton label={`${node.hidden ? 'Show' : 'Hide'} ${node.name}`} onClick={() => patch(node.id, { hidden: !node.hidden })}>{node.hidden ? <EyeOff size={12} /> : <Eye size={12} />}</IconButton>
        <IconButton label={`${node.locked ? 'Unlock' : 'Lock'} ${node.name}`} onClick={() => patch(node.id, { locked: !node.locked })}>{node.locked ? <Lock size={12} /> : <Unlock size={12} />}</IconButton>
      </div>
    </div>;
  }
  const roots = document.nodes.filter((node) => node.parentId === null).reverse();
  return <aside className="layers-panel" aria-label="Layers">
    <Pages />
    <div className="panel-heading"><span>Layers</span><span className="muted tabular-nums">{document.nodes.length}</span></div>
    <div className="layer-list">{roots.map((node) => <div key={node.id}>
      {row(node)}
      {node.kind === 'artboard' && !collapsed.has(node.id) && document.nodes.filter((child) => child.parentId === node.id).reverse().map((child) => row(child, true))}
    </div>)}
    {!roots.length && <p className="panel-empty">Your layers will appear here.</p>}</div>
    <div className="panel-footer"><span>Local workspace</span><span>v0.1</span></div>
  </aside>;
}
