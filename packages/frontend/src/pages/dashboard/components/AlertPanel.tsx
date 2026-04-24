import { List, Tag, Skeleton, Alert, Badge, Typography, Space } from 'antd';
import {
  WarningOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../../../api/client';
import type { ApiResponse } from '../../../types/auth';

interface SystemAlert {
  id: string;
  type: 'OS_EOL' | 'PORT_CONFLICT' | 'DEPLOYMENT_STOPPED';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  resource_type: string;
  resource_id: string;
  resource_name: string;
}

const SEVERITY_CONFIG = {
  HIGH:   { color: 'error',   icon: <CloseCircleOutlined />,      tag: 'red' },
  MEDIUM: { color: 'warning', icon: <ExclamationCircleOutlined />, tag: 'orange' },
  LOW:    { color: 'info',    icon: <InfoCircleOutlined />,        tag: 'blue' },
};

const TYPE_PATHS: Record<string, string> = {
  SYSTEM_SOFTWARE: '/system-software',
  PORT: '/servers',
  DEPLOYMENT: '/deployments',
};

export default function AlertPanel() {
  const { data: alerts, isLoading } = useQuery<SystemAlert[]>({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<SystemAlert[]>>('/alerts');
      return data.data;
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60 * 1000,
  });

  if (isLoading) return <Skeleton active />;
  if (!alerts?.length) {
    return (
      <Alert
        type="success"
        showIcon
        message="No active alerts"
        description="All systems are operating normally."
      />
    );
  }

  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;
  const medCount = alerts.filter((a) => a.severity === 'MEDIUM').length;

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        {highCount > 0 && <Badge count={highCount} color="red"><Tag icon={<WarningOutlined />} color="red">{highCount} Critical</Tag></Badge>}
        {medCount > 0 && <Tag icon={<ExclamationCircleOutlined />} color="orange">{medCount} Warning</Tag>}
      </Space>

      <List
        size="small"
        dataSource={alerts.slice(0, 8)}
        renderItem={(alert) => {
          const cfg = SEVERITY_CONFIG[alert.severity];
          const path = TYPE_PATHS[alert.resource_type] || '/dashboard';
          return (
            <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <List.Item.Meta
                avatar={<span style={{ color: alert.severity === 'HIGH' ? '#ff4d4f' : alert.severity === 'MEDIUM' ? '#faad14' : '#1677ff', fontSize: 16 }}>{cfg.icon}</span>}
                title={
                  <Space>
                    <Tag color={cfg.tag} style={{ margin: 0, fontSize: 11 }}>{alert.severity}</Tag>
                    <Typography.Text style={{ fontSize: 13 }}>{alert.title}</Typography.Text>
                  </Space>
                }
                description={
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {alert.message}{' '}
                    <Link to={path} style={{ fontSize: 12 }}>View</Link>
                  </Typography.Text>
                }
              />
            </List.Item>
          );
        }}
      />
      {alerts.length > 8 && (
        <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
          +{alerts.length - 8} more alerts
        </Typography.Text>
      )}
    </div>
  );
}
