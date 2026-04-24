import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, Space, App, Popconfirm, Tag, Progress } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import DeploymentForm from './components/DeploymentForm';
import { useDeploymentList, useDeleteDeployment } from '../../hooks/useDeployments';
import type { AppDeployment } from '../../types/deployment';
import type { Environment } from '../../types/server';

const ENV_COLOR: Record<string, string> = { DEV: 'green', UAT: 'blue', PROD: 'red' };

export default function DeploymentListPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [envFilter, setEnvFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading } = useDeploymentList({
    page, limit,
    search: search || undefined,
    environment: envFilter,
    status: statusFilter,
  });
  const deleteDeployment = useDeleteDeployment();

  const handleDelete = async (id: string) => {
    try {
      await deleteDeployment.mutateAsync(id);
      message.success('Đã xoá deployment');
    } catch {
      message.error('Không thể xoá deployment');
    }
  };

  const columns: ColumnsType<AppDeployment> = [
    {
      title: 'Môi trường',
      dataIndex: 'environment',
      key: 'env',
      width: 90,
      render: (env: Environment) => <Tag color={ENV_COLOR[env]}>{env}</Tag>,
    },
    {
      title: 'Ứng dụng',
      key: 'app',
      render: (_: unknown, r: AppDeployment) => r.application?.name ?? '—',
    },
    {
      title: 'Server',
      key: 'server',
      render: (_: unknown, r: AppDeployment) => r.server?.name ?? '—',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 110,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: 'Tài liệu',
      key: 'docs',
      width: 80,
      render: (_: unknown, r: AppDeployment) => (
        <Tag>{r._count?.docs ?? 0} docs</Tag>
      ),
    },
    {
      title: 'Deployed at',
      dataIndex: 'deployed_at',
      key: 'deployed_at',
      width: 130,
      render: (v?: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      render: (_: unknown, record: AppDeployment) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/deployments/${record.id}`)} />
          <Popconfirm
            title="Xoá deployment?"
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
      <PageHeader
        title="Deployments"
        subtitle="Quản lý triển khai ứng dụng lên các server"
        helpKey="deployment"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
            Tạo deployment
          </Button>
        }
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm deployment..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 260 }}
          allowClear
        />
        <Select
          placeholder="Môi trường"
          value={envFilter}
          onChange={(v) => { setEnvFilter(v); setPage(1); }}
          allowClear
          style={{ width: 130 }}
          options={[
            { value: 'DEV', label: 'DEV' },
            { value: 'UAT', label: 'UAT' },
            { value: 'PROD', label: 'PROD' },
          ]}
        />
        <Select
          placeholder="Trạng thái"
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          allowClear
          style={{ width: 150 }}
          options={[
            { value: 'RUNNING', label: 'Running' },
            { value: 'STOPPED', label: 'Stopped' },
            { value: 'DEPRECATED', label: 'Deprecated' },
          ]}
        />
      </Space>

      <DataTable<AppDeployment>
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.total ?? 0,
          onChange: setPage,
        }}
      />

      <DeploymentForm open={formOpen} deployment={null} onClose={() => setFormOpen(false)} />
    </>
  );
}
