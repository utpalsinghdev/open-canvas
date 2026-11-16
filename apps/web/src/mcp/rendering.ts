import { loadDocumentFonts } from '../editor/typography';
import { renderPdf } from '../editor/pdf';

async function rasterize(svg: string, width: number, height: number) {
  const url = URL.createObjectURL(
    new Blob([svg], { type: 'image/svg+xml' })
  );
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Browser cannot render screenshots.');
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/png').split(',')[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const browserRendering = { rasterize, loadFonts: loadDocumentFonts, renderPdf };
