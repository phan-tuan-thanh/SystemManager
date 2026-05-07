import { useState } from 'react';
import {
  Select, Button, Segmented, Typography, Space, Modal, Input,
  Checkbox, Badge, Divider, Tag, Switch, Popover, Tooltip,
} from 'antd';
import { PartitionOutlined, FilterOutlined, SearchOutlined, SettingOutlined, RedoOutlined } from '@ant-design/icons';

const { Text } = Typography;

// ── Physics config type ─────────────────────────────────────────────
export interface VisPhysicsConfig {
  solver: 'barnesHut' | 'forceAtlas2Based' | 'repulsion';
  gravitationalConstant: number;
  springLength: number;
  springConstant: number;
  damping: number;
  centralGravity: number;
  dragSettleMs: number;  // ms after dragEnd before physics freezes
}

export const DEFAULT_PHYSICS: VisPhysicsConfig = {
  solver: 'barnesHut',
  gravitationalConstant: -2000,
  springLength: 180,
  springConstant: 0.02,
  damping: 0.6,
  centralGravity: 0.1,
  dragSettleMs: 600,
};

// ── Main filter state ───────────────────────────────────────────────
export interface FirewallFilterState {
  environment?: string;
  action?: string;
  status: string;
  renderEngine: 'visnetwork' | 'mermaid';
  layout: 'force' | 'hierarchical';
  layoutDirection: 'TB' | 'LR' | 'RL' | 'BT';
  edgeStyle: 'smooth' | 'straight';
  showMiniMap: boolean;
  physics: VisPhysicsConfig;
  // Node visibility
  visibleSourceZoneIds: string[];
  visibleDestServerIds: string[];
}

interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

// ── Node filter section ─────────────────────────────────────────────
interface FilterSectionProps {
  title: string;
  options: SelectOption[];
  selected: string[];
  onSelect: (v: string[]) => void;
  search: string;
  columns?: 1 | 2 | 3;
}

function FilterSection({ title, options, selected, onSelect, search, columns = 2 }: FilterSectionProps) {
  const lc = search.toLowerCase();
  const filtered = options.filter(
    (o) => o.label.toLowerCase().includes(lc) || (o.description ?? '').toLowerCase().includes(lc),
  );
  if (filtered.length === 0) return null;

  const allChecked = filtered.every((o) => selected.includes(o.value));
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
  const selectedCount = selected.filter((v) => filtered.some((o) => o.value === v)).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space size={6}>
          <Text strong style={{ fontSize: 13 }}>{title}</Text>
          {selectedCount > 0
            ? <Tag color="blue" style={{ fontSize: 11, lineHeight: '18px', padding: '0 6px' }}>{selectedCount}/{filtered.length}</Tag>
            : <Text style={{ fontSize: 11, color: '#bfbfbf' }}>tất cả</Text>}
        </Space>
        <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }} onClick={toggleAll}>
          {allChecked ? 'Bỏ chọn' : 'Chọn tất cả'}
        </Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '4px 8px', maxHeight: 200, overflowY: 'auto' }}>
        {filtered.map((o) => (
          <div
            key={o.value}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 6, padding: '4px 6px', borderRadius: 4, cursor: 'pointer',
              background: selected.includes(o.value) ? '#f0f5ff' : 'transparent',
              border: `1px solid ${selected.includes(o.value) ? '#adc6ff' : 'transparent'}`,
            }}
            onClick={() => toggle(o.value, !selected.includes(o.value))}
          >
            <Checkbox
              checked={selected.includes(o.value)}
              onChange={(e) => toggle(o.value, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, lineHeight: '18px', fontWeight: selected.includes(o.value) ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

// ── Physics Settings Popover ────────────────────────────────────────
interface PhysicsPopoverProps {
  physics: VisPhysicsConfig;
  onChange: (p: VisPhysicsConfig) => void;
}

function PhysicsSettingsContent({ physics, onChange }: PhysicsPopoverProps) {
  const set = <K extends keyof VisPhysicsConfig>(key: K, val: VisPhysicsConfig[K]) =>
    onChange({ ...physics, [key]: val });

  const row = (label: string, hint: string, child: React.ReactNode) => (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: '#8c8c8c' }}>{hint}</div>
      </div>
      {child}
    </div>
  );

  return (
    <div style={{ width: 340 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text strong style={{ fontSize: 13 }}>Physics Settings</Text>
        <Tooltip title="Khôi phục mặc định">
          <Button size="small" icon={<RedoOutlined />} onClick={() => onChange(DEFAULT_PHYSICS)}>
            Reset
          </Button>
        </Tooltip>
      </div>

      {row('Solver', 'Thuật toán tính lực', (
        <Select
          size="small" style={{ width: '100%' }}
          value={physics.solver}
          onChange={(v) => set('solver', v)}
          options={[
            { label: 'barnesHut (khuyến nghị)', value: 'barnesHut' },
            { label: 'forceAtlas2Based', value: 'forceAtlas2Based' },
            { label: 'repulsion (đơn giản)', value: 'repulsion' },
          ]}
        />
      ))}

      {row('Lực hút/đẩy', 'Âm = đẩy xa, dương = hút', (
        <Select
          size="small" style={{ width: '100%' }}
          value={physics.gravitationalConstant}
          onChange={(v) => set('gravitationalConstant', v)}
          options={[
            { label: '-500 — Rất nhẹ', value: -500 },
            { label: '-1000 — Nhẹ', value: -1000 },
            { label: '-3000 — Vừa (mặc định)', value: -3000 },
            { label: '-6000 — Mạnh', value: -6000 },
            { label: '-12000 — Rất mạnh', value: -12000 },
          ]}
        />
      ))}

      {row('Độ dài cạnh', 'Khoảng cách lý tưởng giữa node', (
        <Select
          size="small" style={{ width: '100%' }}
          value={physics.springLength}
          onChange={(v) => set('springLength', v)}
          options={[
            { label: '80px — Compact', value: 80 },
            { label: '130px — Vừa', value: 130 },
            { label: '180px — Thoáng (mặc định)', value: 180 },
            { label: '260px — Rộng', value: 260 },
            { label: '360px — Rất rộng', value: 360 },
          ]}
        />
      ))}

      {row('Độ cứng cạnh', 'Lò xo — cao: node bị kéo gần hơn', (
        <Select
          size="small" style={{ width: '100%' }}
          value={physics.springConstant}
          onChange={(v) => set('springConstant', v)}
          options={[
            { label: '0.005 — Rất mềm', value: 0.005 },
            { label: '0.02 — Mềm (mặc định)', value: 0.02 },
            { label: '0.05 — Vừa', value: 0.05 },
            { label: '0.1 — Cứng', value: 0.1 },
            { label: '0.2 — Rất cứng', value: 0.2 },
          ]}
        />
      ))}

      {row('Giảm chấn', 'Cao = tắt dần nhanh, ít dao động', (
        <Select
          size="small" style={{ width: '100%' }}
          value={physics.damping}
          onChange={(v) => set('damping', v)}
          options={[
            { label: '0.2 — Nảy nhiều', value: 0.2 },
            { label: '0.4 — Bình thường', value: 0.4 },
            { label: '0.6 — Ổn định (mặc định)', value: 0.6 },
            { label: '0.8 — Rất ổn định', value: 0.8 },
            { label: '0.95 — Cứng đơ', value: 0.95 },
          ]}
        />
      ))}

      {row('Trọng tâm', 'Kéo graph về trung tâm canvas', (
        <Select
          size="small" style={{ width: '100%' }}
          value={physics.centralGravity}
          onChange={(v) => set('centralGravity', v)}
          options={[
            { label: '0.0 — Không', value: 0 },
            { label: '0.05 — Nhẹ', value: 0.05 },
            { label: '0.1 — Vừa (mặc định)', value: 0.1 },
            { label: '0.3 — Mạnh', value: 0.3 },
            { label: '0.6 — Rất mạnh', value: 0.6 },
          ]}
        />
      ))}

      {row('Freeze sau drag', 'Thời gian (ms) chờ trước khi đóng băng', (
        <Select
          size="small" style={{ width: '100%' }}
          value={physics.dragSettleMs}
          onChange={(v) => set('dragSettleMs', v)}
          options={[
            { label: '200ms — Nhanh', value: 200 },
            { label: '400ms — Vừa', value: 400 },
            { label: '600ms — Chuẩn (mặc định)', value: 600 },
            { label: '1000ms — Chậm', value: 1000 },
            { label: '2000ms — Rất chậm', value: 2000 },
          ]}
        />
      ))}
    </div>
  );
}

// ── Main Filter Panel ───────────────────────────────────────────────
interface Props {
  filters: FirewallFilterState;
  onChange: (f: FirewallFilterState) => void;
  onAutoArrange?: () => void;
  sourceZoneOptions?: SelectOption[];
  destServerOptions?: SelectOption[];
}

export default function FirewallFilterPanel({
  filters, onChange, onAutoArrange,
  sourceZoneOptions = [], destServerOptions = [],
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [physicsPopoverOpen, setPhysicsPopoverOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [localZones, setLocalZones] = useState<string[]>([]);
  const [localServers, setLocalServers] = useState<string[]>([]);

  const activeFilterCount = filters.visibleSourceZoneIds.length + filters.visibleDestServerIds.length;
  const hasOptions = sourceZoneOptions.length > 0 || destServerOptions.length > 0;
  const isVis = filters.renderEngine === 'visnetwork';

  const openModal = () => {
    setLocalZones(filters.visibleSourceZoneIds);
    setLocalServers(filters.visibleDestServerIds);
    setSearch('');
    setModalOpen(true);
  };
  const applyFilters = () => {
    onChange({ ...filters, visibleSourceZoneIds: localZones, visibleDestServerIds: localServers });
    setModalOpen(false);
  };
  const pendingCount = localZones.length + localServers.length;

  // Check if physics differs from default
  const physicsModified = JSON.stringify(filters.physics) !== JSON.stringify(DEFAULT_PHYSICS);

  const sep = <div style={{ width: 1, height: 20, background: '#e8e8e8', flexShrink: 0, alignSelf: 'center' }} />;

  return (
    <>
      <div style={{
        background: '#fafafa',
        borderBottom: '1px solid #f0f0f0',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px 12px',
        flexShrink: 0,
      }}>
        {/* ── Engine ── */}
        <Segmented
          size="small"
          value={filters.renderEngine}
          onChange={(v) => onChange({ ...filters, renderEngine: v as FirewallFilterState['renderEngine'] })}
          options={[
            { label: 'vis-network', value: 'visnetwork' },
            { label: 'Mermaid', value: 'mermaid' },
          ]}
        />

        {/* ── Layout (vis only) ── */}
        {isVis && (
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

        {/* ── Direction (hierarchical only) ── */}
        {isVis && filters.layout === 'hierarchical' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Hướng</Text>
            <Select
              size="small" style={{ width: 130 }}
              value={filters.layoutDirection}
              onChange={(v) => onChange({ ...filters, layoutDirection: v })}
              options={[
                { label: '→ Trái → Phải', value: 'LR' },
                { label: '↓ Trên → Dưới', value: 'TB' },
                { label: '← Phải → Trái', value: 'RL' },
                { label: '↑ Dưới → Trên', value: 'BT' },
              ]}
            />
          </div>
        )}

        {/* ── Edge style (vis only) ── */}
        {isVis && (
          <Segmented
            size="small"
            value={filters.edgeStyle}
            onChange={(v) => onChange({ ...filters, edgeStyle: v as 'smooth' | 'straight' })}
            options={[
              { label: 'Cong', value: 'smooth' },
              { label: 'Thẳng', value: 'straight' },
            ]}
          />
        )}

        {/* ── Auto-arrange ── */}
        {isVis && onAutoArrange && (
          <Button size="small" icon={<PartitionOutlined />} onClick={onAutoArrange}>
            Sắp xếp
          </Button>
        )}

        {/* ── Physics Settings Popover ── */}
        {isVis && (
          <Popover
            open={physicsPopoverOpen}
            onOpenChange={setPhysicsPopoverOpen}
            trigger="click"
            placement="bottomLeft"
            content={
              <PhysicsSettingsContent
                physics={filters.physics}
                onChange={(p) => onChange({ ...filters, physics: p })}
              />
            }
          >
            <Badge dot={physicsModified} offset={[-3, 3]}>
              <Tooltip title="Tùy chỉnh physics vis-network">
                <Button
                  size="small"
                  icon={<SettingOutlined />}
                  type={physicsModified ? 'primary' : 'default'}
                >
                  Physics
                </Button>
              </Tooltip>
            </Badge>
          </Popover>
        )}

        {sep}

        {/* ── Data filters ── */}
        <Space size={10} wrap>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Môi trường</Text>
            <Select
              allowClear size="small" placeholder="Tất cả" style={{ width: 90 }}
              value={filters.environment}
              onChange={(v) => onChange({ ...filters, environment: v })}
              options={[
                { label: 'DEV', value: 'DEV' },
                { label: 'UAT', value: 'UAT' },
                { label: 'PROD', value: 'PROD' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Hành động</Text>
            <Select
              allowClear size="small" placeholder="Tất cả" style={{ width: 100 }}
              value={filters.action}
              onChange={(v) => onChange({ ...filters, action: v })}
              options={[
                { label: '✓ ALLOW', value: 'ALLOW' },
                { label: '✗ DENY', value: 'DENY' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Trạng thái</Text>
            <Select
              allowClear size="small" placeholder="Tất cả" style={{ width: 155 }}
              value={filters.status || undefined}
              onChange={(v) => onChange({ ...filters, status: v ?? '' })}
              options={[
                { label: 'ACTIVE', value: 'ACTIVE' },
                { label: 'INACTIVE', value: 'INACTIVE' },
                { label: 'PENDING', value: 'PENDING_APPROVAL' },
                { label: 'REJECTED', value: 'REJECTED' },
              ]}
            />
          </div>

          {isVis && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Mini-map</Text>
              <Switch size="small" checked={filters.showMiniMap} onChange={(v) => onChange({ ...filters, showMiniMap: v })} />
            </div>
          )}

          {hasOptions && (
            <Badge count={activeFilterCount} size="small" offset={[-3, 3]}>
              <Button size="small" icon={<FilterOutlined />} type={activeFilterCount > 0 ? 'primary' : 'default'} onClick={openModal}>
                Lọc node
              </Button>
            </Badge>
          )}

          {activeFilterCount > 0 && (
            <Button size="small" type="link" danger style={{ padding: 0, fontSize: 12 }}
              onClick={() => onChange({ ...filters, visibleSourceZoneIds: [], visibleDestServerIds: [] })}
            >
              Xoá bộ lọc
            </Button>
          )}
        </Space>
      </div>

      {/* Node visibility modal */}
      <Modal
        title={<Space><FilterOutlined /><span>Lọc node Firewall Topology</span>{pendingCount > 0 && <Tag color="blue">{pendingCount} đã chọn</Tag>}</Space>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={600}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button size="small" danger disabled={pendingCount === 0} onClick={() => { setLocalZones([]); setLocalServers([]); }}>
              Xoá tất cả
            </Button>
            <Space>
              <Button size="small" onClick={() => setModalOpen(false)}>Huỷ</Button>
              <Button size="small" type="primary" onClick={applyFilters}>Áp dụng</Button>
            </Space>
          </div>
        }
      >
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="Tìm zone nguồn, server đích..."
          size="small" allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        {sourceZoneOptions.length > 0 && (
          <>
            <FilterSection title="Zone nguồn" options={sourceZoneOptions} selected={localZones} onSelect={setLocalZones} search={search} columns={2} />
            <Divider style={{ margin: '12px 0' }} />
          </>
        )}
        {destServerOptions.length > 0 && (
          <FilterSection title="Server đích" options={destServerOptions} selected={localServers} onSelect={setLocalServers} search={search} columns={2} />
        )}
      </Modal>
    </>
  );
}
