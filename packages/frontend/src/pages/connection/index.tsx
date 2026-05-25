import { useState } from 'react';
import { Button, Input, Select, Space, App, Popconfirm, Tag, Tooltip } from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConnectionForm from './components/ConnectionForm';
import DependencyTree from './components/DependencyTree';
import {
  useConnectionList,
  useCreateConnection,
  useUpdateConnection,
  useDeleteConnection,
  useConnectionFirewallCoverage,
} from '../../hooks/useConnections';
import { useApplicationList } from '../../hooks/useApplications';
import type { AppConnection } from '../../types/connection';
import { useActiveEnvironments } from '../../hooks/useEnvironments';
import { toSelectOptions } from '../../utils/environmentUtils';
import EnvironmentTag from '../../components/common/EnvironmentTag';

const CONNECTION_TYPES = ['HTTP', 'HTTPS', 'TCP', 'GRPC', 'AMQP', 'KAFKA', 'DATABASE'];

export default function ConnectionListPage() {
  const { message } = App.useApp();
  const { data: envConfigs = [] } = useActiveEnvironments();
  const [search, setSearch] = useState('');
  const [envFilter, setEnvFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppConnection | null>(null);

  // Dependency tree state
  const [depOpen, setDepOpen] = useState(false);
  const [depAppId, setDepAppId] = useState<string | null>(null);
  const [depAppName, setDepAppName] = useState<string>('');

  const { data, isLoading } = useConnectionList({
    page,
    limit,
    search: search || undefined,
    environment: envFilter as any,
    connection_type: typeFilter as any,
  });

  const { data: coverageData } = useConnectionFirewallCoverage(envFilter);

  const { data: appsData } = useApplicationList({ limit: 200 });
  const applications = appsData?.items ?? [];

  const createConn = useCreateConnection();
  const updateConn = useUpdateConnection();
  const deleteConn = useDeleteConnection();

  const handleSubmit = async (values: Partial<AppConnection>) => {
    try {
      if (editing) {
        await updateConn.mutateAsync({ id: editing.id, ...values });
        message.success('Cập nhật kết nối thành công');
      } else {
        await createConn.mutateAsync(values);
        message.success('Tạo kết nối thành công');
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message ?? 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConn.mutateAsync(id);
      message.success('Xóa kết nối thành công');
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    } catch {
      message.error('Không thể xoá kết nối');
    }
  };

  const handleBulkDelete = async () => {
    const results = await Promise.allSettled(
      selectedRowKeys.map((id) => deleteConn.mutateAsync(id)),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) message.success(`Xóa ${succeeded} kết nối thành công`);
    if (failed > 0) message.error(`Không thể xóa ${failed} kết nối`);
    setSelectedRowKeys([]);
  };

  const openDependency = (appId: string, appName: string) => {
    setDepAppId(appId);
    setDepAppName(appName);
    setDepOpen(true);
  };

  const columns: ColumnsType<AppConnection> = [
    {
      title: 'Môi trường',
      dataIndex: 'environment',
      key: 'environment',
      width: 90,
      render: (env: string) => <EnvironmentTag code={env} />,
    },
    {
      title: 'Source App',
      key: 'source',
      render: (_: unknown, r: AppConnection) => (
        <span>
          <strong>{r.source_app?.name ?? '—'}</strong>
          <br />
          <span style={{ fontSize: 12, color: '#888' }}>{r.source_app?.code}</span>
        </span>
      ),
    },
    {
      title: '→',
      key: 'arrow',
      width: 30,
      render: () => <span style={{ color: '#aaa' }}>→</span>,
    },
    {
      title: 'Target App',
      key: 'target',
      render: (_: unknown, r: AppConnection) => (
        <span>
          <strong>{r.target_app?.name ?? '—'}</strong>
          <br />
          <span style={{ fontSize: 12, color: '#888' }}>{r.target_app?.code}</span>
        </span>
      ),
    },
    {
      title: 'Loại kết nối',
      dataIndex: 'connection_type',
      key: 'type',
      width: 120,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (d: string) => d ?? '—',
    },
    {
      title: 'Firewall',
      key: 'firewall_coverage',
      width: 100,
      render: (_: unknown, r: AppConnection) => {
        if (!envFilter || !coverageData) return <Tag color="default">—</Tag>;
        const cov = coverageData[r.id];
        if (!cov) return <Tag color="default">—</Tag>;
        if (cov.status === 'COVERED') {
          return (
            <Tooltip title="Có FirewallRule ALLOW phủ">
              <Tag color="success">Covered</Tag>
            </Tooltip>
          );
        }
        if (cov.status === 'UNCOVERED') {
          return (
            <Tooltip title="Thiếu FirewallRule ALLOW — cần xin cấp quyền mạng">
              <Tag color="warning">Uncovered</Tag>
            </Tooltip>
          );
        }
        if (cov.status === 'NO_PORT') {
          return (
            <Tooltip title="Chưa khai báo target port — không thể validate">
              <Tag color="default">No port</Tag>
            </Tooltip>
          );
        }
        return <Tag color="default">?</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 130,
      render: (_: unknown, r: AppConnection) => (
        <Space>
          <Button
            type="text"
            icon={<ApartmentOutlined />}
            size="small"
            title="Xem dependency"
            onClick={() => openDependency(r.source_app_id, r.source_app?.name ?? '')}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => { setEditing(r); setFormOpen(true); }}
          />
          <Popconfirm
            title="Xác nhận xóa kết nối này?"
            onConfirm={() => handleDelete(r.id)}
            okText="Xóa"
            cancelText="Huỷ"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="App Connections"
        subtitle="Quản lý kết nối giữa các ứng dụng"
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`Xóa ${selectedRowKeys.length} kết nối đã chọn?`}
                onConfirm={handleBulkDelete}
                okText="Xóa"
                cancelText="Huỷ"
                okType="danger"
              >
                <Button danger icon={<DeleteOutlined />}>
                  Xóa ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { setEditing(null); setFormOpen(true); }}
            >
              Thêm kết nối
            </Button>
          </Space>
        }
      />

      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm kiếm app..."
          prefix={<SearchOutlined />}
          style={{ width: 220 }}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear
        />
        <Select
          allowClear
          placeholder="Môi trường"
          style={{ width: 120 }}
          value={envFilter}
          onChange={(v) => { setEnvFilter(v); setPage(1); }}
          options={toSelectOptions(envConfigs)}
        />
        <Select
          allowClear
          placeholder="Loại kết nối"
          style={{ width: 150 }}
          value={typeFilter}
          onChange={(v) => { setTypeFilter(v); setPage(1); }}
          options={CONNECTION_TYPES.map((t) => ({ label: t, value: t }))}
        />
      </Space>

      <DataTable<AppConnection>
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        total={data?.total ?? 0}
        page={page}
        pageSize={limit}
        onPageChange={(p, ps) => { setPage(p); setLimit(ps); }}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
      />

      <ConnectionForm
        open={formOpen}
        editing={editing}
        applications={applications}
        onSubmit={handleSubmit}
        onCancel={() => { setFormOpen(false); setEditing(null); }}
        loading={createConn.isPending || updateConn.isPending}
      />

      <DependencyTree
        applicationId={depAppId}
        applicationName={depAppName}
        open={depOpen}
        onClose={() => setDepOpen(false)}
      />
    </div>
  );
}
