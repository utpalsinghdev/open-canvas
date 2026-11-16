import { type DesignDocument } from '@open-cavas/document/model';
import { renderSvg } from '@open-cavas/engine/svg';
import { importSchema, type FileDocument } from '@open-cavas/document/workspace';

export function download(content: string | Blob, name: string, type: string) {
  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name.replace(/[/\\:*?"<>|]/g, '-');
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function saveDocument(doc: DesignDocument | FileDocument) {
  download(
    JSON.stringify(doc, null, 2),
    `${doc.name}.cavas.json`,
    'application/json'
  );
}
export async function readDocument(file: File) {
  if (file.size > 40_000_000)
    throw new Error('JSON file must be smaller than 40 MB.');
  let value: unknown;
  try {
    value = JSON.parse(await file.text());
  } catch {
    throw new Error(
      'This file is not valid JSON. Choose an Open Cavas document.'
    );
  }
  const parsed = importSchema.safeParse(value);
  if (!parsed.success)
    throw new Error(
      'Unsupported document. Choose an Open Cavas file, project, or workspace JSON backup.'
    );
  return parsed.data;
}
export async function readImage(
  file: File
): Promise<{ src: string; width: number; height: number }> {
  if (
    !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)
  )
    throw new Error('Choose a PNG, JPEG, WebP, or GIF image.');
  if (file.size > 2_000_000)
    throw new Error('Image must be smaller than 2 MB.');
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Could not read this image.'));
    reader.onerror = () => reject(new Error('Could not read this image.'));
    reader.readAsDataURL(file);
  });
  const image = new Image();
  image.src = src;
  try {
    await image.decode();
  } catch {
    throw new Error('Image could not be decoded. Choose another file.');
  }
  const scale = Math.min(
    1,
    600 / Math.max(image.naturalWidth, image.naturalHeight)
  );
  return {
    src,
    width: Math.max(1, Math.round(image.naturalWidth * scale)),
    height: Math.max(1, Math.round(image.naturalHeight * scale)),
  };
}

export function exportSvg(doc: DesignDocument, selectedIds: string[]) {
  const result = renderSvg(doc, selectedIds);
  download(result.svg, `${result.name}.svg`, 'image/svg+xml');
}
