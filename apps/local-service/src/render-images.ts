import sharp from 'sharp';
import { isHidden, type DesignDocument } from '@open-cavas/document/model';

const MAX_PIXELS = 8_000_000;
function rasterSignature(bytes: Buffer) {
  return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ||
    ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii')) ||
    (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP');
}

/** Decode bounded, embedded raster data into trusted single-frame PNGs before SVG rendering. */
export async function prepareRenderImages(document: DesignDocument, artboardId?: string) {
  const images = new Map<string, string>();
  let pixels = 0;
  let characters = 0;
  let encodedBytes = 0;
  for (const node of document.nodes) {
    if (isHidden(node, document.nodes) || (artboardId && node.id !== artboardId && node.parentId !== artboardId)) continue;
    if (node.kind === 'text') characters += node.text.length;
    if (characters > 100_000) throw new Error('PNG rendering is limited to 100,000 text characters. Choose one artboard.');
    if (node.kind !== 'image') continue;
    const bytes = Buffer.from(node.src.slice(node.src.indexOf(',') + 1), 'base64');
    if (!rasterSignature(bytes)) throw new Error('Embedded render images must contain PNG, JPEG, WebP or GIF bytes, not SVG or a URI.');
    const decoder = sharp(bytes, { limitInputPixels: MAX_PIXELS, failOn: 'warning', animated: false });
    const size = await decoder.metadata();
    const width = size.width ?? 0;
    const height = size.height ?? 0;
    if (!['png', 'jpeg', 'webp', 'gif'].includes(size.format ?? '') ||
      width < 1 || height < 1 || width > 4096 || height > 4096 || width * height > MAX_PIXELS)
      throw new Error('Embedded render images must be at most 4096 px per side and eight megapixels.');
    pixels += width * height;
    if (pixels > 32_000_000) throw new Error('Artwork exceeds 32 megapixels of decoded image content. Export a smaller file.');
    if (images.has(node.src)) continue;
    const decoded = await decoder.timeout({ seconds: 5 }).png().toBuffer({ resolveWithObject: true });
    if (decoded.info.width !== width || decoded.info.height !== height)
      throw new Error('Decoded image dimensions differ from validated dimensions.');
    encodedBytes += decoded.data.length;
    if (encodedBytes > 12_000_000) throw new Error('Normalized render images exceed 12 MB. Choose one artboard.');
    images.set(node.src, `data:image/png;base64,${decoded.data.toString('base64')}`);
  }
  return images;
}
