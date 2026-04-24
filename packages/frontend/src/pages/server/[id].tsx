import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tabs, Descriptions, Tag, Button, App, Skeleton, Typography, Space, Table,
} from 'antd';
import { EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import ChangeHistoryTimeline from '../../components/common/ChangeHistoryTimeline';
import HardwareTab from './components/HardwareTab';
import NetworkTab from './components/NetworkTab';
import OsLifecycleTab from './components/OsLifecycleTab';
import ServerForm from './components/ServerForm';
import { useServerDetail, useServerChangeHistory } from '../../hooks/useServers';
import type { Server } from '../../types/server';

const { Text } = Typography;

const ENV_COLOR: Record<string, string> = { DEV: 'blue', UAT: 'orange', PROD: 'red' };
const DEPLOY_STATUS_COLOR: Record<string, string> = {
  RUNNING: 'green',
  STOPPED: 'default',
  DEPRECATED: 'red',
};

export default function ServerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('info');
  const [editOpen, setEditOpen] = useState(false);

  const { data: server, isLoading } = useServerDetail(id!);
  const { data: history, isLoading: historyLoading } = useServerChangeHistory(id!, activeTab === 'history');

  if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (!server) { message.error('Không tìm thấy server'); return null; }

  const deployColumns: ColumnsType<Server['id'] extends string ? NonNullable<typeof server>['app_deployments'][number] : never> = [
    { title: 'Ứng dụng', dataIndex: ['application', 'name'], key: 'app' },
    { title: 'Version', dataIndex: 'version', key: 'version' },
    {
      title: 'Môi trường',
      dataIndex: 'environment',
      key: 'env',
      render: (e: string) => <Tag color={ENV_COLOR[e]}>{e}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={DEPLOY_STATUS_COLOR[s] ?? 'default'}>{s}</Tag>,
    },
  ];

  const tabs = [
    {
      key: 'info',
      label: 'Thông tin',
      children: (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Mã server">{server.code}</Descriptions.Item>
          <Descriptions.Item label="Hostname">{server.hostname}</Descriptions.Item>
          <Descriptions.Item label="Môi trường">
            <Tag color={ENV_COLOR[server.environment]}>{server.environment}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <StatusBadge status={server.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Mục đích">{server.purpose}</Descriptions.Item>
          <Descriptions.Item label="Loại hạ tầng">{server.infra_type}</Descriptions.Item>
          <Descriptions.Item label="Site">{server.site}</Descriptions.Item>
          <Descriptions.Item label="Hệ điều hành">
            <Tag color="cyan">{server.os_display || 'Chưa xác định'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật lần cuối">
            {new Date(server.updated_at).toLocaleString('vi-VN')}
          </Descriptions.Item>
          {server.description && (
            <Descriptions.Item label="Mô tả" span={2}>{server.description}</Descriptions.Item>
          )}
        </Descriptions>
      ),
    },
    {
      key: 'os_lifecycle',
      label: 'Vòng đời OS',
      children: <OsLifecycleTab serverId={server.id} />,
    },
    {
      key: 'hardware',
      label: `Phần cứng (${server.hardware_components?.length ?? 0})`,
      children: <HardwareTab serverId={server.id} />,
    },
    {
      key: 'network',
      label: `Network (${server.network_configs?.length ?? 0})`,
      children: <NetworkTab serverId={server.id} />,
    },
    {
      key: 'apps',
      label: `Ứng dụng (${server.app_deployments?.length ?? 0})`,
      children: (
        <Table
          rowKey="id"
          dataSource={server.app_deployments}
          columns={deployColumns as ColumnsType<NonNullable<typeof server>['app_deployments'][number]>}
          pagination={false}
          size="small"
        />
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
  ];

  return (
    <App>
      <PageHeader
        title={server.name}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Servers', path: '/servers' },
          { label: server.name },
        ]}
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/servers')}>
              Quay lại
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
              Chỉnh sửa
            </Button>
          </Space>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <Space>
          <Text type="secondary">Mã:</Text>
          <Text strong>{server.code}</Text>
          <Tag color={ENV_COLOR[server.environment]}>{server.environment}</Tag>
          <StatusBadge status={server.status} />
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabs}
        type="card"
      />

      <ServerForm open={editOpen} onClose={() => setEditOpen(false)} initial={server as unknown as Server} />
    </App>
  );
}
