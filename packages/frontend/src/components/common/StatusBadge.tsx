import { Tag } from 'antd';

const STATUS_COLOR: Record<string, string> = {
  // User status
  ACTIVE: 'green',
  INACTIVE: 'default',
  LOCKED: 'red',
  // Module status
  ENABLED: 'green',
  DISABLED: 'default',
  // Group status
  // Server status
  MAINTENANCE: 'orange',
  RUNNING: 'green',
  STOPPED: 'default',
  DEPRECATED: 'red',
  // Generic
  SUCCESS: 'green',
  FAILED: 'red',
  PENDING: 'blue',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Không hoạt động',
  LOCKED: 'Bị khoá',
  ENABLED: 'Bật',
  DISABLED: 'Tắt',
  MAINTENANCE: 'Bảo trì',
  RUNNING: 'Running',
  STOPPED: 'Stopped',
  DEPRECATED: 'Hết hạn',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  PENDING: 'Chờ xử lý',
};

interface StatusBadgeProps {
  status: string;
  showText?: boolean;
}

export default function StatusBadge({ status, showText = true }: StatusBadgeProps) {
  const color = STATUS_COLOR[status] ?? 'default';
  const label = showText ? (STATUS_LABEL[status] ?? status) : status;
  return <Tag color={color}>{label}</Tag>;
}
