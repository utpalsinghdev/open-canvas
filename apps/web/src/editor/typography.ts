import { useSyncExternalStore } from 'react';
import { bundledFontFamily, fontCssFamily, quoteFontFamily } from '@open-cavas/document/font-family';
import { fontDefinition, installTypography, type FontAvailability, type FontStatus, type TextContext, type TextNode } from '@open-cavas/engine/typography';

type FontState = ReadonlyMap<string, FontAvailability>;
const fontRegistry = new Map(['Inter', 'Bricolage Grotesque'].map(family => [family, fontDefinition(family)]));
const listeners = new Set<() => void>();
let state: FontState = new Map([['Inter', 'loading'], ['Bricolage Grotesque', 'loading']]);
let loading: Promise<void> | undefined;
const bundledFonts = new Map<string, Uint8Array>();

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
export function useFontState() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

async function loadFont(family: string, font: ReturnType<typeof fontDefinition>) {
  try {
    // Sources come only from this module's registry, never from document data.
    const response = await fetch(font.source, { credentials: 'same-origin', signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error('Bundled font unavailable.');
    const bytes = await response.arrayBuffer();
    const face = new FontFace(family, bytes, { weight: `${font.weight[0]} ${font.weight[1]}` });
    await face.load();
    bundledFonts.set(family, new Uint8Array(bytes));
    installBrowserTypography();
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

function browserContext(node: TextNode): TextContext | null {
  if (typeof document === 'undefined') return null;
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return null;
  const family = fontStatus(node.fontFamily).resolved;
  context.font = `${node.fontWeight} ${node.fontSize}px ${fontCssFamily(family)}`;
  context.fontKerning = 'normal';
  context.letterSpacing = `${node.letterSpacing}px`;
  return context;
}

function installBrowserTypography() {
  installTypography({ context: browserContext, status: fontStatus, fonts: bundledFonts });
}
installBrowserTypography();
