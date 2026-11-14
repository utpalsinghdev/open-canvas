import { useEffect, useRef, useState } from 'react';
import type { Camera, DesignNode } from '../editor/model';
import { fontStatus, textContentBounds, textNodeBounds } from '../editor/typography';

export function CanvasTextEditor({ node, camera, commit, cancel }: {
  node: Extract<DesignNode, { kind: 'text' }>;
  camera: Camera;
  commit: (text: string) => void;
  cancel: () => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  const cancelled = useRef(false);
  const [text, setText] = useState(node.text);
  const frame = textNodeBounds(node);
  const content = textContentBounds({ ...node, text });
  const wraps = node.wrap && node.sizing !== 'auto-width';
  const bounds = wraps ? { ...content, x: frame.x, width: frame.width } : content;
  useEffect(() => { input.current?.focus(); input.current?.select(); }, []);
  return <textarea ref={input} className="canvas-text-editor" aria-label="Edit text on canvas" wrap={wraps ? 'soft' : 'off'} value={text} maxLength={10_000}
    style={{ left: camera.x + bounds.x * camera.zoom, top: camera.y + bounds.y * camera.zoom,
      width: bounds.width * camera.zoom + 4, height: bounds.height * camera.zoom + 4,
      fontSize: node.fontSize * camera.zoom, lineHeight: node.lineHeight, letterSpacing: `${node.letterSpacing * camera.zoom}px`,
      fontFamily: fontStatus(node.fontFamily).resolved, fontWeight: node.fontWeight,
      color: node.fill, textAlign: node.align, whiteSpace: wraps ? 'pre-wrap' : 'pre', tabSize: 8,
      transform: `rotate(${node.rotation}deg)`,
      transformOrigin: `${(frame.x + frame.width / 2 - bounds.x) * camera.zoom + 2}px ${(frame.height / 2) * camera.zoom + 2}px`,
    }}
    onChange={(event) => setText(event.currentTarget.value)}
    onBlur={() => { if (!cancelled.current) commit(text); }}
    onKeyDown={(event) => {
      if (event.key === 'Escape') { cancelled.current = true; cancel(); }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') event.currentTarget.blur();
    }} />;
}
