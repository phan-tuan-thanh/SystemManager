import { useState, useCallback, useEffect, useRef } from 'react';
import { EdgeLabelRenderer, getBezierPath, getSmoothStepPath, type EdgeProps } from 'reactflow';

export const protocolColors: Record<string, string> = {
  HTTP: '#1677ff',
  HTTPS: '#52c41a',
  TCP: '#fa8c16',
  GRPC: '#722ed1',
  AMQP: '#eb2f96',
  KAFKA: '#13c2c2',
  DATABASE: '#ff4d4f',
};

export function ProtocolEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, style, selected,
}: EdgeProps) {
  const pIdx = data?.parallelIndex ?? 0;
  const pCount = data?.parallelCount ?? 1;
  const protocolColor = protocolColors[data?.protocol] ?? '#8c8c8c';
  const edgeStyle: 'bezier' | 'step' = data?.edgeStyle ?? 'bezier';

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;

  let edgePath: string;
  let labelX: number;
  let labelY: number;
  let spread: number;

  if (edgeStyle === 'step') {
    const offsetStep = pCount <= 1 ? 0 : (pIdx - (pCount - 1) / 2) * 24;
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      borderRadius: 8,
      offset: offsetStep !== 0 ? offsetStep : undefined,
    });
    spread = 0;
  } else {
    const curvature = pCount <= 1
      ? 0.25
      : 0.08 + (pIdx / Math.max(1, pCount - 1)) * 0.72;
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      curvature,
    });
    spread = pCount <= 1 ? 0 : (pIdx - (pCount - 1) / 2) * 22;
  }

  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const manualOffsetX = data?.labelOffsetX ?? 0;
  const manualOffsetY = data?.labelOffsetY ?? 0;

  const handleLabelMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const ddx = e.clientX - dragStart.current.x;
      const ddy = e.clientY - dragStart.current.y;
      dragStart.current = { x: e.clientX, y: e.clientY };
      data?.onLabelMove?.(ddx, ddy);
    };
    const onUp = () => setIsDragging(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, data]);

  const finalLabelX = labelX + perpX * spread + manualOffsetX;
  const finalLabelY = labelY + perpY * spread + manualOffsetY;

  const pathStyle: React.CSSProperties = selected
    ? { ...style, stroke: protocolColor, strokeWidth: 4, filter: `drop-shadow(0 0 6px ${protocolColor})` }
    : (style as React.CSSProperties);

  const portLabel = data?.targetPort ? `:${data.targetPort.port_number}` : '';

  const flowDur = selected ? 1.0 : 1.6;
  const dotR = selected ? 3.5 : 2.5;
  const PARTICLE_COUNT = 3;

  return (
    <>
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={18} style={{ cursor: 'pointer' }} />
      {selected && (
        <path d={edgePath} fill="none" stroke={protocolColor} strokeWidth={8}
          strokeOpacity={0.18} style={{ filter: 'blur(4px)' }} pointerEvents="none" />
      )}
      <path id={id} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} style={pathStyle} />
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const beginOffset = `-${((i / PARTICLE_COUNT) * flowDur).toFixed(2)}s`;
        return (
          <circle key={i} r={dotR} fill={protocolColor} opacity={0} pointerEvents="none">
            <animateMotion dur={`${flowDur}s`} begin={beginOffset} repeatCount="indefinite" path={edgePath} />
            <animate attributeName="opacity" values="0;0.9;0.9;0"
              keyTimes="0;0.08;0.88;1" dur={`${flowDur}s`} begin={beginOffset} repeatCount="indefinite" />
            {selected && (
              <animate attributeName="r" values={`${dotR};${dotR + 1.5};${dotR}`}
                dur={`${flowDur * 0.5}s`} begin={beginOffset} repeatCount="indefinite" />
            )}
          </circle>
        );
      })}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${finalLabelX}px,${finalLabelY}px)`,
            background: protocolColor,
            color: '#fff',
            padding: selected ? '2px 7px' : '1px 5px',
            borderRadius: 3,
            fontSize: selected ? 10 : 9,
            fontWeight: 700,
            pointerEvents: 'all',
            whiteSpace: 'nowrap',
            lineHeight: '14px',
            boxShadow: selected
              ? `0 0 0 2px #fff, 0 0 0 4px ${protocolColor}, 0 2px 8px rgba(0,0,0,0.35)`
              : '0 1px 4px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
            letterSpacing: '0.3px',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            transition: 'all 0.15s ease',
          }}
          className="nodrag nopan"
          onMouseDown={handleLabelMouseDown}
          title="Kéo để di chuyển nhãn"
        >
          {data?.protocol}{portLabel}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
