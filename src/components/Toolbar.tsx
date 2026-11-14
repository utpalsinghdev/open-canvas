import { Circle, Frame, Hand, ImagePlus, MousePointer2, RectangleHorizontal, Type, Undo2, Redo2 } from 'lucide-react';
import type { Tool } from '../editor/model';
import { useEditor } from '../editor/store';
import { IconButton } from './Button';

const tools = [
  { id: 'select', label: 'Select (V)', icon: MousePointer2 },
  { id: 'hand', label: 'Hand (H)', icon: Hand },
  { id: 'artboard', label: 'Artboard (A)', icon: Frame },
  { id: 'rectangle', label: 'Rectangle (R)', icon: RectangleHorizontal },
  { id: 'ellipse', label: 'Ellipse (O)', icon: Circle },
  { id: 'text', label: 'Text (T)', icon: Type },
] satisfies { id: Tool; label: string; icon: typeof Circle }[];

export function Toolbar({ onImage }: { onImage: () => void }) {
  const { tool, setTool, undo, redo, past, future } = useEditor();
  return <div className="tool-strip" role="toolbar" aria-label="Drawing tools">
    <div className="tool-group">{tools.map(({ id, label, icon: Icon }) => <IconButton key={id} label={label} aria-pressed={tool === id} onClick={() => setTool(id)}><Icon size={18} strokeWidth={1.6} /></IconButton>)}
      <IconButton label="Add image" onClick={onImage}><ImagePlus size={18} strokeWidth={1.6} /></IconButton>
    </div>
    <span className="control-divider" />
    <div className="tool-group">
      <IconButton label="Undo (Ctrl/Cmd+Z)" onClick={undo} disabled={!past.length}><Undo2 size={17} /></IconButton>
      <IconButton label="Redo (Ctrl/Cmd+Shift+Z)" onClick={redo} disabled={!future.length}><Redo2 size={17} /></IconButton>
    </div>
  </div>;
}
