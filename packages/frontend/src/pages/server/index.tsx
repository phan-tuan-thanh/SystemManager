import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tabs, Input, Select, Space, App, Popconfirm, Tag } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ServerForm from './components/ServerForm';
import { useServerList, useDeleteServer } from '../../hooks/useServers';
import type { Server, Environment } from '../../types/server';

const ENV_TABS: { key: Environment | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'DEV', label: 'DEV' },
  { key: 'UAT', label: 'UAT' },
  { key: 'PROD', label: 'PROD' },
];

const PURPOSE_LABEL: Record<string, string> = {
  APP_SERVER: 'App',
  DB_SERVER: 'DB',
  PROXY: 'Proxy',
  LOAD_BALANCER: 'LB',
  CACHE: 'Cache',
  MESSAGE_QUEUE: 'MQ',
  OTHER: 'Other',
};

const INFRA_LABEL: Record<string, string> = {
  VIRTUAL_MACHINE: 'VM',
  PHYSICAL_SERVER: 'Physical',
  CONTAINER: 'Container',
  CLOUD_INSTANCE: 'Cloud',
};

export default function ServerListPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [envTab, setEnvTab] = useState<Environment | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [createOpen, setCreateOpen] = useState(false);
  const [editServer, setEditServer] = useState<Server | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const params = {
    page,
    limit,
    search: search || undefined,
    status: statusFilter,
    environment: envTab === 'ALL' ? undefined : envTab,
  };

  const { data, isLoading } = useServerList(params);
  const deleteServer = useDeleteServer();

  const handleDelete = async (id: string) => {
    try {
      await deleteServer.mutateAsync(id);
      message.success('Đã xoá server');
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    } catch {
      message.error('Không thể xoá server');
    }
  };

  const handleBulkDelete = async () => {
    const results = await Promise.allSettled(
      selectedRowKeys.map((id) => deleteServer.mutateAsync(id)),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) message.success(`Đã xoá ${succeeded} server`);
    if (failed > 0) message.error(`${failed} server không thể xoá`);
    setSelectedRowKeys([]);
  };

  const columns: ColumnsType<Server> = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (code: string) => <strong>{code}</strong>,
    },
    {
      title: 'Tên server',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Hostname',
      dataIndex: 'hostname',
      key: 'hostname',
      ellipsis: true,
    },
    {
      title: 'Môi trường',
      dataIndex: 'environment',
      key: 'environment',
      width: 90,
      render: (env: string) => (
        <Tag color={env === 'PROD' ? 'red' : env === 'UAT' ? 'orange' : 'blue'}>{env}</Tag>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'purpose',
      key: 'purpose',
      width: 80,
      render: (p: string) => <Tag>{PURPOSE_LABEL[p] ?? p}</Tag>,
    },
    {
      title: 'Hạ tầng',
      dataIndex: 'infra_type',
      key: 'infra_type',
      width: 90,
      render: (t: string) => INFRA_LABEL[t] ?? t,
    },
    {
      title: 'Site',
      dataIndex: 'site',
      key: 'site',
      width: 60,
    },
    {
      title: 'Hệ điều hành',
      dataIndex: 'os_display',
      key: 'os',
      width: 150,
      ellipsis: true,
      render: (os: string) => <Tag color="cyan">{os || '—'}</Tag>,
    },
    {
      title: 'Hệ thống',
      dataIndex: 'infra_system',
      key: 'infra_system',
      width: 150,
      ellipsis: true,
      render: (sys: Server['infra_system']) =>
        sys ? <Tag color="geekblue">{sys.name}</Tag> : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Ứng dụng',
      key: 'app_count',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: Server) => {
        const count = record.app_count ?? 0;
        return count > 0 ? <Tag color="cyan">{count}</Tag> : <span style={{ color: '#bbb' }}>0</span>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Server) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            size="small"
            type="link"
            onClick={() => navigate(`/servers/${record.id}`)}
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            type="link"
            onClick={() => setEditServer(record)}
          />
          <Popconfirm
            title="Xoá server này?"
            description="Dữ liệu sẽ được giữ lại trong lịch sử."
            onConfirm={() => handleDelete(record.id)}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Button icon={<DeleteOutlined />} size="small" type="link" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <App>
      <PageHeader
        title="Quản lý Server"
        helpKey="server"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Servers' }]}
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`Xoá ${selectedRowKeys.length} server đã chọn?`}
                onConfirm={handleBulkDelete}
                okText="Xoá"
                cancelText="Huỷ"
                okType="danger"
              >
                <Button danger icon={<DeleteOutlined />}>
                  Xoá {selectedRowKeys.length} server
                </Button>
              </Popconfirm>
            )}
            <Button icon={<UploadOutlined />} onClick={() => navigate('/infra-upload')}>
              Import CSV
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Thêm server
            </Button>
          </Space>
        }
      />

      <Tabs
        activeKey={envTab}
        onChange={(k) => { setEnvTab(k as Environment | 'ALL'); setPage(1); }}
        items={ENV_TABS.map((t) => ({ key: t.key, label: t.label }))}
        style={{ marginBottom: 16 }}
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm kiếm theo tên, mã, hostname..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear
          style={{ width: 280 }}
        />
        <Select
          placeholder="Trạng thái"
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          allowClear
          style={{ width: 150 }}
        >
          <Select.Option value="ACTIVE">Hoạt động</Select.Option>
          <Select.Option value="INACTIVE">Không hoạt động</Select.Option>
          <Select.Option value="MAINTENANCE">Bảo trì</Select.Option>
        </Select>
      </Space>

      <DataTable<Server>
        rowKey="id"
        dataSource={data?.items}
        columns={columns}
        loading={isLoading}
        total={data?.total}
        page={page}
        pageSize={limit}
        onPageChange={(p, ps) => { setPage(p); setLimit(ps); }}
        onRow={(record) => ({ onDoubleClick: () => navigate(`/servers/${record.id}`) })}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
      />

      <ServerForm open={createOpen} onClose={() => setCreateOpen(false)} />
      <ServerForm open={!!editServer} onClose={() => setEditServer(null)} initial={editServer} />
    </App>
  );
}
