import { z } from 'zod';

const coordinate = z.number().finite().min(-100_000).max(100_000);
const size = z.number().finite().min(1).max(20_000);
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const base = {
  id: z.string().min(1).max(100),
  name: z.string().max(160),
  parentId: z.string().nullable(),
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
export const fonts = ['Arial', 'Georgia', 'Courier New'] as const;
export const nodeSchema = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('artboard'), parentId: z.null(), rotation: z.literal(0) }),
  z.object({ ...base, kind: z.literal('rectangle') }),
  z.object({ ...base, kind: z.literal('ellipse') }),
  z.object({
    ...base, kind: z.literal('text'), text: z.string().max(10_000),
    fontSize: z.number().min(6).max(500), fontFamily: z.enum(fonts),
    fontWeight: z.enum(['400', '500', '600', '700']),
    align: z.enum(['left', 'center', 'right']),
  }),
  z.object({
    ...base, kind: z.literal('image'),
    src: z.string().max(2_800_000).regex(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/),
  }),
]);
export const documentSchema = z.object({
  version: z.literal(1),
  name: z.string().min(1).max(160),
  nodes: z.array(nodeSchema).max(1000),
}).superRefine((doc, ctx) => {
  const ids = new Set<string>();
  const artboards = new Set(doc.nodes.filter((node) => node.kind === 'artboard').map((node) => node.id));
  for (const node of doc.nodes) {
    if (ids.has(node.id)) ctx.addIssue({ code: 'custom', message: 'Layer IDs must be unique.' });
    ids.add(node.id);
    if (node.parentId !== null && !artboards.has(node.parentId)) {
      ctx.addIssue({ code: 'custom', message: 'Layers must belong to an existing artboard.' });
    }
  }
});
export type DesignNode = z.infer<typeof nodeSchema>;
export type DesignDocument = z.infer<typeof documentSchema>;
export type NodeKind = DesignNode['kind'];
export type Tool = 'select' | 'hand' | 'artboard' | 'rectangle' | 'ellipse' | 'text';
export type Bounds = Pick<DesignNode, 'x' | 'y' | 'width' | 'height'>;
export type Camera = { x: number; y: number; zoom: number };

export function createNode(kind: 'artboard', x: number, y: number): Extract<DesignNode, { kind: 'artboard' }>;
export function createNode(kind: 'text', x: number, y: number): Extract<DesignNode, { kind: 'text' }>;
export function createNode(kind: 'rectangle', x: number, y: number): Extract<DesignNode, { kind: 'rectangle' }>;
export function createNode(kind: 'ellipse', x: number, y: number): Extract<DesignNode, { kind: 'ellipse' }>;
export function createNode(kind: Exclude<NodeKind, 'image'>, x: number, y: number): DesignNode;
export function createNode(kind: Exclude<NodeKind, 'image'>, x: number, y: number): DesignNode {
  const common = {
    id: crypto.randomUUID(), name: kind[0].toUpperCase() + kind.slice(1), parentId: null,
    x, y, width: 180, height: 120, fill: '#d9f171', opacity: 1, rotation: 0,
    hidden: false, locked: false, radius: 0,
  };
  switch (kind) {
    case 'artboard': return { ...common, kind, rotation: 0, width: 640, height: 480, fill: '#ffffff' };
    case 'text': return { ...common, kind, width: 280, height: 70, fill: '#ffffff', text: 'Your text', fontSize: 40, fontFamily: 'Arial', fontWeight: '500', align: 'left' };
    case 'rectangle': return { ...common, kind };
    case 'ellipse': return { ...common, kind, width: 140, height: 140 };
  }
}

export function getBounds(nodes: DesignNode[]): Bounds | null {
  if (!nodes.length) return null;
  const left = Math.min(...nodes.map((node) => node.x));
  const top = Math.min(...nodes.map((node) => node.y));
  return {
    x: left, y: top,
    width: Math.max(...nodes.map((node) => node.x + node.width)) - left,
    height: Math.max(...nodes.map((node) => node.y + node.height)) - top,
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
