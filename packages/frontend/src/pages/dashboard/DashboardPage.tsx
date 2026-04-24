import { Row, Col, Card, Statistic, Button, List, Tag, Skeleton, Progress } from 'antd';
import {
  CloudServerOutlined,
  AppstoreOutlined,
  DeploymentUnitOutlined,
  ApiOutlined,
  ClusterOutlined,
  RightOutlined,
  ShareAltOutlined,
  AuditOutlined,
  SettingOutlined,
  WarningOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import type { ApiResponse } from '../../types/auth';
import PageHeader from '../../components/common/PageHeader';
import AlertPanel from './components/AlertPanel';

interface SystemStatus {
  initialized: boolean;
  hasAdmin: boolean;
  moduleCount: number;
  groupCount: number;
  serverCount: number;
  applicationCount: number;
  deploymentCount: number;
  connectionCount: number;
  infraSystemCount: number;
  serversByEnv: { environment: string; count: number }[];
  deploymentsByStatus: { status: string; count: number }[];
}

interface RecentChange {
  id: string;
  resource_type: string;
  resource_id: string;
  changed_by: string | null;
  created_at: string;
  snapshot: { action?: string; name?: string; code?: string };
}

const ENV_COLORS: Record<string, string> = {
  DEV: 'blue',
  UAT: 'orange',
  PROD: 'red',
};

const STATUS_COLORS: Record<string, string> = {
  RUNNING: '#52c41a',
  STOPPED: '#ff4d4f',
  DEPLOYING: '#faad14',
  FAILED: '#ff4d4f',
};

const quickLinks = [
  { label: 'Hệ thống', path: '/infra-systems', icon: <ClusterOutlined />, desc: 'Quản lý hệ thống hạ tầng' },
  { label: 'Servers', path: '/servers', icon: <CloudServerOutlined />, desc: 'Quản lý server' },
  { label: 'Ứng dụng', path: '/applications', icon: <AppstoreOutlined />, desc: 'Quản lý ứng dụng' },
  { label: 'Deployments', path: '/deployments', icon: <DeploymentUnitOutlined />, desc: 'Quản lý triển khai' },
  { label: 'Topology', path: '/topology', icon: <ShareAltOutlined />, desc: 'Sơ đồ kết nối hệ thống' },
  { label: 'Audit Log', path: '/audit-logs', icon: <AuditOutlined />, desc: 'Nhật ký hoạt động' },
  { label: 'Quản trị', path: '/admin/modules', icon: <SettingOutlined />, desc: 'Cấu hình modules, users' },
];

export default function DashboardPage() {
  const { data: status, isLoading } = useQuery<SystemStatus>({
    queryKey: ['system-status'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<SystemStatus>>('/system/status');
      return data.data;
    },
    staleTime: 30_000,
  });

  const { data: recentChanges, isLoading: changesLoading } = useQuery<RecentChange[]>({
    queryKey: ['recent-changes'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<RecentChange[]>>('/audit-logs?limit=8&sortOrder=desc');
      return data.data;
    },
    staleTime: 60_000,
  });

  const totalServers = status?.serverCount ?? 0;

  return (
    <div>
      <PageHeader title="Dashboard" helpKey="dashboard" />

      {/* Stat Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={4}>
          <Card hoverable onClick={() => {}}>
            <Link to="/infra-systems" style={{ color: 'inherit' }}>
              {isLoading ? <Skeleton active paragraph={false} /> : (
                <Statistic
                  title="Hệ thống"
                  value={status?.infraSystemCount ?? 0}
                  prefix={<ClusterOutlined />}
                  valueStyle={{ color: '#13c2c2' }}
                />
              )}
            </Link>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card hoverable>
            <Link to="/servers" style={{ color: 'inherit' }}>
              {isLoading ? <Skeleton active paragraph={false} /> : (
                <Statistic
                  title="Servers"
                  value={status?.serverCount ?? 0}
                  prefix={<CloudServerOutlined />}
                  valueStyle={{ color: '#1677ff' }}
                />
              )}
            </Link>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card hoverable>
            <Link to="/applications" style={{ color: 'inherit' }}>
              {isLoading ? <Skeleton active paragraph={false} /> : (
                <Statistic
                  title="Ứng dụng"
                  value={status?.applicationCount ?? 0}
                  prefix={<AppstoreOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              )}
            </Link>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card hoverable>
            <Link to="/deployments" style={{ color: 'inherit' }}>
              {isLoading ? <Skeleton active paragraph={false} /> : (
                <Statistic
                  title="Deployments"
                  value={status?.deploymentCount ?? 0}
                  prefix={<DeploymentUnitOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              )}
            </Link>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card hoverable>
            <Link to="/connections" style={{ color: 'inherit' }}>
              {isLoading ? <Skeleton active paragraph={false} /> : (
                <Statistic
                  title="Connections"
                  value={status?.connectionCount ?? 0}
                  prefix={<ApiOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              )}
            </Link>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card hoverable>
            <Link to="/admin/modules" style={{ color: 'inherit' }}>
              {isLoading ? <Skeleton active paragraph={false} /> : (
                <Statistic
                  title="Modules"
                  value={status?.moduleCount ?? 0}
                  prefix={<SettingOutlined />}
                  valueStyle={{ color: '#8c8c8c' }}
                />
              )}
            </Link>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* Server by Environment */}
        <Col xs={24} md={8}>
          <Card title="Servers theo môi trường" size="small">
            {isLoading ? <Skeleton active /> : (
              <div>
                {(status?.serversByEnv ?? []).map(({ environment, count }) => (
                  <div key={environment} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Tag color={ENV_COLORS[environment] ?? 'default'}>{environment}</Tag>
                      <span>{count} server{count !== 1 ? 's' : ''}</span>
                    </div>
                    <Progress
                      percent={totalServers > 0 ? Math.round((count / totalServers) * 100) : 0}
                      showInfo={false}
                      strokeColor={ENV_COLORS[environment] === 'red' ? '#ff4d4f' : ENV_COLORS[environment] === 'orange' ? '#faad14' : '#1677ff'}
                      size="small"
                    />
                  </div>
                ))}
                {(status?.serversByEnv ?? []).length === 0 && (
                  <div style={{ color: '#bbb', textAlign: 'center', padding: 16 }}>Chưa có server</div>
                )}
              </div>
            )}
          </Card>
        </Col>

        {/* Deployment Status */}
        <Col xs={24} md={8}>
          <Card title="Trạng thái Deployment" size="small">
            {isLoading ? <Skeleton active /> : (
              <div>
                {(status?.deploymentsByStatus ?? []).map(({ status: st, count }) => (
                  <div key={st} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        backgroundColor: STATUS_COLORS[st] ?? '#8c8c8c',
                        display: 'inline-block',
                      }} />
                      {st}
                    </span>
                    <strong>{count}</strong>
                  </div>
                ))}
                {(status?.deploymentsByStatus ?? []).length === 0 && (
                  <div style={{ color: '#bbb', textAlign: 'center', padding: 16 }}>Chưa có deployment</div>
                )}
              </div>
            )}
          </Card>
        </Col>

        {/* Quick Links */}
        <Col xs={24} md={8}>
          <Card title="Truy cập nhanh" size="small">
            <List
              size="small"
              dataSource={quickLinks}
              renderItem={(item) => (
                <List.Item
                  style={{ padding: '8px 0' }}
                  actions={[
                    <Link to={item.path} key="go">
                      <Button type="link" size="small" icon={<RightOutlined />} />
                    </Link>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<span style={{ fontSize: 16, color: '#1677ff' }}>{item.icon}</span>}
                    title={<Link to={item.path} style={{ fontSize: 13 }}>{item.label}</Link>}
                    description={<span style={{ fontSize: 12 }}>{item.desc}</span>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts & Recent Changes */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card
            title={<span><WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />System Alerts</span>}
            size="small"
            extra={<Link to="/system-software" style={{ fontSize: 12 }}>View all</Link>}
          >
            <AlertPanel />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={<span><HistoryOutlined style={{ color: '#1677ff', marginRight: 8 }} />Recent Changes</span>}
            size="small"
            extra={<Link to="/audit-logs" style={{ fontSize: 12 }}>View all</Link>}
          >
            {changesLoading ? (
              <Skeleton active />
            ) : (recentChanges ?? []).length === 0 ? (
              <div style={{ color: '#bbb', textAlign: 'center', padding: 16 }}>No recent changes</div>
            ) : (
              <List
                size="small"
                dataSource={recentChanges ?? []}
                renderItem={(change) => (
                  <List.Item style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <div>
                        <Tag color="blue" style={{ fontSize: 11 }}>{change.resource_type.replace(/_/g, ' ')}</Tag>
                        <span style={{ fontSize: 12 }}>
                          {(change.snapshot as any)?.name || (change.snapshot as any)?.code || change.resource_id?.slice(0, 8) || '—'}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                        {new Date(change.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
