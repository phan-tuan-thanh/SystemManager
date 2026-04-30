import { useState } from 'react';
import { Select, Switch, Button, Segmented, Typography, Space, Modal, Input, Checkbox, Badge, Divider, Tag } from 'antd';
import { PartitionOutlined, LinkOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface FilterState {
  environment?: string;
  nodeType: 'all' | 'server' | 'app';
  showMiniMap: boolean;
  layout: 'force' | 'hierarchical';
  layoutAlgorithm: 'dagre' | 'elk';
  layoutDirection: 'TB' | 'LR';
  connectionMode: boolean;
  edgeStyle: 'bezier' | 'step';
  visibleGroupNames: string[];
  visibleServerIds: string[];
  visibleAppIds: string[];
}

interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  viewMode: '2D' | '3D';
  onViewModeChange: (v: '2D' | '3D') => void;
  renderEngine: 'reactflow' | 'visnetwork' | 'mermaid';
  onRenderEngineChange: (v: 'reactflow' | 'visnetwork' | 'mermaid') => void;
  onAutoArrange?: () => void;
  groupOptions?: SelectOption[];
  serverOptions?: SelectOption[];
  appOptions?: SelectOption[];
}

// ─── Filter section inside modal ──────────────────────────────────

interface SectionProps {
  title: string;
  options: SelectOption[];
  selected: string[];
  onSelect: (v: string[]) => void;
  search: string;
  columns?: 1 | 2 | 3;
}

function FilterSection({ title, options, selected, onSelect, search, columns = 2 }: SectionProps) {
  const lc = search.toLowerCase();
  const filtered = options.filter(
    (o) => o.label.toLowerCase().includes(lc) || (o.description ?? '').toLowerCase().includes(lc),
  );

  if (filtered.length === 0) return null;

  const allChecked = filtered.length > 0 && filtered.every((o) => selected.includes(o.value));

  const toggleAll = () => {
    if (allChecked) {
      onSelect(selected.filter((v) => !filtered.some((o) => o.value === v)));
    } else {
      const merged = new Set([...selected, ...filtered.map((o) => o.value)]);
      onSelect([...merged]);
    }
  };

  const toggle = (value: string, checked: boolean) => {
    onSelect(checked ? [...selected, value] : selected.filter((v) => v !== value));
  };

  const selectedInSection = selected.filter((v) => filtered.some((o) => o.value === v)).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space size={6}>
          <Text strong style={{ fontSize: 13 }}>{title}</Text>
          {selectedInSection > 0
            ? <Tag color="blue" style={{ fontSize: 11, lineHeight: '18px', padding: '0 6px' }}>{selectedInSection}/{filtered.length}</Tag>
            : <Text style={{ fontSize: 11, color: '#bfbfbf' }}>tất cả</Text>}
        </Space>
        <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }} onClick={toggleAll}>
          {allChecked ? 'Bỏ chọn' : 'Chọn tất cả'}
        </Button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '4px 8px',
          maxHeight: 200,
          overflowY: 'auto',
          paddingRight: 2,
        }}
      >
        {filtered.map((o) => (
          <div
            key={o.value}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              padding: '4px 6px',
              borderRadius: 4,
              cursor: 'pointer',
              background: selected.includes(o.value) ? '#f0f5ff' : 'transparent',
              border: `1px solid ${selected.includes(o.value) ? '#adc6ff' : 'transparent'}`,
              transition: 'background 0.15s',
            }}
            onClick={() => toggle(o.value, !selected.includes(o.value))}
          >
            <Checkbox
              checked={selected.includes(o.value)}
              onChange={(e) => toggle(o.value, e.target.checked)}
              style={{ marginTop: o.description ? 2 : 0 }}
              onClick={(e) => e.stopPropagation()}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: '18px',
                  fontWeight: selected.includes(o.value) ? 500 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {o.label}
              </div>
              {o.description && (
                <div style={{ fontSize: 11, color: '#8c8c8c', lineHeight: '15px', fontFamily: 'monospace' }}>
                  {o.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────

export default function TopologyFilterPanel({
  filters, onChange,
  viewMode, onViewModeChange,
  renderEngine, onRenderEngineChange,
  onAutoArrange,
  groupOptions = [],
  serverOptions = [],
  appOptions = [],
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [localGroupNames, setLocalGroupNames] = useState<string[]>([]);
  const [localServerIds, setLocalServerIds] = useState<string[]>([]);
  const [localAppIds, setLocalAppIds] = useState<string[]>([]);

  const is2D = viewMode === '2D';
  const isInteractive = is2D && (renderEngine === 'reactflow' || renderEngine === 'visnetwork');
  const isReactFlow = is2D && renderEngine === 'reactflow';

  const activeFilterCount =
    filters.visibleGroupNames.length + filters.visibleServerIds.length + filters.visibleAppIds.length;

  const hasOptions = groupOptions.length > 0 || serverOptions.length > 0 || appOptions.length > 0;

  const openModal = () => {
    setLocalGroupNames(filters.visibleGroupNames);
    setLocalServerIds(filters.visibleServerIds);
    setLocalAppIds(filters.visibleAppIds);
    setSearch('');
    setModalOpen(true);
  };

  const applyFilters = () => {
    onChange({
      ...filters,
      visibleGroupNames: localGroupNames,
      visibleServerIds: localServerIds,
      visibleAppIds: localAppIds,
    });
    setModalOpen(false);
  };

  const clearAll = () => {
    setLocalGroupNames([]);
    setLocalServerIds([]);
    setLocalAppIds([]);
  };

  const pendingCount = localGroupNames.length + localServerIds.length + localAppIds.length;

  const sep = (
    <div style={{ width: 1, height: 20, background: '#e8e8e8', flexShrink: 0, alignSelf: 'center' }} />
  );

  return (
    <>
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

        {/* ── Layout (vis-network only: physics vs hierarchical) ── */}
        {isInteractive && !isReactFlow && (
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

        {/* ── Layout Algorithm (ReactFlow only) ── */}
        {isReactFlow && (
          <Segmented
            size="small"
            value={filters.layoutAlgorithm}
            onChange={(v) => onChange({ ...filters, layoutAlgorithm: v as 'dagre' | 'elk' })}
            options={[
              { label: 'Dagre', value: 'dagre' },
              { label: 'ELK', value: 'elk' },
            ]}
          />
        )}

        {/* ── Layout Direction (ReactFlow only) ── */}
        {isReactFlow && (
          <Segmented
            size="small"
            value={filters.layoutDirection}
            onChange={(v) => onChange({ ...filters, layoutDirection: v as 'TB' | 'LR' })}
            options={[
              { label: '↓ TB', value: 'TB' },
              { label: '→ LR', value: 'LR' },
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

        {/* ── Data filters ── */}
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

          {/* ── Node visibility filter button ── */}
          {hasOptions && (
            <Badge count={activeFilterCount} size="small" offset={[-3, 3]}>
              <Button
                size="small"
                icon={<FilterOutlined />}
                type={activeFilterCount > 0 ? 'primary' : 'default'}
                onClick={openModal}
              >
                Lọc node
              </Button>
            </Badge>
          )}

          {/* Quick-clear badge */}
          {activeFilterCount > 0 && (
            <Button
              size="small"
              type="link"
              danger
              style={{ padding: 0, fontSize: 12 }}
              onClick={() => onChange({ ...filters, visibleGroupNames: [], visibleServerIds: [], visibleAppIds: [] })}
            >
              Xoá bộ lọc
            </Button>
          )}
        </Space>
      </div>

      {/* ── Node visibility modal ── */}
      <Modal
        title={
          <Space>
            <FilterOutlined />
            <span>Bộ lọc node</span>
            {pendingCount > 0 && <Tag color="blue">{pendingCount} đã chọn</Tag>}
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={640}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              size="small"
              danger
              disabled={pendingCount === 0}
              onClick={clearAll}
            >
              Xoá tất cả
            </Button>
            <Space>
              <Button size="small" onClick={() => setModalOpen(false)}>Huỷ</Button>
              <Button size="small" type="primary" onClick={applyFilters}>
                Áp dụng
                {pendingCount !== activeFilterCount && (
                  <span style={{ marginLeft: 4, opacity: 0.8 }}>
                    ({pendingCount > 0 ? `${pendingCount} node` : 'tất cả'})
                  </span>
                )}
              </Button>
            </Space>
          </div>
        }
        styles={{ body: { padding: '12px 24px 4px' } }}
      >
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="Tìm hệ thống, server, ứng dụng..."
          size="small"
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {groupOptions.length > 0 && (
            <>
              <FilterSection
                title="Hệ thống"
                options={groupOptions}
                selected={localGroupNames}
                onSelect={setLocalGroupNames}
                search={search}
                columns={3}
              />
              <Divider style={{ margin: '12px 0' }} />
            </>
          )}

          {serverOptions.length > 0 && (
            <>
              <FilterSection
                title="Servers"
                options={serverOptions}
                selected={localServerIds}
                onSelect={setLocalServerIds}
                search={search}
                columns={2}
              />
              <Divider style={{ margin: '12px 0' }} />
            </>
          )}

          {appOptions.length > 0 && (
            <FilterSection
              title="Ứng dụng"
              options={appOptions}
              selected={localAppIds}
              onSelect={setLocalAppIds}
              search={search}
              columns={3}
            />
          )}
        </div>
      </Modal>
    </>
  );
}
