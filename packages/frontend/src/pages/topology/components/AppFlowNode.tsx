import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Tag, Tooltip } from 'antd';
import { AppstoreOutlined, SettingOutlined } from '@ant-design/icons';

const statusColors: Record<string, string> = {
  RUNNING: '#52c41a',
  STOPPED: '#ff4d4f',
  DEPRECATED: '#8c8c8c',
};

const statusBg: Record<string, string> = {
  RUNNING: 'linear-gradient(135deg, #f6ffed, #fcffe6)',
  STOPPED: 'linear-gradient(135deg, #fff2f0, #fff1f0)',
  DEPRECATED: 'linear-gradient(135deg, #fafafa, #f5f5f5)',
};

interface PortItem {
  port_number: number;
  protocol: string;
  service_name?: string;
}

interface AppNodeData {
  label: string;
  code: string;
  groupName?: string;
  deploymentStatus: string;
  environment: string;
  version?: string;
  serverName?: string;
  selected?: boolean;
  application_type?: string;  // 'BUSINESS' | 'SYSTEM'
  ports?: PortItem[];
  compact?: boolean;
}

function AppFlowNode({ data, selected }: NodeProps<AppNodeData>) {
  const [expanded, setExpanded] = useState(false);
  const [portsExpanded, setPortsExpanded] = useState(false);

  const isSystem = data.application_type === 'SYSTEM';
  const statusColor = isSystem ? '#8c8c8c' : (statusColors[data.deploymentStatus] ?? '#8c8c8c');
  const bg = isSystem
    ? 'linear-gradient(135deg, #fafafa, #f0f0f0)'
    : (statusBg[data.deploymentStatus] ?? statusBg.DEPRECATED);
  const Icon = isSystem ? SettingOutlined : AppstoreOutlined;

  // ── Compact stack row (inside server container) ───────────────────
  if (data.compact) {
    const tooltipContent = (
      <div style={{ lineHeight: '18px', fontSize: 11 }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{data.label}</div>
        <div style={{ color: '#aaa' }}>{data.code}{data.version ? ` · v${data.version}` : ''}</div>
        {data.groupName && <div style={{ color: '#aaa' }}>{data.groupName}</div>}
        {data.ports && data.ports.length > 0 && (
          <div style={{ marginTop: 4, color: '#bbb' }}>
            {data.ports.map(p => `${p.protocol}:${p.port_number}`).join('  ')}
          </div>
        )}
      </div>
    );

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: isSystem ? 'rgba(245,245,245,0.9)' : 'rgba(255,255,255,0.92)',
          borderRadius: 4,
          border: selected
            ? '1.5px solid #1677ff'
            : `1.5px solid ${statusColor}35`,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '0 6px',
          boxShadow: selected
            ? '0 0 0 2px rgba(22,119,255,0.18)'
            : '0 1px 3px rgba(0,0,0,0.07)',
          transition: 'all 0.15s',
          cursor: 'pointer',
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: statusColor, width: 6, height: 6, border: '1.5px solid #fff' }}
        />

        {/* Status dot */}
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: statusColor, flexShrink: 0,
          boxShadow: `0 0 4px ${statusColor}80`,
        }} />

        {/* App icon */}
        <Icon style={{ color: statusColor, fontSize: 10, flexShrink: 0 }} />

        {/* Name with tooltip for full details */}
        <Tooltip title={tooltipContent} placement="right" mouseEnterDelay={0.5}>
          <div style={{
            flex: 1, minWidth: 0,
            fontSize: 10, fontWeight: 600, color: '#1a1a1a',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {data.label}
          </div>
        </Tooltip>

        {/* Short status badge */}
        <span style={{
          fontSize: 8, fontWeight: 700,
          color: statusColor,
          background: `${statusColor}15`,
          border: `1px solid ${statusColor}35`,
          borderRadius: 3,
          padding: '0 3px',
          lineHeight: '13px',
          flexShrink: 0,
          letterSpacing: '0.3px',
        }}>
          {data.deploymentStatus.slice(0, 3)}
        </span>

        <Handle
          type="source"
          position={Position.Right}
          style={{ background: statusColor, width: 6, height: 6, border: '1.5px solid #fff' }}
        />
      </div>
    );
  }

  // ── Full card (app-only or standalone view) ───────────────────────
  return (
    <div
      style={{
        background: bg,
        border: `2.5px solid ${selected ? '#1677ff' : statusColor}`,
        borderRadius: 24,
        padding: '10px 18px',
        minWidth: 140,
        maxWidth: 200,
        boxShadow: selected
          ? `0 0 0 4px rgba(22,119,255,0.25), 0 8px 24px rgba(0,0,0,0.2)`
          : `0 4px 12px rgba(0,0,0,0.1)`,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: statusColor,
          width: 7,
          height: 7,
          border: '2px solid #fff',
          boxShadow: `0 0 3px ${statusColor}60`,
        }}
      />

      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: '#fff',
          border: `2px solid ${statusColor}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 6px',
          boxShadow: `0 2px 8px ${statusColor}30`,
        }}
      >
        <Icon style={{ color: statusColor, fontSize: 18 }} />
      </div>

      <Tooltip title={`${data.code} — ${data.label}`}>
        <div style={{
          fontWeight: 700,
          fontSize: 12,
          color: '#1a1a1a',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: '16px',
          marginBottom: 4,
          letterSpacing: '0.1px',
        }}>
          {data.label}
        </div>
      </Tooltip>

      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
        <Tag
          color={data.deploymentStatus === 'RUNNING' ? 'success' : data.deploymentStatus === 'STOPPED' ? 'error' : 'default'}
          style={{ fontSize: 9, lineHeight: '16px', padding: '0 6px', marginRight: 0, borderRadius: 10, fontWeight: 700, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
        >
          {data.deploymentStatus}
        </Tag>
        {isSystem && (
          <Tag
            color="default"
            style={{ fontSize: 9, lineHeight: '16px', padding: '0 6px', marginRight: 0, borderRadius: 10, color: '#8c8c8c', background: '#f0f0f0', border: 'none' }}
          >
            SYSTEM
          </Tag>
        )}
      </div>

      {/* Expand toggle */}
      <div
        onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
        style={{ cursor: 'pointer', fontSize: 10, color: '#aaa', marginTop: 2, userSelect: 'none' }}
      >
        {expanded ? '▲ ẩn' : '▼ chi tiết'}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{ marginTop: 6, borderTop: '1px solid #f0f0f0', paddingTop: 4, textAlign: 'left' }}>
          {data.serverName && (
            <div style={{ fontSize: 9, color: '#888' }}>@ {data.serverName}</div>
          )}
          {data.groupName && (
            <div style={{ fontSize: 9, color: '#888' }}>{data.groupName}</div>
          )}
          {data.version && (
            <div style={{ fontSize: 9, color: '#1677ff' }}>v{data.version}</div>
          )}

          {/* Ports section */}
          {data.ports && data.ports.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div
                onClick={(e) => { e.stopPropagation(); setPortsExpanded((v) => !v); }}
                style={{ cursor: 'pointer', fontSize: 9, color: '#1677ff', userSelect: 'none' }}
              >
                {portsExpanded ? '▲' : '▼'} {data.ports.length} port{data.ports.length > 1 ? 's' : ''}
              </div>
              {portsExpanded && data.ports.map((p) => (
                <div key={p.port_number} style={{ fontSize: 9, color: '#666', marginLeft: 8 }}>
                  {p.protocol}:{p.port_number}{p.service_name ? ` (${p.service_name})` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: statusColor,
          width: 7,
          height: 7,
          border: '2px solid #fff',
          boxShadow: `0 0 3px ${statusColor}60`,
        }}
      />
    </div>
  );
}

export default memo(AppFlowNode);
