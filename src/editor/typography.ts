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
  fallback: 'Arial' | null;
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
let initialized = false;
const bundledFonts = new Map<FontFamily, ArrayBuffer>();

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
async function loadBundledFont(family: FontFamily) {
  switch (family) {
    case 'Inter': return fetch('/fonts/Inter-Variable.ttf', { credentials: 'same-origin' });
    case 'Bricolage Grotesque': return fetch('/fonts/BricolageGrotesque-Variable.ttf', { credentials: 'same-origin' });
    case 'Arial':
    case 'Georgia':
    case 'Courier New': throw new Error('System font has no bundled asset.');
  }
}
export function fontAvailability() {
  return snapshot();
}
export function useFontState() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** Load only fonts shipped with the application; never resolve a document URL. */
export async function loadDocumentFonts() {
  if (initialized || typeof document === 'undefined') return;
  initialized = true;
  const next: FontState = { ...state };
  for (const family of fontFamilies) next[family] = 'loading';
  publish(next);
  for (const family of fontFamilies) {
    try {
      const font = fontRegistry[family];
      if (font.source !== 'system') {
        const response = await loadBundledFont(family);
        if (!response.ok) throw new Error(`Bundled font unavailable: ${family}`);
        const bytes = await response.arrayBuffer();
        const face = new FontFace(family, bytes, {
          weight: `${font.weight[0]} ${font.weight[1]}`,
        });
        await face.load();
        bundledFonts.set(family, bytes);
        document.fonts.add(face);
      }
      next[family] = font.source === 'system'
        ? 'system'
        : document.fonts.check(`620 16px \"${family}\"`)
          ? 'available'
          : 'unavailable';
    } catch {
      next[family] = 'unavailable';
    }
  }
  publish(next);
}

export function fontStatus(family: FontFamily, fonts: FontState = state): FontStatus {
  const availability = fonts[family];
  const resolved = availability === 'available' || availability === 'system' ? family : 'Arial';
  return { requested: family, resolved, fallback: availability === 'system' ? null : 'Arial', availability };
}

export type TextLayout = {
  lines: string[];
  width: number;
  height: number;
  overflow: boolean;
  measured: boolean;
};

function textContext(node: Extract<DesignNode, { kind: 'text' }>) {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return null;
  const family = fontStatus(node.fontFamily).resolved;
  context.font = `${node.fontWeight} ${node.fontSize}px "${family}"`;
  return context;
}
function measuredWidth(
  context: CanvasRenderingContext2D,
  text: string,
  tracking: number,
) {
  return context.measureText(text).width + Math.max(0, text.length - 1) * tracking;
}
function wrapLine(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  tracking: number,
) {
  const words = text.split(/(\s+)/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current + word;
    if (current && measuredWidth(context, candidate, tracking) > maxWidth) {
      lines.push(current.trimEnd());
      current = word.trimStart();
    } else {
      current = candidate;
    }
    if (!current && measuredWidth(context, word, tracking) > maxWidth) {
      let chunk = '';
      for (const character of word) {
        if (chunk && measuredWidth(context, chunk + character, tracking) > maxWidth) {
          lines.push(chunk);
          chunk = character;
        } else chunk += character;
      }
      current = chunk;
    }
  }
  lines.push(current.trimEnd());
  return lines;
}

export function textLayout(node: Extract<DesignNode, { kind: 'text' }>): TextLayout {
  const context = textContext(node);
  if (!context) return { lines: node.text.split('\n'), width: node.width, height: node.height, overflow: false, measured: false };
  const explicitLines = node.text.split('\n');
  const lines: string[] = node.wrap && node.sizing !== 'auto-width'
    ? explicitLines.flatMap((line: string) => wrapLine(context, line, node.width, node.letterSpacing))
    : explicitLines;
  const width = Math.max(1, ...lines.map((line: string) => measuredWidth(context, line, node.letterSpacing)));
  const height = Math.max(node.fontSize, lines.length * node.fontSize * node.lineHeight);
  const resolvedWidth = node.sizing === 'auto-width' ? Math.min(20_000, width) : node.width;
  const resolvedHeight = node.sizing === 'auto-height' ? Math.min(20_000, height) : node.height;
  const availability = fontStatus(node.fontFamily).availability;
  return {
    lines,
    width: resolvedWidth,
    height: resolvedHeight,
    overflow: width > resolvedWidth || height > resolvedHeight,
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
