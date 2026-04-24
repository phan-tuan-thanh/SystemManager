import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Tabs, Input, Select, Space, App, Popconfirm, Tag } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ApplicationForm from './components/ApplicationForm';
import AppGroupList from './components/AppGroupList';
import { useApplicationList, useDeleteApplication } from '../../hooks/useApplications';
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

  const { data, isLoading } = useApplicationList({
    page, limit,
    search: search || undefined,
    group_id: groupFilter,
    application_type: 'BUSINESS',
  });
  const { data: groups } = useAppGroupList({ limit: 100, group_type: 'BUSINESS' });
  const deleteApp = useDeleteApplication();

  const handleDelete = async (id: string) => {
    try {
      await deleteApp.mutateAsync(id);
      message.success('Đã xoá ứng dụng');
    } catch {
      message.error('Không thể xoá ứng dụng');
    }
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
            title="Xoá ứng dụng?"
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
      <Space style={{ marginBottom: 16 }} wrap>
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditApp(null); setFormOpen(true); }}>
          Thêm ứng dụng
        </Button>
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
      />

      <ApplicationForm open={formOpen} app={editApp} onClose={() => setFormOpen(false)} initialType="BUSINESS" />
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
      message.success('Đã xoá phần mềm hạ tầng');
    } catch {
      message.error('Không thể xoá phần mềm hạ tầng');
    }
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
            title="Xoá phần mềm?"
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
      <Space style={{ marginBottom: 16 }} wrap>
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditApp(null); setFormOpen(true); }}>
          Thêm phần mềm
        </Button>
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
