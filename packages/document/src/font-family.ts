import { z } from 'zod';

/** Document values are literal names, never CSS expressions or font sources. */
export const fontFamilySchema = z.string().trim().min(1).max(100)
  .regex(/^[^\u0000-\u001f\u007f-\u009f\u2028\u2029]+$/u, 'Font names cannot contain control characters.')
  .refine((family) => !/(:\/\/|^(?:data:|file:|javascript:|url\s*\())/i.test(family), 'Enter a family name, not a URL.');

/** Browser family matching is case-insensitive; keep saved spelling separate. */
export function bundledFontFamily(family: string) {
  switch (family.toLowerCase()) {
    case 'inter': return 'Inter';
    case 'bricolage grotesque': return 'Bricolage Grotesque';
    default: return undefined;
  }
}

export function quoteFontFamily(family: string) {
  return `"${family.replace(/["\\]/g, '\\$&')}"`;
}

/** Quote even CSS keywords; all document input remains one literal family. */
export function fontCssFamily(family: string) {
  return `${quoteFontFamily(family)}, Arial, sans-serif`;
}

/** CSSOM returns quoted/escaped names. Decode one CSS string, never a stack. */
export function parseCssFontFamily(value: string) {
  const quoted = value.startsWith('"') ? /^"((?:[^"\\]|\\.)*)"$/.exec(value)
    : value.startsWith("'") ? /^'((?:[^'\\]|\\.)*)'$/.exec(value) : null;
  if (!quoted && /[,"'\\]/.test(value)) throw new Error('Use one literal font family, not a font stack.');
  const family = (quoted?.[1] ?? value).replace(/\\([0-9a-f]{1,6})(?:[ \t\r\n\f])?|\\([^\r\n\f])/gi,
    (_match: string, hex: string | undefined, character: string | undefined) => {
      if (!hex) return character ?? '';
      const code = Number.parseInt(hex, 16);
      return String.fromCodePoint(code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff) ? 0xfffd : code);
    });
  return fontFamilySchema.parse(family);
}
