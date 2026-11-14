import type { DesignNode } from './model';

type TextNode = Extract<DesignNode, { kind: 'text' }>;
let context: CanvasRenderingContext2D | null = null;

/** Text is unwrapped; its alignment anchor belongs to the stored frame. */
export function textBounds(node: TextNode, text = node.text, editing = false) {
  context ??= document.createElement('canvas').getContext('2d');
  if (context) context.font = `${node.fontWeight} ${node.fontSize}px "${node.fontFamily}"`;
  const lines = text.split('\n');
  const measure = (line: string) => context?.measureText(line).width ?? line.length * node.fontSize;
  const tabWidth = measure(' ') * 8;
  const widths = lines.map((line) => {
    // SVG's default whitespace policy collapses spaces; textarea preserves them.
    if (!editing) return measure(line.replace(/[\t\r ]+/g, ' ').trim());
    return line.split('\t').reduce((width, part, index) => {
      const start = index === 0 ? width : (Math.floor(width / tabWidth) + 1) * tabWidth;
      return start + measure(part);
    }, 0);
  });
  const width = Math.max(node.fontSize / 2, ...widths);
  const offset = node.align === 'center' ? (node.width - width) / 2 : node.align === 'right' ? node.width - width : 0;
  return { x: node.x + offset, y: node.y, width, height: lines.length * node.fontSize * 1.2 };
}
