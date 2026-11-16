import { fonts as fontFamilies, type DesignNode } from '@open-cavas/document/model';
import { bundledFontFamily } from '@open-cavas/document/font-family';
export { fontFamilies };

type FontDefinition = { source: string; weight: readonly [number, number] };
const systemFont: FontDefinition = { source: 'system', weight: [100, 900] };
const fontRegistry = new Map<string, FontDefinition>([
  ['Inter', { source: '/fonts/Inter-Variable.ttf', weight: [100, 900] }],
  ['Bricolage Grotesque', { source: '/fonts/BricolageGrotesque-Variable.ttf', weight: [300, 800] }],
]);
export function fontDefinition(family: string) {
  return fontRegistry.get(bundledFontFamily(family) ?? family) ?? systemFont;
}

export type FontAvailability = 'loading' | 'available' | 'unavailable' | 'unverified';
export type FontStatus = {
  requested: string;
  resolved: string;
  fallback: string | null;
  availability: FontAvailability;
  method: 'bundled' | 'browser-metrics' | 'native' | 'unverified';
};
const bundledFonts = new Map<string, Uint8Array>();
export type TextContext = {
  measureText(text: string): {
    width: number; actualBoundingBoxLeft: number; actualBoundingBoxRight: number;
    actualBoundingBoxAscent: number; actualBoundingBoxDescent: number;
  };
};
export type TextNode = Extract<DesignNode, { kind: 'text' }>;
let runtimeContext: ((node: TextNode) => TextContext | null) | undefined;
let runtimeStatus: ((family: string) => FontStatus) | undefined;

/** Install the runtime measurement adapter, never document-supplied code. */
export function installTypography(adapter: {
  context: (node: TextNode) => TextContext | null;
  status: (family: string) => FontStatus;
  fonts: Map<string, Uint8Array>;
}) {
  runtimeContext = adapter.context;
  runtimeStatus = adapter.status;
  for (const [family, bytes] of adapter.fonts) bundledFonts.set(family, bytes);
}

export function fontAvailability(families: readonly string[] = fontFamilies) {
  return [...new Set(families)].map((family) => ({ family, availability: fontStatus(family).availability }));
}
export function fontStatus(family: string): FontStatus {
  return runtimeStatus?.(family) ?? {
    requested: family, resolved: bundledFontFamily(family) ?? family,
    fallback: null, availability: 'unverified', method: 'unverified',
  };
}

export type TextLayout = {
  lines: string[];
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
  overflow: boolean;
  measured: boolean;
};

function textContext(node: TextNode): TextContext | null {
  return runtimeContext?.(node) ?? null;
}
function measuredWidth(
  context: TextContext,
  text: string,
) {
  return context.measureText(text).width;
}
function wrapLine(
  context: TextContext,
  text: string,
  maxWidth: number,
) {
  const words = text.split(/(\s+)/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current + word;
    if (current && measuredWidth(context, candidate) > maxWidth) {
      lines.push(current.trimEnd());
      current = word.trimStart();
    } else {
      current = candidate;
    }
  }
  lines.push(current.trimEnd());
  return lines;
}

export function textLayout(node: Extract<DesignNode, { kind: 'text' }>): TextLayout {
  const context = textContext(node);
  if (!context) return { lines: node.text.split('\n'), width: node.width, height: node.height, contentWidth: node.width, contentHeight: node.height, overflow: false, measured: false };
  const explicitLines = node.text.split('\n');
  const lines: string[] = node.wrap && node.sizing !== 'auto-width'
    ? explicitLines.flatMap((line) => wrapLine(context, line, node.width))
    : explicitLines;
  const metrics = lines.map((line) => context.measureText(line));
  const width = Math.max(1, ...metrics.map((metric) => metric.width));
  const baselines = lines.map((_, index) => node.fontSize + index * node.fontSize * node.lineHeight);
  const height = Math.max(node.fontSize, lines.length * node.fontSize * node.lineHeight,
    ...metrics.map((metric, index) => baselines[index] + metric.actualBoundingBoxDescent));
  const resolvedWidth = node.sizing === 'auto-width' ? Math.min(20_000, width) : node.width;
  const resolvedHeight = node.sizing === 'auto-height' ? Math.min(20_000, height) : node.height;
  const availability = fontStatus(fontStatus(node.fontFamily).resolved).availability;
  const horizontalOverflow = metrics.some((metric) => {
    const start = node.align === 'center' ? (resolvedWidth - metric.width) / 2
      : node.align === 'right' ? resolvedWidth - metric.width : 0;
    return start - metric.actualBoundingBoxLeft < 0 || start + metric.actualBoundingBoxRight > resolvedWidth;
  });
  const topOverflow = metrics.some((metric, index) => baselines[index] - metric.actualBoundingBoxAscent < 0);
  return {
    lines,
    width: resolvedWidth,
    height: resolvedHeight,
    contentWidth: width,
    contentHeight: height,
    overflow: width > resolvedWidth || height > resolvedHeight || horizontalOverflow || topOverflow,
    measured: availability === 'available',
  };
}

export function embeddedFontStyle(families: string[]) {
  const unique = [...new Set(families.map((family) => bundledFontFamily(family) ?? family))];
  return unique.flatMap((family) => {
    const bytes = bundledFonts.get(family);
    if (!bytes) return [];
    const font = fontDefinition(family);
    let binary = '';
    for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
    const encoded = btoa(binary);
    return [`@font-face{font-family:\"${family}\";src:url(data:font/ttf;base64,${encoded}) format(\"truetype\");font-weight:${font.weight[0]} ${font.weight[1]};font-style:normal}`];
  }).join('');
}

export function textNodeBounds(node: Extract<DesignNode, { kind: 'text' }>) {
  const layout = textLayout(node);
  return { x: node.x, y: node.y, width: layout.width, height: layout.height };
}

/** Content extent uses the same resolved font and line layout as the artwork. */
export function textContentBounds(node: Extract<DesignNode, { kind: 'text' }>) {
  const layout = textLayout(node);
  const width = Math.max(1, layout.contentWidth);
  const offset = node.align === 'center' ? (layout.width - width) / 2
    : node.align === 'right' ? layout.width - width : 0;
  return { x: node.x + offset, y: node.y, width, height: layout.contentHeight };
}
