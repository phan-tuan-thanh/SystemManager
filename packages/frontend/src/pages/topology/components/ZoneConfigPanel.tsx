import { useState } from 'react';
import { Button, List, Space, Tooltip, Popover } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { TopologyZone } from '../hooks/useTopologyZones';

interface Props {
  zones: TopologyZone[];
  onReorder: (ids: string[]) => void;
  onReset: () => void;
}

function ZoneOrderList({ zones, onReorder, onReset }: Props) {
  const sorted = [...zones].sort((a, b) => a.order - b.order);

  const move = (idx: number, dir: -1 | 1) => {
    const ids = sorted.map((z) => z.id);
    const target = idx + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    onReorder(ids);
  };

  return (
    <div style={{ minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#262626' }}>Thứ tự Zone</span>
        <Tooltip title="Reset về mặc định">
          <Button size="small" type="text" icon={<ReloadOutlined />} onClick={onReset} />
        </Tooltip>
      </div>
      <List
        size="small"
        dataSource={sorted}
        renderItem={(zone, idx) => (
          <List.Item
            style={{ padding: '4px 0', borderBottom: 'none' }}
            actions={[
              <Button
                key="up"
                size="small"
                type="text"
                icon={<ArrowUpOutlined />}
                disabled={idx === 0}
                onClick={() => move(idx, -1)}
              />,
              <Button
                key="down"
                size="small"
                type="text"
                icon={<ArrowDownOutlined />}
                disabled={idx === sorted.length - 1}
                onClick={() => move(idx, 1)}
              />,
            ]}
          >
            <Space size={6} style={{ fontSize: 12 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: zone.borderColor,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              {zone.name}
            </Space>
          </List.Item>
        )}
      />
      <div style={{ marginTop: 8, padding: '6px 0 0', borderTop: '1px solid #f0f0f0', fontSize: 11, color: '#8c8c8c', lineHeight: 1.4 }}>
        Server được phân zone theo địa chỉ IP (so sánh với IP range của từng zone).
      </div>
    </div>
  );
}

export default function ZoneConfigPanel({ zones, onReorder, onReset }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomLeft"
      content={<ZoneOrderList zones={zones} onReorder={onReorder} onReset={onReset} />}
    >
      <Tooltip title="Cấu hình thứ tự zone">
        <Button size="small" icon={<AppstoreOutlined />}>
          Zones
        </Button>
      </Tooltip>
    </Popover>
  );
}
