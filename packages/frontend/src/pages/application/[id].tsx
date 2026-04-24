import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Tabs, Descriptions, Tag, Space, App, Skeleton,
  Table, Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, GlobalOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import ChangeHistoryTimeline from '../../components/common/ChangeHistoryTimeline';
import ApplicationForm from './components/ApplicationForm';
import PortTab from './components/PortTab';
import {
  useApplicationDetail,
  useApplicationWhereRunning,
  useApplicationChangeHistory,
  useDeleteApplication,
} from '../../hooks/useApplications';
import { useDeploymentList } from '../../hooks/useDeployments';
import type { Environment } from '../../types/server';

const ENV_COLOR: Record<string, string> = { DEV: 'green', UAT: 'blue', PROD: 'red' };

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [editOpen, setEditOpen] = useState(false);
  const [whereOpen, setWhereOpen] = useState(false);
  const [historyEnabled, setHistoryEnabled] = useState(false);

  const { data: app, isLoading } = useApplicationDetail(id!);
  const { data: whereData, isLoading: whereLoading } = useApplicationWhereRunning(
    whereOpen ? id! : '',
  );
  const { data: history, isLoading: historyLoading } = useApplicationChangeHistory(id!, historyEnabled);
  const { data: deployments, isLoading: deplLoading } = useDeploymentList({
    application_id: id,
    limit: 50,
  });
  const deleteApp = useDeleteApplication();

  if (isLoading) return <Skeleton active />;
  if (!app) return <div>Không tìm thấy ứng dụng</div>;

  const handleDelete = async () => {
    try {
      await deleteApp.mutateAsync(app.id);
      message.success('Đã xoá ứng dụng');
      navigate('/applications');
    } catch {
      message.error('Không thể xoá ứng dụng');
    }
  };

  return (
    <>
      <PageHeader
        title={app.name}
        subtitle={`${app.code} · ${app.group?.name ?? ''}`}
        extra={
          <Space>
            <Button icon={<GlobalOutlined />} onClick={() => setWhereOpen(true)}>
              Đang chạy ở đâu?
            </Button>
            <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
              Sửa
            </Button>
            <Popconfirm
              title="Xoá ứng dụng này?"
              description="Hành động không thể hoàn tác"
              onConfirm={handleDelete}
              okType="danger"
            >
              <Button danger>Xoá</Button>
            </Popconfirm>
          </Space>
        }
      />

      <Button
        icon={<ArrowLeftOutlined />}
        type="link"
        style={{ paddingLeft: 0, marginBottom: 16 }}
        onClick={() => navigate('/applications')}
      >
        Quay lại danh sách
      </Button>

      <Tabs
        items={[
          {
            key: 'info',
            label: 'Thông tin',
            children: (
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Mã">{app.code}</Descriptions.Item>
                <Descriptions.Item label="Tên">{app.name}</Descriptions.Item>
                <Descriptions.Item label="Nhóm">{app.group?.name ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <StatusBadge status={app.status} />
                </Descriptions.Item>
                <Descriptions.Item label="Tech Stack" span={2}>{app.tech_stack ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Repo URL" span={2}>
                  {app.repo_url ? (
                    <a href={app.repo_url} target="_blank" rel="noreferrer">{app.repo_url}</a>
                  ) : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả" span={2}>{app.description ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Tạo lúc">
                  {new Date(app.created_at).toLocaleString('vi-VN')}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật">
                  {new Date(app.updated_at).toLocaleString('vi-VN')}
                </Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: 'deployments',
            label: 'Deployments',
            children: (
              <Table
                loading={deplLoading}
                dataSource={deployments?.items ?? []}
                rowKey="id"
                size="small"
                pagination={false}
                onRow={(record) => ({ onClick: () => navigate(`/deployments/${record.id}`) })}
                columns={[
                  {
                    title: 'Môi trường',
                    dataIndex: 'environment',
                    key: 'env',
                    width: 100,
                    render: (env: Environment) => <Tag color={ENV_COLOR[env]}>{env}</Tag>,
                  },
                  {
                    title: 'Version',
                    dataIndex: 'version',
                    key: 'version',
                    width: 120,
                  },
                  {
                    title: 'Server',
                    key: 'server',
                    render: (_: unknown, r: any) => r.server?.name ?? '—',
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    key: 'status',
                    width: 120,
                    render: (s: string) => <StatusBadge status={s} />,
                  },
                  {
                    title: 'Deployed at',
                    dataIndex: 'deployed_at',
                    key: 'deployed_at',
                    width: 160,
                    render: (v?: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
                  },
                ]}
              />
            ),
          },
          {
            key: 'ports',
            label: 'Ports',
            children: <PortTab applicationId={app.id} />,
          },
          {
            key: 'where',
            label: 'Đang chạy ở đâu?',
            children: (
              <>
                {whereLoading && <Skeleton active />}
                {(whereData ?? []).length === 0 && !whereLoading && (
                  <div style={{ color: '#888' }}>Ứng dụng không đang chạy trên môi trường nào</div>
                )}
                {(whereData ?? []).map((env) => (
                  <div key={env.environment} style={{ marginBottom: 16 }}>
                    <Tag color={ENV_COLOR[env.environment]} style={{ marginBottom: 8, fontSize: 14 }}>
                      {env.environment}
                    </Tag>
                    <Table
                      size="small"
                      dataSource={env.servers}
                      rowKey="deployment_id"
                      pagination={false}
                      columns={[
                        { title: 'Server', dataIndex: 'server_name', key: 'server_name' },
                        { title: 'Mã server', dataIndex: 'server_code', key: 'server_code', width: 120 },
                        { title: 'Version', dataIndex: 'version', key: 'version', width: 100 },
                        {
                          title: 'Trạng thái',
                          dataIndex: 'status',
                          key: 'status',
                          width: 120,
                          render: (s: string) => <StatusBadge status={s} />,
                        },
                        {
                          title: '',
                          key: 'link',
                          width: 80,
                          render: (_: unknown, r: any) => (
                            <Button
                              size="small"
                              type="link"
                              onClick={() => navigate(`/deployments/${r.deployment_id}`)}
                            >
                              Chi tiết
                            </Button>
                          ),
                        },
                      ]}
                    />
                  </div>
                ))}
              </>
            ),
          },
          {
            key: 'history',
            label: 'Lịch sử thay đổi',
            children: (
              <ChangeHistoryTimeline
                items={history ?? []}
                loading={historyLoading}
              />
            ),
          },
        ]}
        onChange={(key) => {
          if (key === 'where') setWhereOpen(true);
          if (key === 'history') setHistoryEnabled(true);
        }}
      />

      <ApplicationForm open={editOpen} app={app} onClose={() => setEditOpen(false)} />
    </>
  );
}
