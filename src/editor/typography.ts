import { useSyncExternalStore } from 'react';
import { fonts as fontFamilies, type DesignNode } from './model';
import { bundledFontFamily, fontCssFamily, quoteFontFamily } from './font-family';
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
  fallback: 'Arial' | null;
  availability: FontAvailability;
  method: 'bundled' | 'browser-metrics' | 'unverified';
};
type FontState = ReadonlyMap<string, FontAvailability>;
const listeners = new Set<() => void>();
let state: FontState = new Map([['Inter', 'loading'], ['Bricolage Grotesque', 'loading']]);
let loading: Promise<void> | undefined;
const bundledFonts = new Map<string, ArrayBuffer>();

function publish(family: string, availability: FontAvailability) {
  state = new Map(state).set(family, availability);
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function snapshot() {
  return state;
}
export function fontAvailability(families: readonly string[] = fontFamilies) {
  return [...new Set(families)].map((family) => ({ family, availability: fontStatus(family).availability }));
}
export function useFontState() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

async function loadFont(family: string, font: FontDefinition) {
  try {
    // Sources come only from this module's registry, never from document data.
    const response = await fetch(font.source, { credentials: 'same-origin', signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error('Bundled font unavailable.');
    const bytes = await response.arrayBuffer();
    const face = new FontFace(family, bytes, { weight: `${font.weight[0]} ${font.weight[1]}` });
    await face.load();
    bundledFonts.set(family, bytes);
    document.fonts.add(face);
    publish(family, 'available');
  } catch {
    publish(family, 'unavailable');
  }
}

/** Load only fonts shipped with the application; never resolve a document URL. */
export function loadDocumentFonts(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  loading ??= Promise.all([...fontRegistry].map(([family, font]) => loadFont(family, font))).then(() => undefined);
  return loading;
}

const detectedFonts = new Map<string, FontAvailability>();
/** Metric comparison works on HTTP tailnet origins without enumerating local fonts.
 * Equal-metric substitutes and missing glyphs cannot be distinguished reliably.
 * This is browser detection, not proof of a particular installed font file/style.
 */
function detectSystemFont(family: string): FontAvailability {
  if (typeof document === 'undefined') return 'unverified';
  const cached = detectedFonts.get(family);
  if (cached) return cached;
  try {
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return 'unverified';
    const sample = 'mmmmmmmmmmlliWW0123456789';
    const detected = ['monospace', 'serif', 'sans-serif'].some((fallback) => {
      context.font = `72px ${fallback}`;
      const baseline = context.measureText(sample).width;
      context.font = `72px ${quoteFontFamily(family)}, ${fallback}`;
      return context.measureText(sample).width !== baseline;
    });
    const availability = detected ? 'available' : 'unavailable';
    // Bound session-only cache across large imports and repeated agent queries.
    if (detectedFonts.size >= 256) detectedFonts.clear();
    detectedFonts.set(family, availability);
    return availability;
  } catch {
    return 'unverified';
  }
}

export function fontStatus(family: string, fonts: FontState = state): FontStatus {
  const bundled = bundledFontFamily(family);
  const availability = typeof document === 'undefined' ? 'unverified'
    : bundled ? (fonts.get(bundled) ?? 'loading') : detectSystemFont(family);
  const useFallback = availability === 'loading' || availability === 'unavailable';
  const resolved = useFallback ? 'Arial' : bundled ?? family;
  return {
    requested: family, resolved, fallback: useFallback ? 'Arial' : null, availability,
    method: availability === 'unverified' ? 'unverified' : bundled ? 'bundled' : 'browser-metrics',
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

function textContext(node: Extract<DesignNode, { kind: 'text' }>) {
  if (typeof document === 'undefined') return null;
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return null;
  const family = fontStatus(node.fontFamily).resolved;
  context.font = `${node.fontWeight} ${node.fontSize}px ${fontCssFamily(family)}`;
  context.fontKerning = 'normal';
  context.letterSpacing = `${node.letterSpacing}px`;
  return context;
}
function measuredWidth(
  context: CanvasRenderingContext2D,
  text: string,
) {
  return context.measureText(text).width;
}
function wrapLine(
  context: CanvasRenderingContext2D,
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
  const availability = fontStatus(node.fontFamily).availability;
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
