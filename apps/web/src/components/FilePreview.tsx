import { memo, useEffect, useId, useRef, useState } from 'react';
import { File } from 'lucide-react';
import { getBounds, isHidden } from '@open-cavas/document/model';
import type { FileDocument } from '@open-cavas/document/workspace';
import { textNodeBounds } from '@open-cavas/engine/typography';
import { useFontState } from '../editor/typography';
import { NodeView } from './Artwork';

type Props = { document: FileDocument; pageId: string };

/** Mount native artwork only near the visible library area, including after scrolling. */
export const FilePreview = memo(function FilePreview(props: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '200px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <span ref={ref} className="file-preview" aria-hidden="true">
    {visible && <PreviewArtwork {...props} />}
  </span>;
});

/** Per-preview IDs keep clipping isolated when the same file is duplicated. */
function PreviewArtwork({ document, pageId }: Props) {
  const prefix = useId();
  useFontState();
  const page = document.pages.find((page) => page.id === pageId) ?? document.pages[0];
  const visible = page.nodes.filter((node) => !isHidden(node, page.nodes));
  const roots = visible.filter((node) => node.parentId === null);
  const bounds = getBounds(roots.map((node) => node.kind === 'text'
    ? { ...node, ...textNodeBounds(node) } : node));
  if (!bounds) return <span className="file-preview-empty"><File size={28} strokeWidth={1} /><span>Empty page</span></span>;
  const padding = Math.max(bounds.width, bounds.height) * 0.08;
  return <svg viewBox={`${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`} aria-hidden="true" focusable="false">
      {roots.map((node) => {
        if (node.kind !== 'artboard') return <NodeView key={node.id} node={node} />;
        const clip = `${prefix}-${node.id}`;
        return <g key={node.id}>
          <defs><clipPath id={clip}><rect x={node.x} y={node.y} width={node.width} height={node.height} rx={node.radius} /></clipPath></defs>
          <g clipPath={`url(#${clip})`} opacity={node.opacity}>
            <NodeView node={{ ...node, opacity: 1 }} />
            {visible.filter((child) => child.parentId === node.id).map((child) => <NodeView key={child.id} node={child} />)}
          </g>
        </g>;
      })}
    </svg>;
}
