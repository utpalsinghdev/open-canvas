import { isHidden, type DesignDocument } from './model';
import { renderSvg } from './svg';
import { validatePdfImage } from './pdf-images';
import { fontStatus, loadDocumentFonts } from './typography';

export type PdfTarget = { kind: 'artboards'; artboardIds: string[] } | { kind: 'page' };

// 2× rasterization at 96 CSS px/in gives 192 dpi without changing physical size.
const SCALE = 2;
const POINTS_PER_PIXEL = 72 / 96;
const MAX_PAGES = 32;
const MAX_SIDE = 4096;
const MAX_PAGE_PIXELS = 8_000_000;
const MAX_TOTAL_PIXELS = 32_000_000;
const MAX_SOURCE_PIXELS = 32_000_000;
const MAX_PDF_BYTES = 8_000_000; // Base64 plus metadata must fit the 12 MB MCP envelope.
let exporting = false;

function pageDocuments(doc: DesignDocument, target: PdfTarget) {
  if (target.kind === 'page') return [{ document: doc, artboardId: undefined }];
  const ids = new Set(target.artboardIds);
  if (!ids.size) throw new Error('Select at least one artboard, or choose Export page PDF.');
  if (ids.size !== target.artboardIds.length) throw new Error('Artboard IDs must not repeat.');
  const boards = doc.nodes.filter((node) => node.kind === 'artboard' && ids.has(node.id));
  if (boards.length !== ids.size) throw new Error('PDF target must contain existing artboards only.');
  if (boards.some((board) => board.hidden)) throw new Error('Hidden artboards cannot be exported. Unhide them first.');
  if (boards.length > MAX_PAGES) throw new Error('PDF export supports at most 32 artboards. Export fewer artboards.');
  // Document order, not selection/caller order, is the PDF page order.
  return boards.map((board) => ({
    document: { ...doc, nodes: doc.nodes.filter((node) => node.id === board.id || node.parentId === board.id) },
    artboardId: board.id,
  }));
}

async function validateResources(documents: DesignDocument[]) {
  const images = new Map<string, string>();
  let sourcePixels = 0;
  for (const doc of documents) {
    for (const node of doc.nodes) {
      if (isHidden(node, doc.nodes)) continue;
      if (node.kind === 'text' && fontStatus(node.fontFamily).availability === 'unavailable')
        throw new Error(`PDF font unavailable: ${node.fontFamily}. Reload after restoring the bundled font.`);
      if (node.kind !== 'image' || images.has(node.src)) continue;
      try {
        sourcePixels += validatePdfImage(node.src);
      } catch (error) {
        throw new Error(`PDF image ${node.name}: ${error instanceof Error ? error.message : 'Invalid image.'}`);
      }
      images.set(node.src, node.name);
      if (sourcePixels > MAX_SOURCE_PIXELS)
        throw new Error('PDF source images exceed 32 megapixels in total. Use fewer or smaller images.');
    }
  }
  // All headers and the aggregate budget pass before decoding any source.
  for (const [src, name] of images) {
    const image = new Image();
    image.src = src;
    try {
      await image.decode();
      if (image.naturalWidth * image.naturalHeight > 16_000_000)
        throw new Error('Image exceeds 16 megapixels.');
    } catch {
      throw new Error(`PDF image cannot be rendered or exceeds 16 megapixels: ${name}. Replace it with a smaller valid image.`);
    } finally {
      image.src = '';
    }
  }
}

async function rasterize(svg: string, width: number, height: number) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const canvas = document.createElement('canvas');
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Browser cannot render PDF artwork.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
    image.src = '';
    canvas.width = canvas.height = 0;
  }
}

/** Render an immutable active-page snapshot. No document URLs or server writes. */
export async function renderPdf(doc: DesignDocument, target: PdfTarget) {
  if (exporting) throw new Error('A PDF export is already running. Wait for it to finish.');
  exporting = true;
  try {
    const documents = pageDocuments(doc, target);
    await loadDocumentFonts();
    await validateResources(documents.map((page) => page.document));
    // Check every page before allocating raster buffers or creating partial output.
    const pages = documents.map(({ document, artboardId }) => {
      const artwork = renderSvg(document, artboardId ? [artboardId] : []);
      const pixelWidth = Math.ceil(artwork.width * SCALE);
      const pixelHeight = Math.ceil(artwork.height * SCALE);
      if (pixelWidth > MAX_SIDE || pixelHeight > MAX_SIDE || pixelWidth * pixelHeight > MAX_PAGE_PIXELS)
        throw new Error('PDF page exceeds 4096 pixels per side or 8 megapixels at 2×. Export smaller artboards.');
      return { ...artwork, pixelWidth, pixelHeight };
    });
    if (pages.reduce((sum, page) => sum + page.pixelWidth * page.pixelHeight, 0) > MAX_TOTAL_PIXELS)
      throw new Error('PDF exceeds 32 megapixels at 2×. Export fewer or smaller artboards.');
    const { PDFDocument } = await import('pdf-lib');
    const pdf = await PDFDocument.create();
    // Names may be Unicode; artwork labels remain in the rendered page image.
    const metadata = [];
    for (const page of pages) {
      const png = await rasterize(page.svg, page.pixelWidth, page.pixelHeight);
      const image = await pdf.embedPng(png);
      const width = page.width * POINTS_PER_PIXEL;
      const height = page.height * POINTS_PER_PIXEL;
      pdf.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
      const { x, y, width: boundsWidth, height: boundsHeight } = page.bounds;
      metadata.push({ name: page.name, width, height, bounds: { x, y, width: boundsWidth, height: boundsHeight } });
    }
    const bytes = await pdf.save();
    if (bytes.length > MAX_PDF_BYTES)
      throw new Error('PDF exceeds 8 MB. Export fewer or smaller artboards.');
    return { bytes, pages: metadata, name: doc.name };
  } finally {
    exporting = false;
  }
}
