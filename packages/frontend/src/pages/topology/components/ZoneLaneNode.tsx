import { memo } from 'react';
import type { NodeProps } from 'reactflow';

export interface ZoneLaneData {
  label: string;
  color: string;
  borderColor: string;
  headerBg: string;
  serverCount: number;
}

function ZoneLaneNode({ data }: NodeProps<ZoneLaneData>) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: data.color,
        border: `2px solid ${data.borderColor}`,
        borderRadius: 10,
        overflow: 'hidden',
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: data.headerBg,
          padding: '5px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          userSelect: 'none',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {data.label}
        </span>
        <span
          style={{
            background: 'rgba(255,255,255,0.25)',
            color: '#fff',
            borderRadius: 10,
            padding: '0 6px',
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {data.serverCount}
        </span>
      </div>
    </div>
  );
}

export default memo(ZoneLaneNode);
