import {
  createNode,
  documentSchema,
  isLocked,
  newId,
  nodeSchema,
  withChildren,
  type DesignDocument,
} from '@open-cavas/document/model';
import type { EditorStore } from '@open-cavas/engine/state';
import { translated } from '@open-cavas/engine/geometry';
import { tools, propertiesSchema } from './tools';
import { importHtml } from './html';
import type { HtmlParser } from './html-parser';

export function createMutations(useEditor: Pick<EditorStore, 'getState'>, htmlParser: HtmlParser) {
type Properties = import('zod').infer<typeof propertiesSchema>;
function targets(ids: string[], mutable = true) {
  const { document } = useEditor.getState();
  return ids.map((id) => {
    const node = document.nodes.find((item) => item.id === id);
    if (!node) throw new Error(`Layer not found: ${id}`);
    if (mutable && isLocked(node, document.nodes))
      throw new Error(`Layer is locked: ${id}`);
    return node;
  });
}
function commit(document: DesignDocument) {
  const parsed = documentSchema.parse(document);
  if (!useEditor.getState().edit(() => parsed))
    throw new Error('Document change rejected.');
}
function update(updates: { nodeId: string; properties: Properties }[]) {
  const document = useEditor.getState().document;
  if (new Set(updates.map((item) => item.nodeId)).size !== updates.length)
    throw new Error('Each layer may be updated only once per batch.');
  for (const item of updates) {
    const node = targets([item.nodeId], false)[0];
    const unlockOnly =
      Object.keys(item.properties).length === 1 &&
      item.properties.locked === false;
    if (isLocked(node, document.nodes) && !unlockOnly)
      throw new Error(`Layer is locked: ${node.id}`);
    const allowed =
      node.kind === 'text'
        ? nodeSchema.options[3].shape
        : node.kind === 'image'
          ? nodeSchema.options[4].shape
          : nodeSchema.options[1].shape;
    for (const key of Object.keys(item.properties))
      if (!(key in allowed))
        throw new Error(`Property ${key} does not apply to ${node.kind}.`);
  }
  const nodes = document.nodes.map((node) => {
    const own = updates.find((item) => item.nodeId === node.id);
    const parent = updates.find((item) => item.nodeId === node.parentId);
    const originalParent = document.nodes.find(
      (item) => item.id === node.parentId
    );
    const dx =
      parent && originalParent
        ? (parent.properties.x ?? originalParent.x) - originalParent.x
        : 0;
    const dy =
      parent && originalParent
        ? (parent.properties.y ?? originalParent.y) - originalParent.y
        : 0;
    return nodeSchema.parse({
      ...translated(node, dx, dy),
      ...own?.properties,
    });
  });
  commit({ ...document, nodes });
}
function duplicate(ids: string[]) {
  const state = useEditor.getState();
  targets(ids);
  const expanded = withChildren(ids, state.document.nodes);
  const mapping = new Map([...expanded].map((id) => [id, newId()]));
  const nodes = state.document.nodes
    .filter((node) => expanded.has(node.id))
    .map((node) =>
      nodeSchema.parse({
        ...node,
        id: mapping.get(node.id),
        name: `${node.name.slice(0, 155)} copy`,
        x: node.x + 24,
        y: node.y + 24,
        parentId: node.parentId
          ? (mapping.get(node.parentId) ?? node.parentId)
          : null,
      })
    );
  commit({ ...state.document, nodes: [...state.document.nodes, ...nodes] });
  state.select(ids.map((id) => mapping.get(id) ?? id));
  return { mapping: Object.fromEntries(mapping) };
}
const mutations: Record<string, (value: unknown) => unknown> = {
  select_nodes(value) {
    const args = tools.select_nodes.schema.parse(value);
    targets(args.nodeIds, false);
    useEditor.getState().select([...new Set(args.nodeIds)]);
    return { selectedIds: useEditor.getState().selectedIds };
  },
  create_artboard(value) {
    const { name, x, y, width, height, fill } =
      tools.create_artboard.schema.parse(value);
    const node = { ...createNode('artboard', x, y), name, width, height, fill };
    const state = useEditor.getState();
    commit({ ...state.document, nodes: [...state.document.nodes, node] });
    state.select([node.id]);
    return { createdIds: [node.id] };
  },
  create_nodes(value) {
    const { nodes: drafts } = tools.create_nodes.schema.parse(value);
    const state = useEditor.getState();
    const nodes = drafts.map((draft) => {
      if (draft.parentId) targets([draft.parentId]);
      const defaults =
        draft.kind === 'image'
          ? { ...createNode('rectangle', draft.x, draft.y), kind: 'image' }
          : createNode(draft.kind, draft.x, draft.y);
      const parsed = nodeSchema.parse({ ...defaults, ...draft });
      const permitted =
        parsed.kind === 'text'
          ? nodeSchema.options[3].shape
          : parsed.kind === 'image'
            ? nodeSchema.options[4].shape
            : nodeSchema.options[1].shape;
      for (const key of Object.keys(draft))
        if (!(key in permitted))
          throw new Error(`Property ${key} does not apply to ${draft.kind}.`);
      return parsed;
    });
    commit({ ...state.document, nodes: [...state.document.nodes, ...nodes] });
    state.select(nodes.map((node) => node.id));
    return { createdIds: nodes.map((node) => node.id) };
  },
  update_nodes(value) {
    const args = tools.update_nodes.schema.parse(value);
    update(args.updates);
    return { updatedIds: args.updates.map((item) => item.nodeId) };
  },
  set_text(value) {
    const args = tools.set_text.schema.parse(value);
    update([{ nodeId: args.nodeId, properties: { text: args.text } }]);
    return { updatedIds: [args.nodeId] };
  },
  move_nodes(value) {
    const args = tools.move_nodes.schema.parse(value);
    targets(args.nodeIds);
    const state = useEditor.getState();
    const ids = withChildren(args.nodeIds, state.document.nodes);
    commit({
      ...state.document,
      nodes: state.document.nodes.map((node) =>
        ids.has(node.id) ? translated(node, args.dx, args.dy) : node
      ),
    });
    return { movedIds: [...ids] };
  },
  duplicate_nodes(value) {
    return duplicate(tools.duplicate_nodes.schema.parse(value).nodeIds);
  },
  delete_nodes(value) {
    const args = tools.delete_nodes.schema.parse(value);
    targets(args.nodeIds);
    const state = useEditor.getState();
    const ids = withChildren(args.nodeIds, state.document.nodes);
    commit({
      ...state.document,
      nodes: state.document.nodes.filter((node) => !ids.has(node.id)),
    });
    state.select(state.selectedIds.filter((id) => !ids.has(id)));
    return { deletedIds: [...ids] };
  },
  reorder_nodes(value) {
    const args = tools.reorder_nodes.schema.parse(value);
    targets(args.nodeIds);
    const state = useEditor.getState();
    const ids = new Set(args.nodeIds);
    const chosen = state.document.nodes.filter((node) => ids.has(node.id));
    const rest = state.document.nodes.filter((node) => !ids.has(node.id));
    commit({
      ...state.document,
      nodes:
        args.placement === 'front'
          ? [...rest, ...chosen]
          : [...chosen, ...rest],
    });
    return { reorderedIds: args.nodeIds };
  },
  rename_document(value) {
    const args = tools.rename_document.schema.parse(value);
    commit({ ...useEditor.getState().document, name: args.name });
    return { name: args.name };
  },
  create_document(value) {
    const args = tools.create_document.schema.parse(value);
    const state = useEditor.getState();
    return { fileId: state.createFile(state.location.projectId, args.name) };
  },
  open_document(value) {
    const args = tools.open_document.schema.parse(value);
    return { fileId: useEditor.getState().importData(args.document) };
  },
  undo(value) {
    tools.undo.schema.parse(value);
    const state = useEditor.getState();
    if (!state.past.length) throw new Error('Nothing to undo.');
    state.undo();
    return { undone: true };
  },
  redo(value) {
    tools.redo.schema.parse(value);
    const state = useEditor.getState();
    if (!state.future.length) throw new Error('Nothing to redo.');
    state.redo();
    return { redone: true };
  },
  write_html(value) {
    const args = tools.write_html.schema.parse(value);
    const board = targets([args.artboardId])[0];
    if (board.kind !== 'artboard')
      throw new Error('HTML target must be an artboard.');
    const nodes = importHtml(args.html, board, htmlParser);
    if (!nodes.length)
      throw new Error('HTML produced no supported visible layers.');
    const state = useEditor.getState();
    commit({ ...state.document, nodes: [...state.document.nodes, ...nodes] });
    state.select(nodes.map((node) => node.id));
    return {
      createdIds: nodes.map((node) => node.id),
      layout: 'restricted static block flow; not browser layout',
    };
  },
  set_design_tokens(value) {
    const args = tools.set_design_tokens.schema.parse(value);
    commit({ ...useEditor.getState().document, tokens: args.tokens });
    return { tokens: args.tokens };
  },
  apply_design_token(value) {
    const args = tools.apply_design_token.schema.parse(value);
    const token = useEditor.getState().document.tokens[args.token];
    if (!token) throw new Error('Design token not found.');
    const expected =
      args.property === 'fill'
        ? 'color'
        : args.property === 'fontFamily'
          ? 'font'
          : 'number';
    if (token.type !== expected)
      throw new Error(
        `Property ${args.property} requires a ${expected} token.`
      );
    const properties = propertiesSchema.parse({ [args.property]: token.value });
    update(args.nodeIds.map((nodeId) => ({ nodeId, properties })));
    return { appliedIds: args.nodeIds, binding: 'literal value' };
  },
};

return mutations;
}
