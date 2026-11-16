import { createNode, nodeSchema, type DesignNode } from '@open-cavas/document/model';
import { parseCssFontFamily } from '@open-cavas/document/font-family';
import { textLayout } from '@open-cavas/engine/typography';
import type { HtmlNode, HtmlParser } from './html-parser';

const tags = new Set([
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'aside',
  'nav',
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'button',
  'label',
  'img',
  'ul',
  'li',
  'a',
]);
const properties = new Set([
  'position',
  'left',
  'top',
  'width',
  'height',
  'padding',
  'background',
  'background-color',
  'color',
  'font-size',
  'font-family',
  'font-weight',
  'line-height',
  'letter-spacing',
  'white-space',
  'border-radius',
  'opacity',
  'text-align',
  'display',
]);
function pixels(value: string, fallback: number) {
  if (!value) return fallback;
  if (!/^-?\d+(\.\d+)?(px)?$/.test(value.trim()))
    throw new Error(`Only pixel values are supported, received: ${value}`);
  return Number.parseFloat(value);
}
function color(value: string, fallback: string) {
  if (!value) return fallback;
  if (/^#[0-9a-f]{3}$/i.test(value))
    return `#${value
      .slice(1)
      .split('')
      .map((part) => part + part)
      .join('')}`;
  const rgb = value.match(/^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/);
  if (rgb)
    return `#${rgb
      .slice(1)
      .map((part) => Number(part).toString(16).padStart(2, '0'))
      .join('')}`;
  if (!/^#[0-9a-f]{6}$/i.test(value))
    throw new Error('HTML colors must be #RGB, #RRGGBB, or RGB.');
  return value;
}
/** Inert parsing only. Imported elements are never mounted, executed, or fetched. */
export function importHtml(
  html: string,
  board: Extract<DesignNode, { kind: 'artboard' }>,
  parse: HtmlParser,
) {
  const parsed = parse(html);
  const nodes: DesignNode[] = [];
  function visit(
    element: Extract<HtmlNode, { kind: 'element' }>,
    originX: number,
    originY: number,
    availableWidth: number,
    depth: number
  ): number {
    if (depth > 20 || nodes.length >= 100)
      throw new Error(
        'HTML exceeds 20 levels or 100 generated layers. Split the import.'
      );
    if (!tags.has(element.tag))
      throw new Error(`Unsupported HTML element: ${element.tag}`);
    for (const [name] of element.attributes) {
      if (!['style', 'data-layer-name', 'src', 'alt'].includes(name))
        throw new Error(`Unsupported HTML attribute: ${name}`);
    }
    const style = element.style;
    for (const declaration of (element.attributes.get('style') ?? '')
      .split(';')
      .filter((part) => part.trim())) {
      const separator = declaration.indexOf(':');
      const property = declaration.slice(0, separator).trim().toLowerCase();
      if (
        separator < 1 ||
        !properties.has(property) ||
        !style.getPropertyValue(property)
      )
        throw new Error(`Unsupported or invalid CSS declaration: ${property}`);
    }
    if (
      /(url\s*\(|var\s*\(|calc\s*\(|!important)/i.test(
        element.attributes.get('style') ?? ''
      )
    )
      throw new Error(
        'External resources, CSS variables, expressions, and important declarations are unsupported.'
      );
    if (style.display === 'none') return 0;
    if (
      style.display &&
      !['block', 'inline', 'inline-block'].includes(style.display)
    )
      throw new Error(
        'HTML flex/grid layout is not supported. Use explicit pixel geometry or simple blocks.'
      );
    if (
      style.position &&
      !['static', 'relative', 'absolute'].includes(style.position)
    )
      throw new Error('Unsupported CSS position.');
    const x = originX + pixels(style.left, 0);
    const y = originY + pixels(style.top, 0);
    const width = pixels(style.width, availableWidth);
    const padding = pixels(style.padding, 0);
    const name =
      element.attributes.get('data-layer-name') ??
      element.attributes.get('alt') ??
      element.tag;
    const opacity = style.opacity ? Number(style.opacity) : 1;
    const background = style.backgroundColor || style.background;
    if (element.tag === 'img') {
      nodes.push(
        nodeSchema.parse({
          ...createNode('rectangle', x, y),
          kind: 'image',
          name,
          parentId: board.id,
          src: element.attributes.get('src'),
          width,
          height: pixels(style.height, 120),
          opacity,
        })
      );
      return style.position === 'absolute' ? 0 : pixels(style.height, 120);
    }
    if (style.whiteSpace && !['normal', 'nowrap', 'pre'].includes(style.whiteSpace))
      throw new Error('Supported white-space values are normal, nowrap, and pre.');
    const children = element.children.filter((node) => node.kind === 'element');
    const rawText = element.children.map((node) => node.kind === 'text' ? node.text : '').join('');
    const ownText = style.whiteSpace === 'pre' ? rawText : rawText.replace(/\s+/g, ' ').trim();
    if (ownText && children.length)
      throw new Error(
        'Mixed text and child elements are not supported. Wrap text in its own element.'
      );
    const fontSize = pixels(
      style.fontSize,
      element.tag === 'h1' ? 48 : element.tag === 'h2' ? 32 : 16
    );
    let cursor = padding;
    const foreground: DesignNode[] = [];
    const beforeChildren = nodes.length;
    if (ownText) {
      // CSSOM quotes family names containing spaces. Accept one literal family,
      // not a font stack whose fallback would be silently discarded.
      const fontFamily = parseCssFontFamily(style.fontFamily || 'Arial');
      const lineHeight = !style.lineHeight || style.lineHeight === 'normal' ? 1.2
        : style.lineHeight.endsWith('px') ? pixels(style.lineHeight, fontSize * 1.2) / fontSize
        : pixels(style.lineHeight, 1.2);
      const text = nodeSchema.options[3].parse({
        ...createNode('text', x + padding, y + padding),
        parentId: board.id,
        name,
        text: ownText,
        width: width - padding * 2,
        height: style.height ? pixels(style.height, 1) - padding * 2 : 1,
        sizing: style.height ? 'fixed' : 'auto-height',
        wrap: style.whiteSpace !== 'pre' && style.whiteSpace !== 'nowrap',
        lineHeight,
        letterSpacing: style.letterSpacing === 'normal' ? 0 : pixels(style.letterSpacing, 0),
        fontSize,
        fill: color(style.color, '#172015'),
        fontFamily,
        fontWeight: style.fontWeight || '400',
        align: style.textAlign || 'left',
        opacity,
      });
      foreground.push(text);
      cursor += textLayout(text).height;
    }
    for (const child of children)
      cursor += visit(
        child,
        x + padding,
        y + cursor,
        width - padding * 2,
        depth + 1
      );
    const height = pixels(style.height, Math.max(1, cursor + padding));
    if (background) {
      const rectangle = {
        ...createNode('rectangle', x, y),
        parentId: board.id,
        name: `${name} background`.slice(0, 160),
        width,
        height,
        fill: color(background, '#ffffff'),
        radius: pixels(style.borderRadius, 0),
        opacity,
      };
      // Insert the background behind this element's text and descendants.
      nodes.splice(beforeChildren, 0, nodeSchema.parse(rectangle));
    }
    nodes.push(...foreground);
    return style.position === 'absolute' ? 0 : height;
  }
  let cursor = 0;
  for (const child of parsed) {
    if (child.kind === 'element') cursor += visit(child, board.x, board.y + cursor, board.width, 0);
  }
  if (parsed.some((node) => node.kind === 'text' && node.text.trim()))
    throw new Error('Wrap top-level text in a supported element.');
  if (nodes.length > 100)
    throw new Error('HTML exceeds 100 generated layers. Split the import.');
  return nodes;
}
