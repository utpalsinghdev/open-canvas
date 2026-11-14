import { useEffect, useRef, useState } from 'react';
import type { Camera, DesignNode } from '../editor/model';
import { textBounds } from '../editor/textBounds';

export function CanvasTextEditor({ node, camera, commit, cancel }: {
  node: Extract<DesignNode, { kind: 'text' }>;
  camera: Camera;
  commit: (text: string) => void;
  cancel: () => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  const cancelled = useRef(false);
  const [text, setText] = useState(node.text);
  const bounds = textBounds(node, text, true);
  useEffect(() => { input.current?.focus(); input.current?.select(); }, []);
  return <textarea ref={input} className="canvas-text-editor" aria-label="Edit text on canvas" wrap="off" value={text} maxLength={10_000}
    style={{ left: camera.x + bounds.x * camera.zoom, top: camera.y + bounds.y * camera.zoom,
      width: bounds.width * camera.zoom + 4, height: bounds.height * camera.zoom + 4,
      fontSize: node.fontSize * camera.zoom, fontFamily: node.fontFamily, fontWeight: node.fontWeight,
      color: node.fill, textAlign: node.align, tabSize: 8, transform: `rotate(${node.rotation}deg)`,
      transformOrigin: `${(node.x + node.width / 2 - bounds.x) * camera.zoom + 2}px ${(node.height / 2) * camera.zoom + 2}px`,
    }}
    onChange={(event) => setText(event.currentTarget.value)}
    onBlur={() => { if (!cancelled.current) commit(text); }}
    onKeyDown={(event) => {
      if (event.key === 'Escape') { cancelled.current = true; cancel(); }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') event.currentTarget.blur();
    }} />;
}
