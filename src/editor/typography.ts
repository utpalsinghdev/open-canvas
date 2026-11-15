import { useSyncExternalStore } from 'react';
import type { DesignNode } from './model';

export const fontRegistry = {
  Inter: { source: '/fonts/Inter-Variable.ttf', weight: [100, 900] },
  'Bricolage Grotesque': {
    source: '/fonts/BricolageGrotesque-Variable.ttf',
    weight: [300, 800],
  },
  Arial: { source: 'system', weight: [100, 900] },
  Georgia: { source: 'system', weight: [100, 900] },
  'Courier New': { source: 'system', weight: [100, 900] },
} as const;

export type FontFamily = keyof typeof fontRegistry;
export type FontAvailability = 'loading' | 'available' | 'unavailable' | 'system';
export type FontStatus = {
  requested: FontFamily;
  resolved: FontFamily;
  fallback: FontFamily | null;
  availability: FontAvailability;
};
type FontState = Record<FontFamily, FontAvailability>;

export const fontFamilies = [
  'Inter',
  'Bricolage Grotesque',
  'Arial',
  'Georgia',
  'Courier New',
] as const satisfies readonly FontFamily[];
const listeners = new Set<() => void>();
let state: FontState = {
  Inter: 'loading',
  'Bricolage Grotesque': 'loading',
  Arial: 'loading',
  Georgia: 'loading',
  'Courier New': 'loading',
};
let loading: Promise<void> | undefined;
const bundledFonts = new Map<FontFamily, Uint8Array>();
type TextContext = {
  measureText(text: string): Pick<TextMetrics, 'width' | 'actualBoundingBoxLeft' |
    'actualBoundingBoxRight' | 'actualBoundingBoxAscent' | 'actualBoundingBoxDescent'>;
};
type TextNode = Extract<DesignNode, { kind: 'text' }>;
let nativeContext: ((node: TextNode) => TextContext) | undefined;
let nativeResolution: Record<FontFamily, FontFamily> | undefined;

/** Install the server's native font adapter once, never document-supplied code. */
export function installTypography(adapter: {
  context: (node: TextNode) => TextContext;
  resolution: Record<FontFamily, FontFamily>;
  availability: FontState;
  fonts: Map<FontFamily, Uint8Array>;
}) {
  nativeContext = adapter.context;
  nativeResolution = adapter.resolution;
  for (const [family, bytes] of adapter.fonts) bundledFonts.set(family, bytes);
  publish(adapter.availability);
}

function publish(next: FontState) {
  state = next;
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function snapshot() {
  return state;
}
export function fontAvailability() {
  return snapshot();
}
export function useFontState() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

function fetchFont(family: FontFamily) {
  const options = { credentials: 'same-origin', signal: AbortSignal.timeout(8_000) } satisfies RequestInit;
  switch (family) {
    case 'Inter': return fetch('/fonts/Inter-Variable.ttf', options);
    case 'Bricolage Grotesque': return fetch('/fonts/BricolageGrotesque-Variable.ttf', options);
    default: throw new Error('System font has no bundled asset.');
  }
}
async function loadFont(family: FontFamily) {
  const font = fontRegistry[family];
  if (font.source === 'system') {
    publish({ ...state, [family]: 'system' });
    return;
  }
  try {
    // A missing or stalled asset must not prevent opening the user's workspace.
    const response = await fetchFont(family);
    if (!response.ok) throw new Error(`Bundled font unavailable: ${family}`);
    const bytes = await response.arrayBuffer();
    const face = new FontFace(family, bytes, {
      weight: `${font.weight[0]} ${font.weight[1]}`,
    });
    await face.load();
    bundledFonts.set(family, new Uint8Array(bytes));
    document.fonts.add(face);
    publish({ ...state, [family]: 'available' });
  } catch {
    publish({ ...state, [family]: 'unavailable' });
  }
}

/** Load only fonts shipped with the application; never resolve a document URL. */
export function loadDocumentFonts(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  loading ??= Promise.all(fontFamilies.map(loadFont)).then(() => undefined);
  return loading;
}

export function fontStatus(family: FontFamily, fonts: FontState = state): FontStatus {
  const availability = fonts[family];
  const resolved = nativeResolution?.[family] ??
    (availability === 'available' || availability === 'system' ? family : 'Arial');
  return { requested: family, resolved, fallback: resolved === family ? null : resolved, availability };
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
  if (nativeContext) return nativeContext(node);
  if (typeof document === 'undefined') return null;
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return null;
  const family = fontStatus(node.fontFamily).resolved;
  context.font = `${node.fontWeight} ${node.fontSize}px "${family}"`;
  context.fontKerning = 'normal';
  context.letterSpacing = `${node.letterSpacing}px`;
  return context;
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
    measured: availability !== 'loading' && availability !== 'unavailable',
  };
}

export function embeddedFontStyle(families: FontFamily[]) {
  const unique = [...new Set(families)];
  return unique.flatMap((family) => {
    const bytes = bundledFonts.get(family);
    if (!bytes) return [];
    const font = fontRegistry[family];
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
