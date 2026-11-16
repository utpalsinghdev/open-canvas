import { forbiddenHtml, type HtmlNode, type HtmlParser } from '@open-cavas/mcp/html-parser';

/** Browser adapter only. Layout and supported-content policy live in html.ts. */
export const parseBrowserHtml: HtmlParser = (html) => {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  if (parsed.querySelector([...forbiddenHtml].join(',')))
    throw new Error('Scripts, stylesheets, embeds, and active HTML are not supported.');
  let count = 0;
  function nodes(parent: Element, depth: number): HtmlNode[] {
    if (depth > 21) throw new Error('HTML exceeds 20 levels. Split the import.');
    return [...parent.childNodes].flatMap((node): HtmlNode[] => {
      if (++count > 2000) throw new Error('HTML contains too many elements or text fragments. Split the import.');
      if (node.nodeType === Node.TEXT_NODE) return [{ kind: 'text', text: node.textContent ?? '' }];
      if (!(node instanceof HTMLElement)) {
        if (node instanceof Element) throw new Error('Only HTML elements are supported.');
        return [];
      }
      return [{ kind: 'element', tag: node.localName,
        attributes: new Map([...node.attributes].map(({ name, value }) => [name, value])),
        style: node.style, children: nodes(node, depth + 1) }];
    });
  }
  return nodes(parsed.body, 0);
};
