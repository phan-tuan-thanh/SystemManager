import { Select, Space, Switch, Typography, Divider, Tooltip } from 'antd';

const { Text } = Typography;

interface FilterState {
  environment?: string;
  nodeType: 'all' | 'server' | 'app';
  showMiniMap: boolean;
  layout: 'force' | 'hierarchical';
  connectionMode: boolean;
  edgeStyle: 'bezier' | 'step';
}

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export default function TopologyFilterPanel({ filters, onChange }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 12,
        padding: '8px 24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Text strong style={{ fontSize: 13, color: '#1a1a1a' }}>FILTERS</Text>
        <Divider type="vertical" style={{ height: 16, borderLeft: '1px solid #d9d9d9' }} />
      </div>

      <Space size={20} align="center">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>Environment</Text>
          <Select
            allowClear
            size="small"
            placeholder="All"
            style={{ width: 100 }}
            value={filters.environment}
            onChange={(v) => onChange({ ...filters, environment: v })}
            getPopupContainer={(trigger) => trigger.parentElement!}
            options={[
              { label: 'DEV', value: 'DEV' },
              { label: 'UAT', value: 'UAT' },
              { label: 'PROD', value: 'PROD' },
            ]}
          />
        </div>

        <Divider type="vertical" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>View</Text>
          <Select
            size="small"
            style={{ width: 140 }}
            value={filters.nodeType}
            onChange={(v) => onChange({ ...filters, nodeType: v })}
            getPopupContainer={(trigger) => trigger.parentElement!}
            options={[
              { label: 'Servers & Apps', value: 'all' },
              { label: 'Servers only', value: 'server' },
              { label: 'Apps only', value: 'app' },
            ]}
          />
        </div>

        <Divider type="vertical" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>Layout</Text>
          <Select
            size="small"
            style={{ width: 120 }}
            value={filters.layout}
            onChange={(v) => onChange({ ...filters, layout: v })}
            getPopupContainer={(trigger) => trigger.parentElement!}
            options={[
              { label: 'Auto layout', value: 'force' },
              { label: 'Hierarchical', value: 'hierarchical' },
            ]}
          />
        </div>

        <Divider type="vertical" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>Mini-map</Text>
          <Switch
            size="small"
            checked={filters.showMiniMap}
            onChange={(v) => onChange({ ...filters, showMiniMap: v })}
          />
        </div>

        <Divider type="vertical" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>Edges</Text>
          <Select
            size="small"
            style={{ width: 120 }}
            value={filters.edgeStyle}
            onChange={(v) => onChange({ ...filters, edgeStyle: v })}
            getPopupContainer={(trigger) => trigger.parentElement!}
            options={[
              { label: 'Cong', value: 'bezier' },
              { label: 'Thẳng góc', value: 'step' },
            ]}
          />
        </div>

        <Divider type="vertical" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tooltip title={filters.connectionMode ? "Click source -> Click target" : "Toggle to create connections"}>
            <Text style={{ fontSize: 12, color: filters.connectionMode ? '#1677ff' : '#666' }}>
              Connect Mode
            </Text>
          </Tooltip>
          <Switch
            size="small"
            checked={filters.connectionMode}
            onChange={(v) => onChange({ ...filters, connectionMode: v })}
          />
        </div>
      </Space>
    </div>
  );
}
