import type { DesignNode } from '@open-cavas/document/model';
import type { FileRecord } from '@open-cavas/document/workspace';

// Node schema fields are all scalar. Compare parsed values so defaults and
// normalization still apply before a previous node can be reused.
function sameNode(previous: DesignNode, next: DesignNode) {
  const fields = new Map<string, unknown>(Object.entries(previous));
  const entries = Object.entries(next);
  return (
    fields.size === entries.length &&
    entries.every(([key, value]) =>
      fields.has(key) && Object.is(fields.get(key), value)
    )
  );
}

/** Reuse only references from the previous validated state, never unparsed input. */
export function shareFile(
  previous: FileRecord | undefined,
  source: FileRecord,
  parsed: FileRecord
): FileRecord {
  if (!previous) return parsed;
  if (source === previous) return previous;
  if (source.document === previous.document)
    return { ...parsed, document: previous.document };
  const unchangedPages = new Set(previous.document.pages);
  const previousPages = new Map(
    previous.document.pages.map((page) => [page.id, page])
  );
  return {
    ...parsed,
    document: {
      ...parsed.document,
      tokens:
        source.document.tokens === previous.document.tokens
          ? previous.document.tokens
          : parsed.document.tokens,
      pages: parsed.document.pages.map((page, index) => {
        const sourcePage = source.document.pages[index];
        if (unchangedPages.has(sourcePage)) return sourcePage;
        const previousPage = previousPages.get(page.id);
        if (!previousPage) return page;
        if (sourcePage.nodes === previousPage.nodes)
          return { ...page, nodes: previousPage.nodes };
        const previousNodes = new Map(
          previousPage.nodes.map((node) => [node.id, node])
        );
        return {
          ...page,
          nodes: page.nodes.map((node) => {
            const previousNode = previousNodes.get(node.id);
            return previousNode && sameNode(previousNode, node)
              ? previousNode
              : node;
          }),
        };
      }),
    },
  };
}
