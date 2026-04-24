import { Badge, Tooltip } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';

interface ChangedBadgeProps {
  count?: number;
  tooltip?: string;
}

/**
 * Small indicator showing that a resource has recent change history.
 * Used in list tables and detail headers.
 */
export default function ChangedBadge({ count, tooltip = 'Có thay đổi gần đây' }: ChangedBadgeProps) {
  if (count === 0 || count === undefined) return null;
  return (
    <Tooltip title={tooltip}>
      <Badge count={count} overflowCount={99} size="small">
        <HistoryOutlined style={{ color: '#1677ff', cursor: 'pointer' }} />
      </Badge>
    </Tooltip>
  );
}
