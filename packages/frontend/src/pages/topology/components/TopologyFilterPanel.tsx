import { Select, Switch, Button, Segmented, Typography, Space } from 'antd';
import { PartitionOutlined, LinkOutlined } from '@ant-design/icons';

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
  viewMode: '2D' | '3D';
  onViewModeChange: (v: '2D' | '3D') => void;
  renderEngine: 'reactflow' | 'visnetwork' | 'mermaid';
  onRenderEngineChange: (v: 'reactflow' | 'visnetwork' | 'mermaid') => void;
  onAutoArrange?: () => void;
}

export default function TopologyFilterPanel({
  filters, onChange,
  viewMode, onViewModeChange,
  renderEngine, onRenderEngineChange,
  onAutoArrange,
}: Props) {
  const is2D = viewMode === '2D';
  const isInteractive = is2D && (renderEngine === 'reactflow' || renderEngine === 'visnetwork');
  const isReactFlow = is2D && renderEngine === 'reactflow';

  const sep = (
    <div style={{ width: 1, height: 20, background: '#e8e8e8', flexShrink: 0, alignSelf: 'center' }} />
  );

  return (
    <div
      style={{
        background: '#fafafa',
        borderBottom: '1px solid #f0f0f0',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px 12px',
        flexShrink: 0,
      }}
    >
      {/* ── View mode ── */}
      <Segmented
        size="small"
        value={viewMode}
        onChange={(v) => onViewModeChange(v as '2D' | '3D')}
        options={[
          { label: '2D', value: '2D' },
          { label: '3D', value: '3D' },
        ]}
      />

      {/* ── Render engine (2D only) ── */}
      {is2D && (
        <Segmented
          size="small"
          value={renderEngine}
          onChange={(v) => onRenderEngineChange(v as 'reactflow' | 'visnetwork' | 'mermaid')}
          options={[
            { label: 'React Flow', value: 'reactflow' },
            { label: 'vis-network', value: 'visnetwork' },
            { label: 'Mermaid', value: 'mermaid' },
          ]}
        />
      )}

      {/* ── Layout (ReactFlow + vis) ── */}
      {isInteractive && (
        <Segmented
          size="small"
          value={filters.layout}
          onChange={(v) => onChange({ ...filters, layout: v as 'force' | 'hierarchical' })}
          options={[
            { label: 'Auto', value: 'force' },
            { label: 'Phân cấp', value: 'hierarchical' },
          ]}
        />
      )}

      {/* ── Edge style (ReactFlow only) ── */}
      {isReactFlow && (
        <Segmented
          size="small"
          value={filters.edgeStyle}
          onChange={(v) => onChange({ ...filters, edgeStyle: v as 'bezier' | 'step' })}
          options={[
            { label: 'Cong', value: 'bezier' },
            { label: 'Góc vuông', value: 'step' },
          ]}
        />
      )}

      {/* ── Connect Mode (ReactFlow only) ── */}
      {isReactFlow && (
        <Button
          size="small"
          type={filters.connectionMode ? 'primary' : 'default'}
          icon={<LinkOutlined />}
          onClick={() => onChange({ ...filters, connectionMode: !filters.connectionMode })}
          title={filters.connectionMode ? 'Đang bật: click source → target để tạo kết nối' : 'Bật chế độ tạo kết nối'}
        >
          Kết nối
        </Button>
      )}

      {/* ── Auto Arrange (ReactFlow + vis) ── */}
      {isInteractive && onAutoArrange && (
        <Button
          size="small"
          icon={<PartitionOutlined />}
          onClick={onAutoArrange}
          title="Sắp xếp tự động"
        >
          Sắp xếp
        </Button>
      )}

      {sep}

      {/* ── Data filters (all modes) ── */}
      <Space size={12} wrap>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Môi trường</Text>
          <Select
            allowClear
            size="small"
            placeholder="Tất cả"
            style={{ width: 90 }}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Hiển thị</Text>
          <Select
            size="small"
            style={{ width: 130 }}
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

        {/* Mini-map (ReactFlow + vis only) */}
        {isInteractive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Mini-map</Text>
            <Switch
              size="small"
              checked={filters.showMiniMap}
              onChange={(v) => onChange({ ...filters, showMiniMap: v })}
            />
          </div>
        )}
      </Space>
    </div>
  );
}
