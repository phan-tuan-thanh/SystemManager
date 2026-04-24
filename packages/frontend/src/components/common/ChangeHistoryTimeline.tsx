import { Timeline, Typography, Skeleton, Empty, Tag } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface ChangeHistoryItem {
  id: string;
  resource_type: string;
  resource_id: string;
  snapshot: {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ATTACH' | 'DETACH' | string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    data?: Record<string, unknown>;
  };
  changed_by?: string;
  created_at: string;
}

interface ChangeHistoryTimelineProps {
  items: ChangeHistoryItem[];
  loading?: boolean;
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  ATTACH: 'cyan',
  DETACH: 'orange',
};

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xoá',
  ATTACH: 'Gắn vào',
  DETACH: 'Gỡ ra',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SnapshotDetail({ snapshot }: { snapshot: ChangeHistoryItem['snapshot'] }) {
  if (snapshot.action === 'UPDATE' && snapshot.before && snapshot.after) {
    const changed = Object.keys(snapshot.after).filter(
      (k) => JSON.stringify((snapshot.before as Record<string, unknown>)[k]) !== JSON.stringify((snapshot.after as Record<string, unknown>)[k]),
    );
    if (changed.length === 0) return null;
    return (
      <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
        {changed.map((key) => (
          <div key={key}>
            <Text type="secondary">{key}: </Text>
            <Text delete style={{ color: '#ff4d4f' }}>
              {String((snapshot.before as Record<string, unknown>)[key] ?? '')}
            </Text>
            {' → '}
            <Text style={{ color: '#52c41a' }}>
              {String((snapshot.after as Record<string, unknown>)[key] ?? '')}
            </Text>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function ChangeHistoryTimeline({ items, loading }: ChangeHistoryTimelineProps) {
  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;
  if (!items || items.length === 0) return <Empty description="Chưa có lịch sử thay đổi" />;

  return (
    <Timeline
      mode="left"
      items={items.map((item) => ({
        dot: <ClockCircleOutlined style={{ fontSize: 14 }} />,
        color: ACTION_COLOR[item.snapshot.action] ?? 'blue',
        label: <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(item.created_at)}</Text>,
        children: (
          <div>
            <Tag color={ACTION_COLOR[item.snapshot.action] ?? 'blue'} style={{ marginBottom: 4 }}>
              {ACTION_LABEL[item.snapshot.action] ?? item.snapshot.action}
            </Tag>
            <SnapshotDetail snapshot={item.snapshot} />
          </div>
        ),
      }))}
    />
  );
}
