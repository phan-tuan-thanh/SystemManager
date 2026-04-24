import { Tag, Table, Typography, Space } from 'antd';
import type { ChangeItem } from '../hooks/useChangeSets';

const { Text } = Typography;

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'orange',
  DELETE: 'red',
};

const RESOURCE_LABELS: Record<string, string> = {
  SERVER: 'Server',
  APPLICATION: 'Application',
  NETWORK_CONFIG: 'Network Config',
  PORT: 'Port',
  APP_CONNECTION: 'Connection',
  APP_DEPLOYMENT: 'Deployment',
};

interface DiffRowProps {
  label: string;
  oldVal?: any;
  newVal?: any;
}

function DiffRow({ label, oldVal, newVal }: DiffRowProps) {
  const oldStr = oldVal !== undefined && oldVal !== null ? String(oldVal) : '—';
  const newStr = newVal !== undefined && newVal !== null ? String(newVal) : '—';
  const changed = oldStr !== newStr;

  return (
    <tr style={{ background: changed ? '#fffbe6' : undefined }}>
      <td style={{ padding: '4px 8px', fontWeight: 500, color: '#666', width: 140 }}>{label}</td>
      <td style={{ padding: '4px 8px', color: changed ? '#cf1322' : undefined, textDecoration: changed ? 'line-through' : undefined }}>
        {oldStr}
      </td>
      <td style={{ padding: '4px 8px', color: changed ? '#389e0d' : undefined }}>
        {newStr}
      </td>
    </tr>
  );
}

function JsonDiff({ oldValue, newValue, action }: { oldValue: any; newValue: any; action: string }) {
  const old_ = oldValue ?? {};
  const new_ = newValue ?? {};
  const keys = Array.from(new Set([...Object.keys(old_), ...Object.keys(new_)]));

  if (keys.length === 0) return <Text type="secondary">No field data</Text>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#fafafa' }}>
          <th style={{ padding: '4px 8px', textAlign: 'left', width: 140 }}>Field</th>
          <th style={{ padding: '4px 8px', textAlign: 'left' }}>Old Value</th>
          <th style={{ padding: '4px 8px', textAlign: 'left' }}>New Value</th>
        </tr>
      </thead>
      <tbody>
        {keys.map((key) => (
          <DiffRow key={key} label={key} oldVal={old_[key]} newVal={new_[key]} />
        ))}
      </tbody>
    </table>
  );
}

interface ChangeItemDiffProps {
  items: ChangeItem[];
  onRemove?: (itemId: string) => void;
  removing?: string | null;
}

export default function ChangeItemDiff({ items, onRemove, removing }: ChangeItemDiffProps) {
  if (items.length === 0) {
    return <Text type="secondary">No change items yet. Add items to this ChangeSet.</Text>;
  }

  const columns = [
    {
      title: '#',
      width: 40,
      render: (_: any, __: any, idx: number) => <Text type="secondary">{idx + 1}</Text>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 90,
      render: (action: string) => <Tag color={ACTION_COLOR[action] ?? 'default'}>{action}</Tag>,
    },
    {
      title: 'Resource Type',
      dataIndex: 'resource_type',
      width: 140,
      render: (rt: string) => <Text strong>{RESOURCE_LABELS[rt] ?? rt}</Text>,
    },
    {
      title: 'Resource ID',
      dataIndex: 'resource_id',
      width: 120,
      render: (id: string | null) => id ? <Text code style={{ fontSize: 11 }}>{id.slice(0, 8)}…</Text> : <Tag>NEW</Tag>,
    },
    {
      title: 'Changes (Old → New)',
      render: (item: ChangeItem) => (
        <JsonDiff oldValue={item.old_value} newValue={item.new_value} action={item.action} />
      ),
    },
    ...(onRemove
      ? [{
          title: '',
          width: 80,
          render: (item: ChangeItem) => (
            <Text
              type="danger"
              style={{ cursor: 'pointer', fontSize: 12 }}
              onClick={() => onRemove(item.id)}
            >
              {removing === item.id ? 'Removing…' : 'Remove'}
            </Text>
          ),
        }]
      : []),
  ];

  return (
    <Table
      dataSource={items}
      columns={columns}
      rowKey="id"
      size="small"
      pagination={false}
      expandable={{
        expandedRowRender: (item) => (
          <Space direction="vertical" style={{ width: '100%', padding: '8px 0' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Full diff for {RESOURCE_LABELS[item.resource_type] ?? item.resource_type} · {item.action}</Text>
            <JsonDiff oldValue={item.old_value} newValue={item.new_value} action={item.action} />
          </Space>
        ),
        rowExpandable: (item) => !!(item.old_value || item.new_value),
      }}
    />
  );
}
