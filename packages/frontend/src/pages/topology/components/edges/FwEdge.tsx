import { EdgeLabelRenderer, getBezierPath, getSmoothStepPath, Position, type EdgeProps } from 'reactflow';

export function FwEdge({
  id,
  sourceX: propSourceX, sourceY: propSourceY,
  targetX: propTargetX, targetY: propTargetY,
  sourcePosition, targetPosition,
  data, markerEnd, selected,
}: EdgeProps) {
  const action = data?.action ?? 'ALLOW';
  const isAllow = action === 'ALLOW';
  const actionColor = isAllow ? '#389e0d' : '#cf1322';
  const flowDur = selected ? 0.9 : 1.5;
  const dotR = selected ? 7 : 5;
  const PARTICLE_COUNT = 3;

  // Backward edges connect via bot-s / bot-t handles; React Flow passes their
  // live coordinates so the arc tracks the nodes after drag / re-layout.
  const isBackward = !!(data?._isBackward);
  const sourceX = propSourceX;
  const sourceY = propSourceY;
  const targetX = propTargetX;
  const targetY = propTargetY;

  // Dynamic offset computed at layout time to route the arc below all zone
  // lane containers between source and target (see routeEdgesAfterLayout).
  const backwardOffset = data?._backwardOffset ?? 58;
  const [edgePath, labelX, labelY] = isBackward
    ? getSmoothStepPath({ sourceX, sourceY, sourcePosition: Position.Bottom, targetX, targetY, targetPosition: Position.Bottom, borderRadius: 12, offset: backwardOffset })
    : getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  const pathStyle: React.CSSProperties = {
    stroke: actionColor,
    strokeWidth: selected ? 3.5 : 2.5,
    strokeDasharray: isAllow ? undefined : '7,4',
    opacity: 1,
    filter: selected ? `drop-shadow(0 0 5px ${actionColor})` : undefined,
  };

  const portNum = data?.portNum;
  const labelText = portNum ? `${isAllow ? 'ALLOW' : 'DENY'} :${portNum}` : (isAllow ? 'ALLOW' : 'DENY');

  return (
    <>
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={18} style={{ cursor: 'pointer' }} />
      {selected && (
        <path d={edgePath} fill="none" stroke={actionColor} strokeWidth={8}
          strokeOpacity={0.15} style={{ filter: 'blur(4px)' }} pointerEvents="none" />
      )}
      <path id={id} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} style={pathStyle} />
      {isAllow && Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const begin = `-${((i / PARTICLE_COUNT) * flowDur).toFixed(2)}s`;
        return (
          <circle key={i} r={dotR} fill={actionColor} opacity={0} pointerEvents="none">
            <animateMotion dur={`${flowDur}s`} begin={begin} repeatCount="indefinite" path={edgePath} />
            <animate attributeName="opacity" values="0;0.9;0.9;0"
              keyTimes="0;0.08;0.88;1" dur={`${flowDur}s`} begin={begin} repeatCount="indefinite" />
          </circle>
        );
      })}
      {!isAllow && (
        <path d={edgePath} fill="none" stroke={actionColor} strokeWidth={selected ? 4 : 2.5}
          strokeDasharray="7,4" pointerEvents="none">
          <animate attributeName="opacity" values="0.85;0.2;0.85"
            keyTimes="0;0.5;1" dur="1.8s" repeatCount="indefinite" />
        </path>
      )}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: actionColor,
            color: '#fff',
            padding: '1px 5px',
            borderRadius: 3,
            fontSize: 9,
            fontWeight: 700,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            lineHeight: '14px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            opacity: 0.92,
          }}
        >
          {labelText}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
