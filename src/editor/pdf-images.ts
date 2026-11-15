// Inspect container headers before asking the browser to decode compressed pixels.
// Documents already bound encoded bytes; this also bounds decoded image area.
export function validatePdfImage(src: string) {
  const [header, encoded] = src.split(',');
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  const invalid = () => { throw new Error('Invalid or unsupported image container.'); };
  let pixels = 0;
  const check = (width: number, height: number) => {
    if (!width || !height || width * height > 16_000_000)
      throw new Error('Source image exceeds 16 megapixels or has invalid dimensions.');
    pixels = Math.max(pixels, width * height);
  };
  if (header === 'data:image/png;base64' && binary.startsWith('\x89PNG\r\n\x1a\n') && binary.slice(12, 16) === 'IHDR' && bytes.length >= 24) {
    check(view.getUint32(16), view.getUint32(20));
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = view.getUint32(offset);
      if (length > bytes.length - offset - 12) return invalid();
      if (binary.slice(offset + 4, offset + 8) === 'acTL')
        throw new Error('Animated PNG is unsupported. Use a static PNG or JPEG.');
      offset += length + 12;
    }
    return pixels;
  }
  if (header === 'data:image/jpeg;base64' && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let dimensions = false;
    for (let offset = 2; offset + 4 <= bytes.length;) {
      if (bytes[offset] !== 0xff) return invalid();
      const marker = bytes[offset + 1];
      if (marker === 0xff) { offset++; continue; }
      if (marker === 0xda || marker === 0xd9) break;
      const length = view.getUint16(offset + 2);
      if (length < 2 || offset + 2 + length > bytes.length) return invalid();
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        if (length < 8) return invalid();
        check(view.getUint16(offset + 7), view.getUint16(offset + 5));
        dimensions = true;
      }
      offset += length + 2;
    }
    if (!dimensions) return invalid();
    return pixels;
  }
  if (header === 'data:image/webp;base64' && binary.startsWith('RIFF') && binary.slice(8, 12) === 'WEBP') {
    let dimensions = false;
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const kind = binary.slice(offset, offset + 4);
      const length = view.getUint32(offset + 4, true);
      const start = offset + 8;
      if (length > bytes.length - start) return invalid();
      if (kind === 'ANIM' || kind === 'ANMF' || (kind === 'VP8X' && (bytes[start] & 2)))
        throw new Error('Animated WebP is unsupported. Use a static PNG or JPEG.');
      if (kind === 'VP8X' && length >= 10) {
        const uint24 = (at: number) => bytes[at] + bytes[at + 1] * 256 + bytes[at + 2] * 65536;
        check(uint24(start + 4) + 1, uint24(start + 7) + 1);
        dimensions = true;
      } else if (kind === 'VP8 ' && length >= 10 && binary.slice(start + 3, start + 6) === '\x9d\x01\x2a') {
        check(view.getUint16(start + 6, true) & 0x3fff, view.getUint16(start + 8, true) & 0x3fff);
        dimensions = true;
      } else if (kind === 'VP8L' && length >= 5 && bytes[start] === 0x2f) {
        const bits = view.getUint32(start + 1, true);
        check((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
        dimensions = true;
      }
      offset = start + length + (length % 2);
    }
    if (!dimensions) return invalid();
    return pixels;
  }
  throw new Error('Use a valid static PNG, JPEG, or WebP. GIF is unsupported.');
}
