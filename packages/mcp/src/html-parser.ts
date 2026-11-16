export type ImportStyle = {
  getPropertyValue(property: string): string;
} & Record<
  'display' | 'position' | 'left' | 'top' | 'width' | 'height' | 'padding' | 'opacity' | 'backgroundColor' | 'background' | 'whiteSpace' | 'fontSize' | 'fontFamily' | 'lineHeight' | 'letterSpacing' | 'color' | 'fontWeight' | 'textAlign' | 'borderRadius',
  string
>;
export type HtmlNode = { kind: 'text'; text: string } | {
  kind: 'element'; tag: string; attributes: Map<string, string>;
  style: ImportStyle; children: HtmlNode[];
};
export type HtmlParser = (html: string) => HtmlNode[];
export const forbiddenHtml = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'svg', 'math']);
