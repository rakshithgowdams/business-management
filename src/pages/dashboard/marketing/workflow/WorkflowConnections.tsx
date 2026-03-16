import type { WorkflowNode, WorkflowConnection } from '../../../../lib/marketing/types';

interface Props {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  connecting: string | null;
  onRemoveConnection: (id: string) => void;
}

export default function WorkflowConnections({ nodes, connections, onRemoveConnection }: Props) {
  const getNodeCenter = (nodeId: string): { x: number; y: number } | null => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    return { x: node.x + 100, y: node.y + 40 };
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: '500px' }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#059669" fillOpacity="0.6" />
        </marker>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {connections.map((conn) => {
        const from = getNodeCenter(conn.fromNode);
        const to = getNodeCenter(conn.toNode);
        if (!from || !to) return null;

        const fromNode = nodes.find((n) => n.id === conn.fromNode);
        const toNode = nodes.find((n) => n.id === conn.toNode);
        if (!fromNode || !toNode) return null;

        const startX = fromNode.x + 200;
        const startY = fromNode.y + 40;
        const endX = toNode.x;
        const endY = toNode.y + 40;

        const midX = (startX + endX) / 2;
        const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

        return (
          <g key={conn.id}>
            <path
              d={path}
              stroke="url(#lineGrad)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="6 4"
              markerEnd="url(#arrowhead)"
              className="animate-dash"
            />
            <circle cx={startX} cy={startY} r="3" fill="#059669" fillOpacity="0.5" />
            <circle cx={endX} cy={endY} r="3" fill="#10B981" fillOpacity="0.5" />
            <path
              d={path}
              stroke="transparent"
              strokeWidth="12"
              fill="none"
              className="pointer-events-auto cursor-pointer"
              onClick={() => onRemoveConnection(conn.id)}
            />
          </g>
        );
      })}

      <style>{`
        @keyframes dashMove {
          to { stroke-dashoffset: -20; }
        }
        .animate-dash {
          animation: dashMove 1.5s linear infinite;
        }
      `}</style>
    </svg>
  );
}
