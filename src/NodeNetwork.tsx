import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const CYAN = "#00d4ff";

interface Node {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  driftX: number;
  driftY: number;
  driftSpeed: number;
}

interface Connection {
  from: number;
  to: number;
  length: number;
}

// Deterministic node positions spread across the canvas
const NODES: Node[] = [
  { id: 0, x: 120, y: 80, size: 5, delay: 0, driftX: 12, driftY: 8, driftSpeed: 0.8 },
  { id: 1, x: 350, y: 180, size: 4, delay: 3, driftX: -8, driftY: 10, driftSpeed: 1.0 },
  { id: 2, x: 180, y: 350, size: 6, delay: 5, driftX: 10, driftY: -6, driftSpeed: 0.7 },
  { id: 3, x: 520, y: 120, size: 4, delay: 8, driftX: -6, driftY: 12, driftSpeed: 0.9 },
  { id: 4, x: 680, y: 280, size: 5, delay: 2, driftX: 8, driftY: -10, driftSpeed: 1.1 },
  { id: 5, x: 450, y: 420, size: 4, delay: 10, driftX: -10, driftY: -8, driftSpeed: 0.6 },
  { id: 6, x: 900, y: 150, size: 6, delay: 4, driftX: 6, driftY: 14, driftSpeed: 0.8 },
  { id: 7, x: 1050, y: 300, size: 4, delay: 7, driftX: -12, driftY: 6, driftSpeed: 1.0 },
  { id: 8, x: 820, y: 480, size: 5, delay: 1, driftX: 10, driftY: -12, driftSpeed: 0.9 },
  { id: 9, x: 1250, y: 100, size: 4, delay: 6, driftX: -8, driftY: 10, driftSpeed: 0.7 },
  { id: 10, x: 1400, y: 250, size: 6, delay: 9, driftX: 14, driftY: -8, driftSpeed: 1.2 },
  { id: 11, x: 1150, y: 480, size: 4, delay: 3, driftX: -6, driftY: -14, driftSpeed: 0.8 },
  { id: 12, x: 1600, y: 180, size: 5, delay: 11, driftX: -10, driftY: 12, driftSpeed: 0.6 },
  { id: 13, x: 1750, y: 350, size: 4, delay: 2, driftX: 8, driftY: -6, driftSpeed: 1.0 },
  { id: 14, x: 1500, y: 500, size: 6, delay: 5, driftX: -12, driftY: -10, driftSpeed: 0.9 },
  { id: 15, x: 300, y: 750, size: 4, delay: 7, driftX: 10, driftY: 8, driftSpeed: 0.7 },
  { id: 16, x: 600, y: 850, size: 5, delay: 4, driftX: -8, driftY: -12, driftSpeed: 1.1 },
  { id: 17, x: 950, y: 780, size: 4, delay: 8, driftX: 12, driftY: 6, driftSpeed: 0.8 },
  { id: 18, x: 1300, y: 850, size: 6, delay: 1, driftX: -14, driftY: 10, driftSpeed: 0.6 },
  { id: 19, x: 1650, y: 750, size: 4, delay: 6, driftX: 6, driftY: -8, driftSpeed: 1.0 },
  { id: 20, x: 100, y: 600, size: 5, delay: 10, driftX: -10, driftY: -6, driftSpeed: 0.9 },
  { id: 21, x: 1800, y: 600, size: 4, delay: 3, driftX: 8, driftY: 12, driftSpeed: 0.7 },
];

// Precompute connections between nearby nodes
const CONNECTION_THRESHOLD = 400;
const CONNECTIONS: Connection[] = [];

for (let i = 0; i < NODES.length; i++) {
  for (let j = i + 1; j < NODES.length; j++) {
    const dx = NODES[i].x - NODES[j].x;
    const dy = NODES[i].y - NODES[j].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < CONNECTION_THRESHOLD) {
      CONNECTIONS.push({ from: i, to: j, length: dist });
    }
  }
}

const getNodePosition = (
  node: Node,
  frame: number,
  fps: number,
): { x: number; y: number } => {
  const time = frame / fps;
  return {
    x: node.x + Math.sin(time * node.driftSpeed) * node.driftX,
    y: node.y + Math.cos(time * node.driftSpeed * 0.7) * node.driftY,
  };
};

export const NodeNetwork: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const positions = NODES.map((node) => getNodePosition(node, frame, fps));

  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <defs>
        <filter id="nodeGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Connection lines */}
      {CONNECTIONS.map((conn) => {
        const fromNode = NODES[conn.from];
        const toNode = NODES[conn.to];
        const maxDelay = Math.max(fromNode.delay, toNode.delay);

        const lineProgress = spring({
          frame,
          fps,
          config: { damping: 200 },
          delay: Math.round((maxDelay + 5) * (fps / 10)),
        });

        const fromPos = positions[conn.from];
        const toPos = positions[conn.to];

        const lineOpacity = interpolate(lineProgress, [0, 1], [0, 0.15]);
        const dashOffset = interpolate(lineProgress, [0, 1], [conn.length, 0]);

        return (
          <line
            key={`${conn.from}-${conn.to}`}
            x1={fromPos.x}
            y1={fromPos.y}
            x2={toPos.x}
            y2={toPos.y}
            stroke={CYAN}
            strokeWidth={1}
            opacity={lineOpacity}
            strokeDasharray={conn.length}
            strokeDashoffset={dashOffset}
          />
        );
      })}

      {/* Nodes */}
      {NODES.map((node) => {
        const nodeEntrance = spring({
          frame,
          fps,
          config: { damping: 12 },
          delay: Math.round(node.delay * (fps / 10)),
        });

        const pos = positions[node.id];
        const scale = interpolate(nodeEntrance, [0, 1], [0, 1]);
        const opacity = interpolate(nodeEntrance, [0, 1], [0, 0.8]);

        return (
          <circle
            key={node.id}
            cx={pos.x}
            cy={pos.y}
            r={node.size * scale}
            fill={CYAN}
            opacity={opacity}
            filter="url(#nodeGlow)"
          />
        );
      })}
    </svg>
  );
};
