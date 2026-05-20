import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Tabs, Input, Select, Space, App, Popconfirm, Tag, Drawer } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, TableOutlined, SnippetsOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ApplicationForm from './components/ApplicationForm';
import AppGroupList from './components/AppGroupList';
import EditableTable, { type EditableColumnDef } from '../../components/common/EditableTable';
import PasteImportDrawer, { type PasteImportConfig } from '../../components/common/PasteImportDrawer';
import { useApplicationList, useDeleteApplication, useCreateApplication } from '../../hooks/useApplications';
import { useAppGroupList } from '../../hooks/useAppGroups';
import type { Application } from '../../types/application';
import dayjs from 'dayjs';

function BusinessTab() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [formOpen, setFormOpen] = useState(false);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [batchAddOpen, setBatchAddOpen] = useState(false);
  const [pasteImportOpen, setPasteImportOpen] = useState(false);

  const { data, isLoading, refetch } = useApplicationList({
    page, limit,
    search: search || undefined,
    group_id: groupFilter,
    application_type: 'BUSINESS',
  });
  const { data: groups } = useAppGroupList({ limit: 100, group_type: 'BUSINESS' });
  const deleteApp = useDeleteApplication();
  const createApp = useCreateApplication();

  const groupOptions = (groups?.items ?? []).map((g) => ({ value: g.id, label: `${g.code} — ${g.name}` }));

  const appEditableCols: EditableColumnDef[] = [
    { key: 'code', title: 'Mã', type: 'text', required: true, placeholder: 'CORE_BANKING', width: 140 },
    { key: 'name', title: 'Tên ứng dụng', type: 'text', required: true, width: 200 },
    { key: 'group_id', title: 'Nhóm', type: 'select', required: true, width: 200, options: groupOptions },
    { key: 'status', title: 'Trạng thái', type: 'select', width: 130, options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
      { value: 'DEPRECATED', label: 'Deprecated' },
    ]},
    { key: 'version', title: 'Phiên bản', type: 'text', width: 100, placeholder: '1.0.0' },
    { key: 'owner_team', title: 'Team', type: 'text', width: 140 },
    { key: 'tech_stack', title: 'Tech Stack', type: 'text', width: 180 },
  ];

  const appPasteConfig: PasteImportConfig = {
    title: 'Dán & Nhập Ứng dụng nghiệp vụ',
    editableColumns: appEditableCols,
    targetFields: [
      { key: 'code', label: 'Mã ứng dụng', required: true, aliases: ['ma', 'app_code', 'ma_ung_dung'] },
      { key: 'name', label: 'Tên ứng dụng', required: true, aliases: ['ten', 'app_name', 'ten_ung_dung'] },
      { key: 'group_id', label: 'Nhóm ứng dụng', required: true, aliases: ['group', 'nhom', 'group_name'], options: groupOptions },
      { key: 'status', label: 'Trạng thái', aliases: ['trang_thai'], options: [
        { value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }, { value: 'DEPRECATED', label: 'Deprecated' },
      ], valueAliases: { active: 'ACTIVE', inactive: 'INACTIVE', deprecated: 'DEPRECATED' } },
      { key: 'version', label: 'Phiên bản', aliases: ['phien_ban', 'ver'] },
      { key: 'owner_team', label: 'Team phụ trách', aliases: ['team', 'owner'] },
      { key: 'tech_stack', label: 'Tech Stack', aliases: ['tech', 'stack'] },
    ],
    onImport: async (rows) => {
      const payload = rows.map((r) => ({ ...r, application_type: 'BUSINESS' }));
      const results = await Promise.allSettled(
        payload.map((r) => createApp.mutateAsync(r as Parameters<typeof createApp.mutateAsync>[0])),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) throw new Error(`${failed} ứng dụng không tạo được`);
      refetch();
    },
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApp.mutateAsync(id);
      message.success('Xóa ứng dụng thành công');
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    } catch {
      message.error('Không thể xoá ứng dụng');
    }
  };

  const handleBulkDelete = async () => {
    const results = await Promise.allSettled(
      selectedRowKeys.map((id) => deleteApp.mutateAsync(id)),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) message.success(`Xóa ${succeeded} ứng dụng thành công`);
    if (failed > 0) message.error(`Không thể xóa ${failed} ứng dụng`);
    setSelectedRowKeys([]);
  };

  const columns: ColumnsType<Application> = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string) => <strong>{code}</strong>,
    },
    {
      title: 'Tên ứng dụng',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Nhóm',
      key: 'group',
      width: 180,
      render: (_: unknown, record: Application) => record.group?.name ?? '—',
    },
    {
      title: 'Phiên bản',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: 'Team',
      dataIndex: 'owner_team',
      key: 'owner_team',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Application) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/applications/${record.id}`)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditApp(record); setFormOpen(true); }} />
          <Popconfirm
            title="Xóa ứng dụng này?"
            description="Hành động này không thể hoàn tác"
            onConfirm={() => handleDelete(record.id)}
            okType="danger"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm ứng dụng nghiệp vụ..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            placeholder="Lọc theo nhóm"
            value={groupFilter}
            onChange={(v) => { setGroupFilter(v); setPage(1); }}
            allowClear
            style={{ width: 200 }}
            options={(groups?.items ?? []).map((g) => ({ value: g.id, label: g.name }))}
          />
        </Space>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Xóa ${selectedRowKeys.length} ứng dụng đã chọn?`}
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
          <Button icon={<SnippetsOutlined />} onClick={() => setPasteImportOpen(true)}>Dán & Nhập</Button>
          <Button icon={<TableOutlined />} onClick={() => setBatchAddOpen(true)}>Nhập bảng</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditApp(null); setFormOpen(true); }}>
            Thêm ứng dụng
          </Button>
        </Space>
      </Space>

      <DataTable<Application>
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        rowKey="id"
        total={data?.total ?? 0}
        page={page}
        pageSize={limit}
        onPageChange={(p, ps) => { setPage(p); setLimit(ps); }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
      />

      <ApplicationForm open={formOpen} app={editApp} onClose={() => setFormOpen(false)} initialType="BUSINESS" />

      <Drawer
        title="Nhập ứng dụng theo bảng"
        open={batchAddOpen}
        onClose={() => setBatchAddOpen(false)}
        width="90%"
        destroyOnClose
      >
        <EditableTable
          columns={appEditableCols}
          onSave={async (rows) => {
            const payload = rows.map((r) => ({ ...r, application_type: 'BUSINESS' }));
            const results = await Promise.allSettled(
              payload.map((r) => createApp.mutateAsync(r as Parameters<typeof createApp.mutateAsync>[0])),
            );
            const failed = results.filter((r) => r.status === 'rejected').length;
            const succeeded = results.length - failed;
            if (succeeded > 0) { message.success(`Đã tạo ${succeeded} ứng dụng`); refetch(); }
            if (failed > 0) message.error(`${failed} ứng dụng không tạo được`);
            if (failed === 0) setBatchAddOpen(false);
          }}
          saveLabel="Tạo tất cả ứng dụng"
        />
      </Drawer>

      <PasteImportDrawer
        open={pasteImportOpen}
        onClose={() => setPasteImportOpen(false)}
        config={appPasteConfig}
        onSuccess={() => refetch()}
      />
    </>
  );
}

function InfraTab() {
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string | undefined>();
  const [swTypeFilter, setSwTypeFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [formOpen, setFormOpen] = useState(false);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const { data, isLoading } = useApplicationList({
    page, limit,
    search: search || undefined,
    group_id: groupFilter,
    sw_type: swTypeFilter,
    application_type: 'SYSTEM',
  });
  const { data: groups } = useAppGroupList({ limit: 100, group_type: 'INFRASTRUCTURE' });
  const deleteApp = useDeleteApplication();

  const handleDelete = async (id: string) => {
    try {
      await deleteApp.mutateAsync(id);
      message.success('Xóa phần mềm hạ tầng thành công');
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    } catch {
      message.error('Không thể xoá phần mềm hạ tầng');
    }
  };

  const handleBulkDelete = async () => {
    const results = await Promise.allSettled(
      selectedRowKeys.map((id) => deleteApp.mutateAsync(id)),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) message.success(`Xóa ${succeeded} phần mềm hạ tầng thành công`);
    if (failed > 0) message.error(`Không thể xóa ${failed} mục`);
    setSelectedRowKeys([]);
  };

  const columns: ColumnsType<Application> = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 160,
      render: (code: string) => <strong>{code}</strong>,
    },
    {
      title: 'Tên phần mềm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Nhóm',
      key: 'group',
      width: 180,
      render: (_: unknown, record: Application) => record.group?.name ?? '—',
    },
    {
      title: 'Loại',
      dataIndex: 'sw_type',
      key: 'sw_type',
      width: 120,
      render: (t: string) => t ? <Tag>{t}</Tag> : '—',
    },
    {
      title: 'Phiên bản',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      width: 130,
      render: (v: string) => v ?? '—',
    },
    {
      title: 'EOL Date',
      dataIndex: 'eol_date',
      key: 'eol_date',
      width: 120,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Application) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditApp(record); setFormOpen(true); }} />
          <Popconfirm
            title="Xóa phần mềm này?"
            description="Hành động này không thể hoàn tác"
            onConfirm={() => handleDelete(record.id)}
            okType="danger"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm phần mềm hạ tầng..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            placeholder="Lọc theo nhóm"
            value={groupFilter}
            onChange={(v) => { setGroupFilter(v); setPage(1); }}
            allowClear
            style={{ width: 200 }}
            options={(groups?.items ?? []).map((g) => ({ value: g.id, label: g.name }))}
          />
          <Select
            placeholder="Loại phần mềm"
            value={swTypeFilter}
            onChange={(v) => { setSwTypeFilter(v); setPage(1); }}
            allowClear
            style={{ width: 160 }}
            options={[
              { value: 'OS', label: 'OS' },
              { value: 'DATABASE', label: 'Database' },
              { value: 'MIDDLEWARE', label: 'Middleware' },
              { value: 'RUNTIME', label: 'Runtime' },
              { value: 'WEB_SERVER', label: 'Web Server' },
              { value: 'OTHER', label: 'Khác' },
            ]}
          />
        </Space>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Xóa ${selectedRowKeys.length} phần mềm đã chọn?`}
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditApp(null); setFormOpen(true); }}>
            Thêm phần mềm
          </Button>
        </Space>
      </Space>

      <DataTable<Application>
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        rowKey="id"
        total={data?.total ?? 0}
        page={page}
        pageSize={limit}
        onPageChange={(p, ps) => { setPage(p); setLimit(ps); }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
      />

      <ApplicationForm open={formOpen} app={editApp} onClose={() => setFormOpen(false)} initialType="SYSTEM" />
    </>
  );
}

export default function ApplicationListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'infra' ? 'infra' : searchParams.get('tab') ?? 'business';

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key });
  };

  return (
    <>
      <PageHeader
        title="Ứng dụng"
        subtitle="Quản lý ứng dụng nghiệp vụ và phần mềm hạ tầng"
        helpKey="application"
      />

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'business',
            label: 'Nghiệp vụ',
            children: <BusinessTab />,
          },
          {
            key: 'infra',
            label: 'Hạ tầng',
            children: <InfraTab />,
          },
          {
            key: 'groups',
            label: 'Nhóm ứng dụng',
            children: <AppGroupList />,
          },
        ]}
      />
    </>
  );
}
