import { z } from 'zod';
import { fontFamilySchema } from '@open-cavas/document/font-family';
import { fileDocumentSchema, locationSchema } from '@open-cavas/document/workspace';
import { workspaceTools } from './workspace-tools';
import { reviewTools } from './review-tools';
import { target, pageMutationTarget as write } from './target';
export { targetSchema, mutationTargetSchema } from './target';
import {
  documentSchema,
  nodeSchema,
  tokensSchema,
} from '@open-cavas/document/model';

const id = nodeSchema.options[1].shape.id;
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
    fontFamily: fontFamilySchema,
    fontWeight: nodeSchema.options[3].shape.fontWeight.removeDefault(),
    lineHeight: nodeSchema.options[3].shape.lineHeight.removeDefault(),
    letterSpacing: nodeSchema.options[3].shape.letterSpacing.removeDefault(),
    wrap: nodeSchema.options[3].shape.wrap.removeDefault(),
    sizing: nodeSchema.options[3].shape.sizing.removeDefault(),
    align: nodeSchema.options[3].shape.align.removeDefault(),
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
const canvasTools = {
  get_document: read(
    'Read the active-page projection, file/page metadata, current context, and revision. Use export_document JSON or get_file to obtain the complete multi-page file. Image bytes are omitted by default.',
    z.object({ ...target, includeImages: z.boolean().default(false) })
  ),
  get_tree: read(
    'Read the current page layer tree and all pages in the active file.',
    z.object(target)
  ),
  get_node: read(
    'Read one layer including its style and geometry, without embedded image bytes. Text layers include measured layout, overflow, and requested/resolved font status.',
    z.object({ ...target, nodeId: id })
  ),
  get_fonts: read(
    'Read suggested and document font families, or query up to 50 family names. Browser targets detect system fonts by metrics, not installed-file/weight enumeration. Workspace targets report native font registry availability. Font URLs are never accepted.',
    z.object({ ...target, families: z.array(fontFamilySchema).min(1).max(50).optional() })
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
    'Create a new blank file in the active project and open it. Existing files are kept. Prefer create_file with an explicit project ID.',
    { name: z.string().trim().min(1).max(160) }
  ),
  open_document: mutation(
    'Import a validated version-1 legacy document or version-2 multi-page file as a NEW file in the active project. Existing files are kept. Does not read filesystem paths.',
    { document: z.union([fileDocumentSchema, documentSchema]) }
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
  export_combined_pdf: read(
    'Return a base64 application/pdf with one rasterized page per explicitly named visible artboard, in document order. Choose scope page explicitly for one whole-page export. Requires canvasId, not workspaceId. 96 px/in, 2× raster, white background; no selectable text or vectors. Max 32 pages, 4096 px/side and 8 MP/page at 2×, 32 MP total, 8 MB PDF. GIF/animated WebP and unavailable bundled fonts fail. No filesystem writes.',
    z.object({
      ...target,
      scope: z.enum(['artboards', 'page']),
      artboardIds: ids.optional(),
    }).strict()
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
export const tools = { ...canvasTools, ...workspaceTools, ...reviewTools };
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
    workspaceId: id,
    name: z.string().max(160),
    revision: z.number().int().nonnegative(),
    context: locationSchema,
  }),
  z.object({
    type: z.literal('state'),
    name: z.string().max(160),
    revision: z.number().int().nonnegative(),
    context: locationSchema,
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
    'text font selection, variable weights, line-height, tracking, alignment, wrapping, text sizing and overflow inspection',
    'property/text editing',
    'move/duplicate/delete/reorder',
    'undo/redo',
    'restricted static HTML import',
    'JSON/SVG/HTML/SVG-JSX export',
    'paginated raster PDF export for explicit artboards or page',
    'artwork PNG screenshots',
    'file design tokens',
    'projects, multiple files, page lifecycle and navigation',
    'project/workspace JSON backups',
    'local page/layer/position review threads with MCP list/read/status operations',
  ],
  limitations: [
    'Library deletions are permanent; page/content edits use per-file session history.',
    'Explicitly selected local workspaces persist in private service storage; stale browser and agent revisions reject writes rather than merging.',
    'No third-party editable design document compatibility.',
    'HTML/CSS subset only; no flex, grid, remote assets, arbitrary DOM or rich-text fidelity.',
    'Tokens support color, number, and font values with explicit application, not dynamic bindings or CSS themes.',
    'No multiplayer merging; stale state revisions reject writes.',
    'workspaceId supports all document tools directly in the backend, including restricted HTML import, visual exports and native PNG rendering. Font substitutions are explicit; native and browser pixels may differ.',
  ],
};
