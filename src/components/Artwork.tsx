import type { DesignNode } from '../editor/model';

export function Artwork({ node }: { node: DesignNode }) {
  const geometry = { x: node.x, y: node.y, width: node.width, height: node.height };
  switch (node.kind) {
    case 'artboard':
    case 'rectangle': return <rect {...geometry} rx={node.radius} fill={node.fill} />;
    case 'ellipse': return <ellipse cx={node.x + node.width / 2} cy={node.y + node.height / 2} rx={node.width / 2} ry={node.height / 2} fill={node.fill} />;
    case 'image': return <image {...geometry} href={node.src} preserveAspectRatio="xMidYMid slice" />;
    case 'text': {
      const x = node.x + (node.align === 'center' ? node.width / 2 : node.align === 'right' ? node.width : 0);
      return <text fill={node.fill} fontFamily={node.fontFamily} fontSize={node.fontSize} fontWeight={node.fontWeight} textAnchor={node.align === 'center' ? 'middle' : node.align === 'right' ? 'end' : 'start'}>
        {node.text.split('\n').map((line, index) => <tspan key={index} x={x} y={node.y + node.fontSize + index * node.fontSize * 1.2}>{line}</tspan>)}
      </text>;
    }
  }
}

export function NodeView({ node }: { node: DesignNode }) {
  return <g data-node-id={node.id} opacity={node.opacity} transform={`rotate(${node.rotation} ${node.x + node.width / 2} ${node.y + node.height / 2})`}>
    <Artwork node={node} />
    {node.kind === 'text' && <rect x={node.x} y={node.y} width={node.width} height={node.height} fill="transparent" />}
  </g>;
}
