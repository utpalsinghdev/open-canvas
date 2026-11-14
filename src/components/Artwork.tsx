import type { DesignNode } from '../editor/model';
import { fontStatus, textLayout } from '../editor/typography';

export function Artwork({ node }: { node: DesignNode }) {
  const geometry = { x: node.x, y: node.y, width: node.width, height: node.height };
  switch (node.kind) {
    case 'artboard':
    case 'rectangle': return <rect {...geometry} rx={node.radius} fill={node.fill} />;
    case 'ellipse': return <ellipse cx={node.x + node.width / 2} cy={node.y + node.height / 2} rx={node.width / 2} ry={node.height / 2} fill={node.fill} />;
    case 'image': return <image {...geometry} href={node.src} preserveAspectRatio="xMidYMid slice" />;
    case 'text': {
      const layout = textLayout(node);
      const x = node.x + (node.align === 'center' ? layout.width / 2 : node.align === 'right' ? layout.width : 0);
      const fontFamily = fontStatus(node.fontFamily).resolved;
      return <text data-text-overflow={layout.overflow || undefined} fill={node.fill} fontFamily={fontFamily} fontSize={node.fontSize} fontWeight={node.fontWeight} letterSpacing={node.letterSpacing} xmlSpace="preserve" style={{ fontKerning: 'normal' }} textRendering="geometricPrecision" textAnchor={node.align === 'center' ? 'middle' : node.align === 'right' ? 'end' : 'start'}>
        {layout.lines.map((line, index) => <tspan key={index} x={x} y={node.y + node.fontSize + index * node.fontSize * node.lineHeight}>{line}</tspan>)}
      </text>;
    }
  }
}

export function NodeView({ node }: { node: DesignNode }) {
  const bounds = node.kind === 'text' ? textLayout(node) : node;
  return <g data-node-id={node.id} opacity={node.opacity} transform={`rotate(${node.rotation} ${node.x + bounds.width / 2} ${node.y + bounds.height / 2})`}>
    <Artwork node={node} />
    {node.kind === 'text' && <rect x={node.x} y={node.y} width={bounds.width} height={bounds.height} fill="transparent" />}
  </g>;
}
