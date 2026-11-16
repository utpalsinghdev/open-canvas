import { parse, type DefaultTreeAdapterTypes } from 'parse5';
import { CSSStyleDeclaration } from 'cssstyle';
import { forbiddenHtml, type HtmlNode, type HtmlParser } from '@open-cavas/mcp/html-parser';

/** Parse data only. No DOM emulation, script execution, filesystem or networking. */
export const parseServerHtml: HtmlParser = (html) => {
  const document = parse(html, { scriptingEnabled: false });
  let count = 0;
  function nodes(children: DefaultTreeAdapterTypes.ChildNode[], depth: number): HtmlNode[] {
    if (depth > 23) throw new Error('HTML exceeds 20 levels. Split the import.');
    return children.flatMap((node): HtmlNode[] => {
      if (++count > 2000) throw new Error('HTML contains too many elements or text fragments. Split the import.');
      if ('tagName' in node) {
        if (forbiddenHtml.has(node.tagName))
          throw new Error('Scripts, stylesheets, embeds, and active HTML are not supported.');
        if (node.namespaceURI !== 'http://www.w3.org/1999/xhtml')
          throw new Error('Only HTML elements are supported.');
        const attributes = new Map(node.attrs.map(({ name, value }) => [name, value]));
        const style = new CSSStyleDeclaration();
        style.cssText = attributes.get('style') ?? '';
        const children = nodes(node.childNodes, depth + 1);
        if (node.tagName === 'html' || node.tagName === 'body') return children;
        if (node.tagName === 'head') return [];
        return [{ kind: 'element', tag: node.tagName, attributes, style, children }];
      }
      if (node.nodeName === '#text' && 'value' in node) return [{ kind: 'text', text: node.value }];
      return [];
    });
  }
  return nodes(document.childNodes, 0);
};
