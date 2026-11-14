import { z } from 'zod';

const coordinate = z.number().finite().min(-100_000).max(100_000);
const size = z.number().finite().min(1).max(20_000);
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const identifier = z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/);
const base = {
  id: identifier,
  name: z.string().max(160),
  parentId: identifier.nullable(),
  x: coordinate,
  y: coordinate,
  width: size,
  height: size,
  fill: color,
  opacity: z.number().min(0).max(1),
  rotation: z.number().min(-360).max(360),
  hidden: z.boolean(),
  locked: z.boolean(),
  radius: z.number().min(0).max(10_000),
};
export const fonts = ['Arial', 'Georgia', 'Courier New', 'Inter', 'Bricolage Grotesque'] as const;
export const nodeSchema = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('artboard'), parentId: z.null(), rotation: z.literal(0) }),
  z.object({ ...base, kind: z.literal('rectangle') }),
  z.object({ ...base, kind: z.literal('ellipse') }),
  z.object({
    ...base, kind: z.literal('text'), text: z.string().max(10_000),
    fontSize: z.number().min(6).max(500), fontFamily: z.enum(fonts).default('Arial'),
    fontWeight: z.union([z.number(), z.string().regex(/^\d{3}$/).transform(Number)]).pipe(z.number().int().min(100).max(900)).default(500),
    lineHeight: z.number().min(0.5).max(4).default(1.2),
    letterSpacing: z.number().min(-100).max(100).default(0),
    align: z.enum(['left', 'center', 'right']).default('left'),
    wrap: z.boolean().default(false),
    sizing: z.enum(['fixed', 'auto-height', 'auto-width']).default('fixed'),
  }),
  z.object({
    ...base, kind: z.literal('image'),
    src: z.string().max(2_800_000).regex(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/),
  }),
]);
export const tokenSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('color'), value: color }),
  z.object({ type: z.literal('number'), value: z.number().finite().min(-100_000).max(100_000) }),
  z.object({ type: z.literal('font'), value: z.enum(fonts) }),
]);
export const tokensSchema = z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/), tokenSchema).refine((tokens) => Object.keys(tokens).length <= 200, 'At most 200 design tokens.');
export const documentSchema = z.object({
  version: z.literal(1),
  name: z.string().min(1).max(160),
  nodes: z.array(nodeSchema).max(1000),
  tokens: tokensSchema.default({}),
}).superRefine((doc, ctx) => {
  const ids = new Set<string>();
  const artboards = new Set(doc.nodes.filter((node) => node.kind === 'artboard').map((node) => node.id));
  for (const [nodeIndex, node] of doc.nodes.entries()) {
    if (ids.has(node.id)) ctx.addIssue({ code: 'custom', message: 'Layer IDs must be unique.' });
    ids.add(node.id);
    if (node.parentId !== null && !artboards.has(node.parentId)) {
      ctx.addIssue({ code: 'custom', message: 'Layers must belong to an existing artboard.' });
    }
    if (node.kind === 'text' && node.fontFamily === 'Bricolage Grotesque' && (node.fontWeight < 300 || node.fontWeight > 800)) {
      ctx.addIssue({ code: 'custom', path: ['nodes', nodeIndex, 'fontWeight'], message: 'Bricolage Grotesque supports weights 300 through 800.' });
    }
  }
});
export type DesignNode = z.infer<typeof nodeSchema>;
export type DesignDocument = z.infer<typeof documentSchema>;
export type NodeKind = DesignNode['kind'];
export type Tool = 'select' | 'hand' | 'artboard' | 'rectangle' | 'ellipse' | 'text' | 'comment';
export type Bounds = Pick<DesignNode, 'x' | 'y' | 'width' | 'height'>;
export type Camera = { x: number; y: number; zoom: number };

/** getRandomValues works on HTTP tailnet origins, unlike randomUUID. */
export function newId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createNode(kind: 'artboard', x: number, y: number): Extract<DesignNode, { kind: 'artboard' }>;
export function createNode(kind: 'text', x: number, y: number): Extract<DesignNode, { kind: 'text' }>;
export function createNode(kind: 'rectangle', x: number, y: number): Extract<DesignNode, { kind: 'rectangle' }>;
export function createNode(kind: 'ellipse', x: number, y: number): Extract<DesignNode, { kind: 'ellipse' }>;
export function createNode(kind: Exclude<NodeKind, 'image'>, x: number, y: number): DesignNode;
export function createNode(kind: Exclude<NodeKind, 'image'>, x: number, y: number): DesignNode {
  const common = {
    id: newId(), name: kind[0].toUpperCase() + kind.slice(1), parentId: null,
    x, y, width: 180, height: 120, fill: '#d9f171', opacity: 1, rotation: 0,
    hidden: false, locked: false, radius: 0,
  };
  switch (kind) {
    case 'artboard': return { ...common, kind, rotation: 0, width: 640, height: 480, fill: '#ffffff' };
    case 'text': return { ...common, kind, width: 280, height: 70, fill: '#ffffff', text: 'Your text', fontSize: 40, fontFamily: 'Arial', fontWeight: 500, lineHeight: 1.2, letterSpacing: 0, align: 'left', wrap: false, sizing: 'fixed' };
    case 'rectangle': return { ...common, kind };
    case 'ellipse': return { ...common, kind, width: 140, height: 140 };
  }
}

export function getBounds(nodes: DesignNode[]): Bounds | null {
  if (!nodes.length) return null;
  const boxes = nodes.map((node) => {
    const angle = node.rotation * Math.PI / 180;
    const width = Math.abs(node.width * Math.cos(angle)) + Math.abs(node.height * Math.sin(angle));
    const height = Math.abs(node.width * Math.sin(angle)) + Math.abs(node.height * Math.cos(angle));
    return { x: node.x + (node.width - width) / 2, y: node.y + (node.height - height) / 2, width, height };
  });
  const left = Math.min(...boxes.map((node) => node.x));
  const top = Math.min(...boxes.map((node) => node.y));
  return {
    x: left, y: top,
    width: Math.max(...boxes.map((node) => node.x + node.width)) - left,
    height: Math.max(...boxes.map((node) => node.y + node.height)) - top,
  };
}

export function isHidden(node: DesignNode, nodes: DesignNode[]) {
  return node.hidden || nodes.some((parent) => parent.id === node.parentId && parent.hidden);
}

export function isLocked(node: DesignNode, nodes: DesignNode[]) {
  return node.locked || nodes.some((parent) => parent.id === node.parentId && parent.locked);
}

/** Artboards are containers, so every operation on one includes its children. */
export function withChildren(ids: string[], nodes: DesignNode[]) {
  return new Set([...ids, ...nodes.filter((node) => node.parentId && ids.includes(node.parentId)).map((node) => node.id)]);
}
