import { readFile } from 'node:fs/promises';
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import { fontStatus, installTypography } from '@open-cavas/engine/typography';
import { bundledFontFamily, fontCssFamily } from '@open-cavas/document/font-family';

let initialized: Promise<void> | undefined;
export function initializeGraphics() {
  initialized ??= (async () => {
    const inter = await readFile(new URL('../../../public/fonts/Inter-Variable.ttf', import.meta.url));
    const bricolage = await readFile(new URL('../../../public/fonts/BricolageGrotesque-Variable.ttf', import.meta.url));
    if (!GlobalFonts.register(inter, 'Inter') || !GlobalFonts.register(bricolage, 'Bricolage Grotesque'))
      throw new Error('Bundled fonts could not be registered. Workspace data was not changed.');
    const context = createCanvas(1, 1).getContext('2d');
    installTypography({
      fonts: new Map<string, Uint8Array>([['Inter', inter], ['Bricolage Grotesque', bricolage]]),
      status(family) {
        const bundled = bundledFontFamily(family);
        const available = !!bundled || GlobalFonts.has(family);
        const resolved = bundled ?? (available ? family : 'Inter');
        return { requested: family, resolved, fallback: available ? null : resolved,
          availability: available ? 'available' : 'unavailable', method: bundled ? 'bundled' : 'native' };
      },
      context(node) {
        context.font = `${node.fontWeight} ${node.fontSize}px ${fontCssFamily(fontStatus(node.fontFamily).resolved)}`;
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
