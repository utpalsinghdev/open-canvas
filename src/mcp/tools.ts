import { z } from 'zod';
import {
  documentSchema,
  nodeSchema,
  fonts,
  tokensSchema,
} from '../editor/model';

const id = nodeSchema.options[1].shape.id;
const target = {
  canvasId: id.describe(
    'Use an ID returned by list_canvases. Never guess the active tab.'
  ),
};
const write = {
  ...target,
  expectedRevision: z
    .number()
    .int()
    .nonnegative()
    .describe(
      'Latest state revision. Stale writes fail without changing the document.'
    ),
};
const ids = z
  .array(id)
  .min(1)
  .max(1000)
  .refine(
    (values) => new Set(values).size === values.length,
    'IDs must not repeat.'
  );
export const propertiesSchema = z
  .object({
    ...nodeSchema.options[1].shape,
    text: nodeSchema.options[3].shape.text,
    fontSize: nodeSchema.options[3].shape.fontSize,
    fontFamily: z.enum(fonts),
    fontWeight: nodeSchema.options[3].shape.fontWeight,
    align: nodeSchema.options[3].shape.align,
    src: nodeSchema.options[4].shape.src,
  })
  .omit({ id: true, kind: true })
  .partial()
  .strict();
export const draftSchema = propertiesSchema
  .extend({
    kind: z.enum(['rectangle', 'ellipse', 'text', 'image']),
    x: nodeSchema.options[1].shape.x,
    y: nodeSchema.options[1].shape.y,
  })
  .strict();
const read = <T extends z.ZodRawShape>(
  description: string,
  schema: z.ZodObject<T>
) => ({ description, schema, mutation: false });
const mutation = <T extends z.ZodRawShape>(description: string, fields: T) => ({
  description,
  schema: z.object({ ...write, ...fields }).strict(),
  mutation: true,
});
export const tools = {
  get_document: read(
    'Read the current document and revision. Image payloads are omitted unless includeImages is true.',
    z.object({ ...target, includeImages: z.boolean().default(false) })
  ),
  get_tree: read(
    'Read the layer tree, stable IDs, names, and parent relationships.',
    z.object(target)
  ),
  get_node: read(
    'Read one layer including its style and geometry, without embedded image bytes.',
    z.object({ ...target, nodeId: id })
  ),
  get_selection: read('Read selected layer IDs.', z.object(target)),
  get_styles: read(
    'Read supported inline style properties for specified layer IDs.',
    z.object({ ...target, nodeIds: ids })
  ),
  select_nodes: mutation('Set selection. An empty list clears selection.', {
    nodeIds: z.array(id).max(1000),
  }),
  create_artboard: mutation(
    'Create an artboard. Coordinates are absolute world pixels.',
    {
      name: z.string().min(1).max(160),
      x: z.number().finite(),
      y: z.number().finite(),
      width: z.number().min(1).max(20_000).default(640),
      height: z.number().min(1).max(20_000).default(480),
      fill: nodeSchema.options[1].shape.fill.default('#ffffff'),
    }
  ),
  create_nodes: mutation(
    'Create up to 100 editable shapes, text layers, or safe embedded raster images in one undo step. Parent must be an artboard. Coordinates are absolute, not relative to parent.',
    { nodes: z.array(draftSchema).min(1).max(100) }
  ),
  update_nodes: mutation(
    'Atomically patch layer properties. Locked layers reject changes except a direct unlock. Moving an artboard also moves its children. No ID or kind changes.',
    {
      updates: z
        .array(z.object({ nodeId: id, properties: propertiesSchema }))
        .min(1)
        .max(100),
    }
  ),
  set_text: mutation('Replace text content in a text layer.', {
    nodeId: id,
    text: z.string().max(10_000),
  }),
  move_nodes: mutation(
    'Translate layers and artboard children in world pixels.',
    { nodeIds: ids, dx: z.number().finite(), dy: z.number().finite() }
  ),
  duplicate_nodes: mutation(
    'Duplicate layers and artboard children, returning new IDs.',
    { nodeIds: ids }
  ),
  delete_nodes: mutation(
    'Delete layers and artboard children in one undo step. Locked targets reject the operation.',
    { nodeIds: ids }
  ),
  reorder_nodes: mutation(
    'Bring layers to front or send them to back within their parent.',
    { nodeIds: ids, placement: z.enum(['front', 'back']) }
  ),
  rename_document: mutation('Rename the open document.', {
    name: z.string().trim().min(1).max(160),
  }),
  create_document: mutation(
    'Replace the open document with a blank one. Undo restores previous work. Does not manage filesystem paths.',
    { name: z.string().trim().min(1).max(160) }
  ),
  open_document: mutation(
    'Open validated Open Cavas JSON data. Undo restores previous work. Does not read local filesystem paths.',
    { document: documentSchema }
  ),
  undo: mutation('Undo the latest document edit, including manual edits.', {}),
  redo: mutation('Redo the latest undone document edit.', {}),
  write_html: mutation(
    'Import a restricted static HTML subset into an existing artboard as editable layers. Supports explicit pixel geometry, simple vertical flow, hex colors, text, padding, and embedded raster images. Rejects scripts, network assets, flex/grid, and unsupported CSS. Not arbitrary web-page rendering.',
    { artboardId: id, html: z.string().min(1).max(100_000) }
  ),
  export_document: read(
    'Return JSON, SVG, standalone HTML containing SVG, or SVG JSX source. nodeId optionally targets a visible artboard. No filesystem writes.',
    z.object({
      ...target,
      format: z.enum(['json', 'svg', 'html', 'jsx']),
      artboardId: id.optional(),
    })
  ),
  get_screenshot: read(
    'Render visible artwork or one artboard as PNG, not editor chrome. Maximum side 4096 pixels and area 8 megapixels.',
    z.object({
      ...target,
      artboardId: id.optional(),
      scale: z.number().min(0.1).max(4).default(1),
    })
  ),
  get_design_tokens: read(
    'Read named color, number, and font design tokens stored in this document.',
    z.object(target)
  ),
  set_design_tokens: mutation(
    'Replace the document token dictionary. Tokens are metadata until explicitly applied. They do not dynamically bind layer properties.',
    { tokens: tokensSchema }
  ),
  apply_design_token: mutation(
    'Copy a named token value into a compatible property on selected node IDs. This is a literal assignment, not a dynamic binding.',
    {
      token: z.string().min(1).max(80),
      nodeIds: ids,
      property: z.enum([
        'fill',
        'fontFamily',
        'fontSize',
        'radius',
        'opacity',
        'width',
        'height',
      ]),
    }
  ),
};
export const targetSchema = z.object(target);
export const mutationTargetSchema = z.object(write);
export const browserRequestSchema = z.object({
  type: z.literal('request'),
  id: z.string(),
  method: z.string(),
  args: z.unknown(),
});
export const browserMessageSchema = z.union([
  z.object({
    type: z.literal('hello'),
    canvasId: id,
    name: z.string().max(160),
    revision: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('state'),
    name: z.string().max(160),
    revision: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('result'),
    id: z.string(),
    ok: z.literal(true),
    data: z.unknown(),
  }),
  z.object({
    type: z.literal('result'),
    id: z.string(),
    ok: z.literal(false),
    error: z.string().max(2000),
  }),
]);
export const coverage = {
  supported: [
    'document/tree/node/style reads',
    'selection',
    'artboard creation',
    'batch shape/text/image creation',
    'property/text editing',
    'move/duplicate/delete/reorder',
    'undo/redo',
    'restricted static HTML import',
    'JSON/SVG/HTML/SVG-JSX export',
    'artwork PNG screenshots',
    'document design tokens',
  ],
  limitations: [
    'One page per document; no multi-page manager.',
    'No Paper file compatibility or official API dependency.',
    'HTML/CSS subset only; no flex, grid, remote assets, arbitrary DOM or rich-text fidelity.',
    'Tokens support color, number, and font values with explicit application, not dynamic bindings or CSS themes.',
    'No multiplayer merging; stale state revisions reject writes.',
    'A paired browser must be open. No headless editor or server-side document storage.',
  ],
};
