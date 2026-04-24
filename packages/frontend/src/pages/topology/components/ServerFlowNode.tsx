import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Tag, Tooltip } from 'antd';
import {
  CloudServerOutlined,
  DatabaseOutlined,
  GatewayOutlined,
  ClusterOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  HddOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const statusColors: Record<string, string> = {
  ACTIVE: '#52c41a',
  INACTIVE: '#ff4d4f',
  MAINTENANCE: '#faad14',
};

const purposeConfig: Record<string, { color: string; icon: typeof CloudServerOutlined }> = {
  APP_SERVER: { color: '#1677ff', icon: CloudServerOutlined },
  DB_SERVER: { color: '#722ed1', icon: DatabaseOutlined },
  PROXY: { color: '#13c2c2', icon: GatewayOutlined },
  LOAD_BALANCER: { color: '#fa8c16', icon: ClusterOutlined },
  CACHE: { color: '#eb2f96', icon: ThunderboltOutlined },
  MESSAGE_QUEUE: { color: '#52c41a', icon: MessageOutlined },
  OTHER: { color: '#8c8c8c', icon: HddOutlined },
};

interface ServerNodeData {
  label: string;
  code: string;
  hostname: string;
  purpose: string;
  status: string;
  environment: string;
  site: string;
  infra_type: string;
  deploymentCount: number;
  privateIp?: string;
  selected?: boolean;
  isContainer?: boolean;
}

function ServerFlowNode({ data, selected }: NodeProps<ServerNodeData>) {
  const statusColor = statusColors[data.status] ?? '#8c8c8c';
  const { color: purposeColor, icon: PurposeIcon } = purposeConfig[data.purpose] ?? purposeConfig.OTHER;

  const handles = (
    <>
      <Handle type="target" position={Position.Left} style={{ background: purposeColor, width: 9, height: 9, border: '2px solid #fff', boxShadow: `0 0 3px ${purposeColor}60` }} />
      <Handle type="source" position={Position.Right} style={{ background: purposeColor, width: 9, height: 9, border: '2px solid #fff', boxShadow: `0 0 3px ${purposeColor}60` }} />
      <Handle type="target" id="top-t" position={Position.Top} style={{ background: purposeColor, width: 9, height: 9, border: '2px solid #fff' }} />
      <Handle type="source" id="bot-s" position={Position.Bottom} style={{ background: purposeColor, width: 9, height: 9, border: '2px solid #fff' }} />
    </>
  );

  // ── Container mode: server acts as a group with apps inside ──────
  if (data.isContainer) {
    return (
      <div
        style={{
          background: 'rgba(250,250,250,0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)' as any,
          borderRadius: 4,
          width: '100%',
          height: '100%',
          boxShadow: selected
            ? `0 0 0 3px #1677ff, 0 6px 20px rgba(0,0,0,0.18)`
            : `0 4px 12px rgba(0,0,0,0.08)`,
          border: selected ? '2.5px solid #1677ff' : `2px solid ${purposeColor}40`,
          transition: 'all 0.2s ease-out',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <Tooltip
          title={
            <div style={{ lineHeight: '18px' }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{data.hostname}</div>
              {data.privateIp && (
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#aaa' }}>{data.privateIp}</div>
              )}
              <div style={{ marginTop: 4, color: '#bbb', fontSize: 11 }}>
                {data.purpose.replace(/_/g, ' ')} · {data.infra_type} · {data.site}
              </div>
            </div>
          }
          placement="top"
        >
          <div
            style={{
              height: 44,
              background: `linear-gradient(to right, ${purposeColor}ee, ${purposeColor}aa)`,
              borderBottom: `1px solid rgba(0,0,0,0.1)`,
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'default',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <PurposeIcon style={{ color: '#fff', fontSize: 14 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 11, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '14px', letterSpacing: '0.2px' }}>
                {data.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', lineHeight: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                {data.code} · {data.site}
              </div>
            </div>
            <Tooltip title={data.status}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '2px',
                  background: statusColor,
                  flexShrink: 0,
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: `0 0 8px ${statusColor}`,
                }}
              />
            </Tooltip>
          </div>
        </Tooltip>
      </div>
    );
  }

  // ── Normal mode: standalone server node ─────────────────────────
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f5f7f9, #ffffff)',
        borderRadius: 4,
        minWidth: 180,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        boxShadow: selected
          ? '0 0 0 3px rgba(22,119,255,0.3), 0 8px 24px rgba(0,0,0,0.18)'
          : '0 4px 12px rgba(0,0,0,0.12)',
        border: selected ? '2px solid #1677ff' : '1px solid #c0c4cc',
        transition: 'all 0.2s ease-in-out',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          background: `linear-gradient(to right, ${purposeColor}, ${purposeColor}cc)`,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 10px',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <PurposeIcon style={{ color: '#fff', fontSize: 16 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 11, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.2px' }}>
            {data.label.toUpperCase()}
          </div>
        </div>
        <Tooltip title={data.status}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: statusColor, border: '2px solid #fff', flexShrink: 0, boxShadow: `0 0 6px ${statusColor}` }} />
        </Tooltip>
      </div>

      <div style={{ padding: '8px 12px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>{data.code}</span>
          <span style={{ color: '#ddd' }}>|</span>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#555' }}>{data.hostname}</span>
        </div>

        {data.privateIp && (
          <div style={{ marginBottom: 8 }}>
            <Tag color="blue" style={{ fontSize: 10, margin: 0, background: '#e6f4ff', border: 'none', color: '#0958d9', fontWeight: 600, fontFamily: 'monospace' }}>
              {data.privateIp}
            </Tag>
          </div>
        )}

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
          <Tag color={purposeColor} style={{ fontSize: 9, lineHeight: '16px', padding: '0 4px', marginRight: 0, fontWeight: 700, borderRadius: 2 }}>
            {data.purpose.replace(/_/g, ' ')}
          </Tag>
          <Tag style={{ fontSize: 9, lineHeight: '16px', padding: '0 4px', marginRight: 0, background: '#f0f2f5', border: '1px solid #dcdfe6', color: '#606266', borderRadius: 2 }}>
            {data.site}
          </Tag>
        </div>

        {data.deploymentCount > 0 && (
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 4, paddingTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <SettingOutlined style={{ fontSize: 10, color: '#1677ff' }} />
            <span style={{ fontSize: 10, color: '#444', fontWeight: 600 }}>
              {data.deploymentCount} deployment{data.deploymentCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      {handles}
    </div>
  );
}

export default memo(ServerFlowNode);
