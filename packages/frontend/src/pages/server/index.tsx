import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tabs, Input, Select, Space, App, Popconfirm, Tag, Drawer } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UploadOutlined, TableOutlined, SnippetsOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ServerForm from './components/ServerForm';
import EditableTable, { type EditableColumnDef } from '../../components/common/EditableTable';
import PasteImportDrawer, { type PasteImportConfig } from '../../components/common/PasteImportDrawer';
import { useServerList, useDeleteServer, useCreateServer } from '../../hooks/useServers';
import type { Server, Environment } from '../../types/server';

const SERVER_EDITABLE_COLUMNS: EditableColumnDef[] = [
  { key: 'code', title: 'Mã server', type: 'text', required: true, placeholder: 'SRV-PROD-001', width: 140 },
  { key: 'name', title: 'Tên server', type: 'text', required: true, placeholder: 'App Server 01', width: 160 },
  { key: 'hostname', title: 'Hostname', type: 'text', required: true, placeholder: 'app-01.internal', width: 180 },
  { key: 'environment', title: 'Môi trường', type: 'select', required: true, width: 110, options: [
    { value: 'DEV', label: 'DEV' },
    { value: 'UAT', label: 'UAT' },
    { value: 'PROD', label: 'PROD' },
  ]},
  { key: 'status', title: 'Trạng thái', type: 'select', width: 120, options: [
    { value: 'ACTIVE', label: 'Hoạt động' },
    { value: 'INACTIVE', label: 'Không hoạt động' },
    { value: 'MAINTENANCE', label: 'Bảo trì' },
  ]},
  { key: 'purpose', title: 'Mục đích', type: 'select', width: 140, options: [
    { value: 'APP_SERVER', label: 'App Server' },
    { value: 'DB_SERVER', label: 'DB Server' },
    { value: 'PROXY', label: 'Proxy' },
    { value: 'LOAD_BALANCER', label: 'Load Balancer' },
    { value: 'CACHE', label: 'Cache' },
    { value: 'MESSAGE_QUEUE', label: 'Message Queue' },
    { value: 'OTHER', label: 'Khác' },
  ]},
  { key: 'infra_type', title: 'Loại HT', type: 'select', width: 140, options: [
    { value: 'VIRTUAL_MACHINE', label: 'Virtual Machine' },
    { value: 'PHYSICAL_SERVER', label: 'Physical Server' },
    { value: 'CONTAINER', label: 'Container' },
    { value: 'CLOUD_INSTANCE', label: 'Cloud Instance' },
  ]},
  { key: 'site', title: 'Site', type: 'select', width: 100, options: [
    { value: 'DC', label: 'DC' },
    { value: 'DR', label: 'DR' },
    { value: 'TEST', label: 'TEST' },
  ]},
  { key: 'description', title: 'Mô tả', type: 'text', width: 200 },
];

const SERVER_PASTE_CONFIG: Omit<PasteImportConfig, 'onImport'> = {
  title: 'Dán & Nhập Server',
  editableColumns: SERVER_EDITABLE_COLUMNS,
  targetFields: [
    { key: 'code', label: 'Mã server', required: true, aliases: ['server_code', 'ma_server', 'ma'] },
    { key: 'name', label: 'Tên server', required: true, aliases: ['ten_server', 'ten', 'server_name'] },
    { key: 'hostname', label: 'Hostname', required: true, aliases: ['host', 'ip', 'host_name'] },
    { key: 'environment', label: 'Môi trường', required: true, aliases: ['env', 'moi_truong'], options: [
      { value: 'DEV', label: 'DEV' },
      { value: 'UAT', label: 'UAT' },
      { value: 'PROD', label: 'PROD' },
    ], valueAliases: { dev: 'DEV', uat: 'UAT', prod: 'PROD', production: 'PROD', development: 'DEV' } },
    { key: 'status', label: 'Trạng thái', aliases: ['trang_thai'], options: [
      { value: 'ACTIVE', label: 'Hoạt động' },
      { value: 'INACTIVE', label: 'Không hoạt động' },
      { value: 'MAINTENANCE', label: 'Bảo trì' },
    ], valueAliases: { active: 'ACTIVE', inactive: 'INACTIVE', maintenance: 'MAINTENANCE', 'hoat dong': 'ACTIVE' } },
    { key: 'purpose', label: 'Mục đích', aliases: ['muc_dich', 'loai'], options: [
      { value: 'APP_SERVER', label: 'App Server' }, { value: 'DB_SERVER', label: 'DB Server' },
      { value: 'PROXY', label: 'Proxy' }, { value: 'LOAD_BALANCER', label: 'Load Balancer' },
      { value: 'CACHE', label: 'Cache' }, { value: 'MESSAGE_QUEUE', label: 'Message Queue' },
      { value: 'OTHER', label: 'Khác' },
    ]},
    { key: 'infra_type', label: 'Loại hạ tầng', aliases: ['loai_ha_tang', 'infra'], options: [
      { value: 'VIRTUAL_MACHINE', label: 'Virtual Machine' }, { value: 'PHYSICAL_SERVER', label: 'Physical Server' },
      { value: 'CONTAINER', label: 'Container' }, { value: 'CLOUD_INSTANCE', label: 'Cloud Instance' },
    ], valueAliases: { vm: 'VIRTUAL_MACHINE', physical: 'PHYSICAL_SERVER', container: 'CONTAINER', cloud: 'CLOUD_INSTANCE' } },
    { key: 'site', label: 'Site', options: [
      { value: 'DC', label: 'DC' }, { value: 'DR', label: 'DR' }, { value: 'TEST', label: 'TEST' },
    ]},
    { key: 'description', label: 'Mô tả', aliases: ['mo_ta', 'desc', 'ghi_chu'] },
  ],
};

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
  const [batchAddOpen, setBatchAddOpen] = useState(false);
  const [pasteImportOpen, setPasteImportOpen] = useState(false);

  const params = {
    page,
    limit,
    search: search || undefined,
    status: statusFilter,
    environment: envTab === 'ALL' ? undefined : envTab,
  };

  const { data, isLoading, refetch } = useServerList(params);
  const deleteServer = useDeleteServer();
  const createServer = useCreateServer();

  const handleDelete = async (id: string) => {
    try {
      await deleteServer.mutateAsync(id);
      message.success('Xóa server thành công');
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    } catch {
      message.error('Không thể xóa server');
    }
  };

  const handleBulkDelete = async () => {
    const results = await Promise.allSettled(
      selectedRowKeys.map((id) => deleteServer.mutateAsync(id)),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) message.success(`Xóa ${succeeded} server thành công`);
    if (failed > 0) message.error(`Không thể xóa ${failed} server`);
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
            title="Xóa server này?"
            description="Dữ liệu sẽ được giữ lại trong lịch sử."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
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
        title="Quản lý server (Server Management)"
        helpKey="server"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Server' }]}
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`Xóa ${selectedRowKeys.length} server đã chọn?`}
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
            <Button icon={<SnippetsOutlined />} onClick={() => setPasteImportOpen(true)}>
              Dán & Nhập
            </Button>
            <Button icon={<TableOutlined />} onClick={() => setBatchAddOpen(true)}>
              Nhập bảng
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => navigate('/infra-upload')}>
              Nhập CSV
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

      <Drawer
        title="Nhập server theo bảng"
        open={batchAddOpen}
        onClose={() => setBatchAddOpen(false)}
        width="90%"
        destroyOnClose
      >
        <EditableTable
          columns={SERVER_EDITABLE_COLUMNS}
          onSave={async (rows) => {
            const results = await Promise.allSettled(
              rows.map((r) => createServer.mutateAsync(r as Parameters<typeof createServer.mutateAsync>[0])),
            );
            const failed = results.filter((r) => r.status === 'rejected').length;
            const succeeded = results.length - failed;
            if (succeeded > 0) { message.success(`Đã tạo ${succeeded} server`); refetch(); }
            if (failed > 0) message.error(`${failed} server không tạo được`);
            if (failed === 0) setBatchAddOpen(false);
          }}
          saveLabel="Tạo tất cả server"
        />
      </Drawer>

      <PasteImportDrawer
        open={pasteImportOpen}
        onClose={() => setPasteImportOpen(false)}
        config={{
          ...SERVER_PASTE_CONFIG,
          onImport: async (rows) => {
            const results = await Promise.allSettled(
              rows.map((r) => createServer.mutateAsync(r as Parameters<typeof createServer.mutateAsync>[0])),
            );
            const failed = results.filter((r) => r.status === 'rejected').length;
            if (failed > 0) throw new Error(`${failed} server không tạo được`);
            refetch();
          },
        }}
        onSuccess={() => refetch()}
      />
    </App>
  );
}
