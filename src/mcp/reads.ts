import { currentFile } from '../workspace/model';
import { useEditor } from '../editor/store';
import type { EditorStore } from '../editor/state';
import { renderSvg } from '../editor/svg';
import { renderPdf } from '../editor/pdf';
import { tools } from './tools';
import type { DesignDocument, DesignNode } from '../editor/model';
import { fontAvailability, fontFamilies, fontDefinition, fontStatus, loadDocumentFonts, textLayout } from '../editor/typography';

export function withoutImageBytes(node: DesignNode) {
  if (node.kind !== 'image') return node;
  const { src, ...rest } = node;
  return { ...rest, imageBytesOmitted: true, encodedLength: src.length };
}
export function createReads(useEditor: Pick<EditorStore, 'getState'>,
  rasterize?: (svg: string, width: number, height: number) => Promise<string>) {
function exportArtwork(document: DesignDocument, artboardId?: string) {
  if (
    artboardId &&
    !document.nodes.some(
      (node) => node.id === artboardId && node.kind === 'artboard'
    )
  )
    throw new Error('Artboard not found.');
  return renderSvg(document, artboardId ? [artboardId] : []);
}
async function screenshot(artboardId: string | undefined, scale: number) {
  const documentSnapshot = useEditor.getState().document;
  await loadDocumentFonts();
  const artwork = exportArtwork(documentSnapshot, artboardId);
  const width = Math.ceil(artwork.width * scale);
  const height = Math.ceil(artwork.height * scale);
  if (width > 4096 || height > 4096 || width * height > 8_000_000)
    throw new Error(
      'Screenshot exceeds size limit. Choose a smaller scale or one artboard.'
    );
  const families = [...new Set([...fontFamilies, ...documentSnapshot.nodes.flatMap((node) => node.kind === 'text' ? [node.fontFamily] : [])])];
  const fontResolution = families.map((family) => fontStatus(family));
  if (rasterize) return {
    data: await rasterize(artwork.svg, width, height), mimeType: 'image/png',
    width, height, scale, bounds: artwork.bounds, fonts: fontAvailability(families), fontResolution,
  };
  const url = URL.createObjectURL(
    new Blob([artwork.svg], { type: 'image/svg+xml' })
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
    return {
      data: canvas.toDataURL('image/png').split(',')[1],
      mimeType: 'image/png',
      width,
      height,
      scale,
      bounds: artwork.bounds,
      fonts: fontAvailability(families), fontResolution,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
const reads: Record<
  string,
  (value: unknown) => unknown | Promise<unknown>
> = {
  get_document(value) {
    const args = tools.get_document.schema.parse(value);
    const doc = useEditor.getState().document;
    return {
      document: args.includeImages
        ? doc
        : { ...doc, nodes: doc.nodes.map(withoutImageBytes) },
      imageBytesIncluded: args.includeImages,
      fileVersion: 2,
      pages: currentFile(
        useEditor.getState().workspace,
        useEditor.getState().location
      ).document.pages.map((page) => ({
        id: page.id,
        name: page.name,
        layerCount: page.nodes.length,
      })),
      undoSteps: useEditor.getState().past.length,
      redoSteps: useEditor.getState().future.length,
    };
  },
  get_tree(value) {
    tools.get_tree.schema.parse(value);
    const { nodes } = useEditor.getState().document;
    const entry = (node: DesignNode) => ({
      id: node.id,
      kind: node.kind,
      name: node.name,
      parentId: node.parentId,
      hidden: node.hidden,
      locked: node.locked,
    });
    return {
      tree: nodes
        .filter((node) => node.parentId === null)
        .map((node) => ({
          ...entry(node),
          children: nodes
            .filter((child) => child.parentId === node.id)
            .map(entry),
        })),
      pages: currentFile(
        useEditor.getState().workspace,
        useEditor.getState().location
      ).document.pages.map((page) => ({
        id: page.id,
        name: page.name,
        layerCount: page.nodes.length,
      })),
      activePageId: useEditor.getState().location.pageId,
    };
  },
  get_node(value) {
    const args = tools.get_node.schema.parse(value);
    const node = useEditor
      .getState()
      .document.nodes.find((item) => item.id === args.nodeId);
    if (!node) throw new Error('Layer not found.');
    if (node.kind !== 'text') return { node: withoutImageBytes(node) };
    return {
      node: withoutImageBytes(node),
      font: fontStatus(node.fontFamily),
      layout: textLayout(node),
    };
  },
  get_fonts(value) {
    const args = tools.get_fonts.schema.parse(value);
    const doc = useEditor.getState().document;
    const families = args.families ?? [
      ...fontFamilies,
      ...doc.nodes.flatMap((node) => node.kind === 'text' ? [node.fontFamily] : []),
      ...Object.values(doc.tokens).flatMap((token) => token.type === 'font' ? [token.value] : []),
    ];
    return {
      fonts: [...new Set(families)].map((family) => ({
        family,
        source: fontDefinition(family).source === 'system' ? 'system' : 'bundled',
        weight: fontDefinition(family).weight,
        weightAvailability: fontDefinition(family).source === 'system' ? 'unverified' : 'bundled-range',
        ...fontStatus(family),
      })),
      fallback: fontStatus('Arial').resolved,
      note: 'System font detection depends on the renderer and does not verify individual weights or glyphs. System fonts are not embedded in exports.',
    };
  },
  get_styles(value) {
    const args = tools.get_styles.schema.parse(value);
    const { nodes } = useEditor.getState().document;
    return {
      styles: args.nodeIds.map((id) => {
        const node = nodes.find((item) => item.id === id);
        if (!node) throw new Error(`Layer not found: ${id}`);
        const {
          name: _name,
          id: _id,
          parentId: _parentId,
          ...properties
        } = withoutImageBytes(node);
        return { nodeId: id, properties };
      }),
    };
  },
  get_selection(value) {
    tools.get_selection.schema.parse(value);
    return { selectedIds: useEditor.getState().selectedIds };
  },
  get_design_tokens(value) {
    tools.get_design_tokens.schema.parse(value);
    return { tokens: useEditor.getState().document.tokens };
  },
  async export_document(value) {
    const args = tools.export_document.schema.parse(value);
    if (args.format === 'json') {
      if (args.artboardId)
        throw new Error('JSON export is a complete document; omit artboardId.');
      return {
        format: 'json',
        content: JSON.stringify(
          currentFile(
            useEditor.getState().workspace,
            useEditor.getState().location
          ).document,
          null,
          2
        ),
      };
    }
    const documentSnapshot = useEditor.getState().document;
    await loadDocumentFonts();
    const artwork = exportArtwork(documentSnapshot, args.artboardId);
    if (args.format === 'svg') return { format: 'svg', content: artwork.svg };
    if (args.format === 'html')
      return {
        format: 'html',
        content: `<!doctype html><html><head><meta charset="utf-8"><title>Open Cavas export</title></head><body style="margin:0">${artwork.svg}</body></html>`,
      };
    const jsx = artwork.svg
      .replace(/<style>([\s\S]*?)<\/style>/g, (_match: string, css: string) => `<style>{${JSON.stringify(css)}}</style>`)
      .replace(/ letter-spacing="/g, ' letterSpacing="')
      .replace(/ xml:space="/g, ' xmlSpace="')
      .replace(/ text-rendering="/g, ' textRendering="')
      .replace(/style="font-kerning:normal"/g, 'style={{fontKerning:"normal"}}')
      .replace(/ clip-path="/g, ' clipPath="')
      .replace(/ font-family="/g, ' fontFamily="')
      .replace(/ font-size="/g, ' fontSize="')
      .replace(/ font-weight="/g, ' fontWeight="')
      .replace(/ text-anchor="/g, ' textAnchor="');
    return {
      format: 'jsx',
      content: `export default function Artwork() { return (${jsx}); }`,
      representation: 'SVG JSX, not semantic HTML layout',
    };
  },
  async export_combined_pdf(value) {
    const args = tools.export_combined_pdf.schema.parse(value);
    if (args.scope === 'page' && args.artboardIds !== undefined)
      throw new Error('Page PDF export must omit artboardIds.');
    if (args.scope === 'artboards' && !args.artboardIds?.length)
      throw new Error('Artboard PDF export requires explicit artboardIds.');
    const snapshot = useEditor.getState().document;
    const pdf = await renderPdf(snapshot, args.scope === 'page'
      ? { kind: 'page' }
      : { kind: 'artboards', artboardIds: args.artboardIds ?? [] });
    let binary = '';
    for (const byte of pdf.bytes) binary += String.fromCharCode(byte);
    return {
      data: btoa(binary), mimeType: 'application/pdf', encoding: 'base64',
      name: `${pdf.name}.pdf`, pageCount: pdf.pages.length, pages: pdf.pages,
      pointsPerPixel: 0.75, rasterScale: 2, representation: 'raster artwork, not selectable text or vectors',
    };
  },
  get_screenshot(value) {
    const args = tools.get_screenshot.schema.parse(value);
    return screenshot(args.artboardId, args.scale);
  },
};

return reads;
}
export const reads = createReads(useEditor);
