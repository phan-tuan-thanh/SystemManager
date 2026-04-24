import { useState } from 'react';
import {
  Button, Input, Select, Space, App, Tag, Tooltip, Modal,
  DatePicker, Descriptions, Divider, Typography, Skeleton,
} from 'antd';
import { SearchOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { useAuditLogList, useAuditLogDetail, buildAuditCsvUrl } from '../../hooks/useAuditLogs';
import type { AuditLog, AuditLogFilter } from '../../types/audit';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  LOGIN: 'cyan',
  LOGOUT: 'default',
  ENABLE_MODULE: 'gold',
  DISABLE_MODULE: 'orange',
  VIEW_SENSITIVE: 'purple',
};

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ENABLE_MODULE', 'DISABLE_MODULE', 'VIEW_SENSITIVE'];

function DiffView({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  let display: string;
  try {
    display = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  } catch {
    display = String(value);
  }
  return (
    <div style={{ marginBottom: 8 }}>
      <Text strong>{label}</Text>
      <pre
        style={{
          background: label === 'Old Value' ? '#fff1f0' : '#f6ffed',
          border: `1px solid ${label === 'Old Value' ? '#ffa39e' : '#b7eb8f'}`,
          borderRadius: 4,
          padding: 8,
          fontSize: 12,
          maxHeight: 300,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {display}
      </pre>
    </div>
  );
}

function AuditDetailModal({
  id,
  open,
  onClose,
}: {
  id: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useAuditLogDetail(id);

  return (
    <Modal
      title="Chi tiết Audit Log"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      {isLoading || !data ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <>
          <Descriptions size="small" column={2} bordered>
            <Descriptions.Item label="Hành động">
              <Tag color={ACTION_COLORS[data.action]}>{data.action}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Kết quả">
              <Tag color={data.result === 'SUCCESS' ? 'green' : 'red'}>
                {data.result === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Loại tài nguyên">{data.resource_type}</Descriptions.Item>
            <Descriptions.Item label="ID tài nguyên">{data.resource_id ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Người thực hiện">{data.user?.full_name ?? '—'} ({data.user?.email ?? '—'})</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ IP">{data.ip_address ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Thời gian" span={2}>
              {dayjs(data.created_at).format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
          {(data.old_value || data.new_value) && (
            <>
              <Divider>Thay đổi dữ liệu</Divider>
              <DiffView label="Giá trị cũ" value={data.old_value} />
              <DiffView label="Giá trị mới" value={data.new_value} />
            </>
          )}
        </>
      )}
    </Modal>
  );
}

export default function AuditLogPage() {
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [resourceFilter, setResourceFilter] = useState('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filter: AuditLogFilter = {
    page,
    limit,
    ...(actionFilter && { action: actionFilter }),
    ...(resourceFilter && { resource_type: resourceFilter }),
    ...(dateRange && { from: dateRange[0], to: dateRange[1] }),
  };

  const { data, isLoading } = useAuditLogList(filter);

  const handleExportCsv = () => {
    const url = buildAuditCsvUrl(filter);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs.csv';
    a.click();
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'time',
      width: 160,
      render: (t: string) => dayjs(t).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: (a: string) => <Tag color={ACTION_COLORS[a] ?? 'default'}>{a}</Tag>,
    },
    {
      title: 'Tài nguyên',
      key: 'resource',
      render: (_: unknown, r: AuditLog) => (
        <span>
          <Text strong>{r.resource_type}</Text>
          {r.resource_id && <Text type="secondary"> #{r.resource_id.slice(0, 8)}</Text>}
        </span>
      ),
    },
    {
      title: 'Người dùng',
      key: 'user',
      width: 180,
      render: (_: unknown, r: AuditLog) => r.user?.full_name ?? r.user_id ?? '—',
    },
    {
      title: 'IP',
      dataIndex: 'ip_address',
      key: 'ip',
      width: 130,
      render: (ip: string) => ip ?? '—',
    },
    {
      title: 'Kết quả',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (r: string) => (
        <Tag color={r === 'SUCCESS' ? 'green' : 'red'}>
          {r === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, r: AuditLog) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => openDetail(r.id)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Lịch sử hoạt động hệ thống"
        helpKey="audit"
        extra={
          <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
            Export CSV
          </Button>
        }
      />

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Hành động"
          style={{ width: 180 }}
          value={actionFilter}
          onChange={(v) => { setActionFilter(v); setPage(1); }}
          options={ACTIONS.map((a) => ({ label: a, value: a }))}
        />
        <Input
          placeholder="Loại tài nguyên (vd: Server, Application)"
          prefix={<SearchOutlined />}
          style={{ width: 280 }}
          value={resourceFilter}
          onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
          allowClear
        />
        <RangePicker
          showTime
          format="YYYY-MM-DD HH:mm"
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0].toISOString(), dates[1].toISOString()]);
            } else {
              setDateRange(null);
            }
            setPage(1);
          }}
        />
      </Space>

      <DataTable
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        total={data?.total ?? 0}
        page={page}
        pageSize={limit}
        onPageChange={(p, ps) => { setPage(p); setLimit(ps); }}
        rowKey="id"
      />

      <AuditDetailModal
        id={selectedId}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
