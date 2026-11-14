import { getBounds, isHidden, documentSchema, type DesignDocument, type DesignNode } from './model';

export function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name.replace(/[/\\:*?"<>|]/g, '-');
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function saveDocument(doc: DesignDocument) {
  download(JSON.stringify(doc, null, 2), `${doc.name}.cavas.json`, 'application/json');
}
export async function readDocument(file: File) {
  if (file.size > 12_000_000) throw new Error('JSON file must be smaller than 12 MB.');
  let value: unknown;
  try { value = JSON.parse(await file.text()); } catch { throw new Error('This file is not valid JSON. Choose an Open Cavas document.'); }
  const parsed = documentSchema.safeParse(value);
  if (!parsed.success) throw new Error('Unsupported document. Choose a version 1 Open Cavas JSON file.');
  return parsed.data;
}
export async function readImage(file: File): Promise<{ src: string; width: number; height: number }> {
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) throw new Error('Choose a PNG, JPEG, WebP, or GIF image.');
  if (file.size > 2_000_000) throw new Error('Image must be smaller than 2 MB.');
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read this image.'));
    reader.onerror = () => reject(new Error('Could not read this image.'));
    reader.readAsDataURL(file);
  });
  const image = new Image();
  image.src = src;
  try { await image.decode(); } catch { throw new Error('Image could not be decoded. Choose another file.'); }
  const scale = Math.min(1, 600 / Math.max(image.naturalWidth, image.naturalHeight));
  return { src, width: Math.max(1, Math.round(image.naturalWidth * scale)), height: Math.max(1, Math.round(image.naturalHeight * scale)) };
}

const escape = (value: string) => value.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
export function nodeSvg(node: DesignNode): string {
  const common = `opacity="${node.opacity}" transform="rotate(${node.rotation} ${node.x + node.width / 2} ${node.y + node.height / 2})"`;
  const geometry = `x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"`;
  switch (node.kind) {
    case 'artboard':
    case 'rectangle': return `<rect ${geometry} rx="${node.radius}" fill="${node.fill}" ${common}/>`;
    case 'ellipse': return `<ellipse cx="${node.x + node.width / 2}" cy="${node.y + node.height / 2}" rx="${node.width / 2}" ry="${node.height / 2}" fill="${node.fill}" ${common}/>`;
    case 'image': return `<image ${geometry} href="${escape(node.src)}" preserveAspectRatio="xMidYMid slice" ${common}/>`;
    case 'text': {
      const x = node.x + (node.align === 'center' ? node.width / 2 : node.align === 'right' ? node.width : 0);
      const anchor = node.align === 'center' ? 'middle' : node.align === 'right' ? 'end' : 'start';
      return `<text fill="${node.fill}" font-family="${node.fontFamily}" font-size="${node.fontSize}" font-weight="${node.fontWeight}" text-anchor="${anchor}" ${common}>${node.text.split('\n').map((line, index) => `<tspan x="${x}" y="${node.y + node.fontSize + index * node.fontSize * 1.2}">${escape(line)}</tspan>`).join('')}</text>`;
    }
  }
}

export function exportSvg(doc: DesignDocument, selectedIds: string[]) {
  const selectedBoard = doc.nodes.find((node) => node.kind === 'artboard' && selectedIds.length === 1 && selectedIds.includes(node.id));
  const nodes = doc.nodes.filter((node) => !isHidden(node, doc.nodes) && (!selectedBoard || node.id === selectedBoard.id || node.parentId === selectedBoard.id));
  const bounds = selectedBoard ?? getBounds(nodes.filter((node) => node.parentId === null));
  if (!bounds || !nodes.length) throw new Error('There are no visible layers to export.');
  const content = nodes.filter((node) => node.parentId === null).map((node, index) => {
    if (node.kind !== 'artboard') return nodeSvg(node);
    const clip = `export-board-${index}`;
    return `<defs><clipPath id="${clip}"><rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="${node.radius}"/></clipPath></defs><g clip-path="url(#${clip})" opacity="${node.opacity}">${nodeSvg({ ...node, opacity: 1 })}${nodes.filter((child) => child.parentId === node.id).map(nodeSvg).join('')}</g>`;
  }).join('');
  download(`<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}"><title>${escape(selectedBoard?.name ?? doc.name)}</title>${content}</svg>`, `${selectedBoard?.name ?? doc.name}.svg`, 'image/svg+xml');
}
