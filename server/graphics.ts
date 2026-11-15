import { readFile } from 'node:fs/promises';
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import { fontStatus, installTypography, type FontFamily } from '../src/editor/typography';

let initialized: Promise<void> | undefined;
export function initializeGraphics() {
  initialized ??= (async () => {
    const inter = await readFile(new URL('../public/fonts/Inter-Variable.ttf', import.meta.url));
    const bricolage = await readFile(new URL('../public/fonts/BricolageGrotesque-Variable.ttf', import.meta.url));
    if (!GlobalFonts.register(inter, 'Inter') || !GlobalFonts.register(bricolage, 'Bricolage Grotesque'))
      throw new Error('Bundled fonts could not be registered. Workspace data was not changed.');
    const systemFont = (family: FontFamily) => GlobalFonts.has(family) ? family : 'Inter';
    const resolution = {
      Inter: 'Inter', 'Bricolage Grotesque': 'Bricolage Grotesque',
      Arial: systemFont('Arial'), Georgia: systemFont('Georgia'), 'Courier New': systemFont('Courier New'),
    } satisfies Record<FontFamily, FontFamily>;
    const context = createCanvas(1, 1).getContext('2d');
    installTypography({
      resolution,
      fonts: new Map<FontFamily, Uint8Array>([['Inter', inter], ['Bricolage Grotesque', bricolage]]),
      availability: {
        Inter: 'available', 'Bricolage Grotesque': 'available',
        Arial: resolution.Arial === 'Arial' ? 'system' : 'unavailable',
        Georgia: resolution.Georgia === 'Georgia' ? 'system' : 'unavailable',
        'Courier New': resolution['Courier New'] === 'Courier New' ? 'system' : 'unavailable',
      },
      context(node) {
        context.font = `${node.fontWeight} ${node.fontSize}px "${fontStatus(node.fontFamily).resolved}"`;
        context.fontKerning = 'normal';
        context.letterSpacing = `${node.letterSpacing}px`;
        return context;
      },
    });
  })();
  return initialized;
}

/** Generated, escaped SVG only. Output dimensions are bounded before native allocation. */
export async function rasterizeArtwork(svg: string, width: number, height: number, images: Map<string, string>) {
  const normalized = svg.replace(/href="(data:image\/[^\"]+)"/g, (_match: string, source: string) => {
    const image = images.get(source);
    if (!image) throw new Error('Image was not validated for this capture.');
    return `href="${image}"`;
  });
  const sized = normalized.replace(/width="[^"]+" height="[^"]+"/, `width="${width}" height="${height}"`);
  const image = await loadImage(Buffer.from(sized));
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, width, height);
  return (await canvas.encode('png')).toString('base64');
}
