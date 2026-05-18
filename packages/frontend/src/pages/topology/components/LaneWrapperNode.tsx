import { memo } from 'react';
import type { NodeProps } from 'reactflow';

export interface LaneWrapperData {
  /** 'wrapper' = persistent panel behind a lane's zones; 'hint' = drag drop preview */
  kind: 'wrapper' | 'hint';
  lane: number;
  /** Hint only: true when the zone would start a brand-new lane */
  isNewLane?: boolean;
}

function LaneWrapperNode({ data }: NodeProps<LaneWrapperData>) {
  if (data.kind === 'hint') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          borderRadius: 14,
          border: `2px dashed ${data.isNewLane ? '#52c41a' : '#1677ff'}`,
          background: data.isNewLane ? 'rgba(82,196,26,0.08)' : 'rgba(22,119,255,0.08)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
        }}
      >
        <span
          style={{
            margin: 8,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            borderRadius: 6,
            background: data.isNewLane ? '#52c41a' : '#1677ff',
            userSelect: 'none',
          }}
        >
          {data.isNewLane ? `Lane mới ${data.lane + 1}` : `Thả vào lane ${data.lane + 1}`}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        borderRadius: 14,
        border: '1px dashed rgba(0,0,0,0.12)',
        background: 'rgba(0,0,0,0.025)',
        pointerEvents: 'none',
      }}
    />
  );
}

export default memo(LaneWrapperNode);
