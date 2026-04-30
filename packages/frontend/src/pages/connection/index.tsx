import { useState } from 'react';
import { Button, Input, Select, Space, App, Popconfirm, Tag } from 'antd';
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
} from '../../hooks/useConnections';
import { useApplicationList } from '../../hooks/useApplications';
import type { AppConnection } from '../../types/connection';

const ENV_COLOR: Record<string, string> = { DEV: 'green', UAT: 'blue', PROD: 'red' };
const ENVIRONMENTS = ['DEV', 'UAT', 'PROD'];
const CONNECTION_TYPES = ['HTTP', 'HTTPS', 'TCP', 'GRPC', 'AMQP', 'KAFKA', 'DATABASE'];

export default function ConnectionListPage() {
  const { message } = App.useApp();
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

  const { data: appsData } = useApplicationList({ limit: 200 });
  const applications = appsData?.items ?? [];

  const createConn = useCreateConnection();
  const updateConn = useUpdateConnection();
  const deleteConn = useDeleteConnection();

  const handleSubmit = async (values: Partial<AppConnection>) => {
    try {
      if (editing) {
        await updateConn.mutateAsync({ id: editing.id, ...values });
        message.success('Đã cập nhật kết nối');
      } else {
        await createConn.mutateAsync(values);
        message.success('Đã tạo kết nối');
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
      message.success('Đã xoá kết nối');
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
    if (succeeded > 0) message.success(`Đã xoá ${succeeded} kết nối`);
    if (failed > 0) message.error(`${failed} kết nối không thể xoá`);
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
      render: (env: string) => <Tag color={ENV_COLOR[env]}>{env}</Tag>,
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
            title="Xác nhận xoá kết nối này?"
            onConfirm={() => handleDelete(r.id)}
            okText="Xoá"
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
                title={`Xoá ${selectedRowKeys.length} kết nối đã chọn?`}
                onConfirm={handleBulkDelete}
                okText="Xoá"
                cancelText="Huỷ"
                okType="danger"
              >
                <Button danger icon={<DeleteOutlined />}>
                  Xoá {selectedRowKeys.length} mục
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
          options={ENVIRONMENTS.map((e) => ({ label: e, value: e }))}
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
