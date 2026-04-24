import { Drawer, Descriptions, Tag, Typography, Button, Space, Divider } from 'antd';
import { CloseOutlined, LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface ServerInfo {
  type: 'server';
  id: string;
  name: string;
  code: string;
  hostname: string;
  purpose: string;
  status: string;
  environment: string;
  infra_type: string;
  site: string;
  description?: string;
  deployments: Array<{
    id: string;
    version: string;
    status: string;
    application: { id: string; name: string; code: string };
  }>;
  networkConfigs: Array<{
    id: string;
    private_ip?: string;
    public_ip?: string;
    domain?: string;
  }>;
}

interface AppInfo {
  type: 'app';
  id: string;
  name: string;
  code: string;
  version?: string;
  groupName?: string;
  deploymentStatus: string;
  environment: string;
  serverName?: string;
  deploymentId?: string;
}

type NodeInfo = ServerInfo | AppInfo;

interface Props {
  node: NodeInfo | null;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'success', INACTIVE: 'error', MAINTENANCE: 'warning',
  RUNNING: 'success', STOPPED: 'error', DEPRECATED: 'default',
};

export default function NodeDetailPanel({ node, onClose }: Props) {
  const navigate = useNavigate();

  if (!node) return null;

  return (
    <Drawer
      title={
        <Space>
          <Text strong>{node.name}</Text>
          <Tag color="blue">{node.type === 'server' ? 'Server' : 'Application'}</Tag>
        </Space>
      }
      placement="right"
      width={360}
      open={!!node}
      onClose={onClose}
      closeIcon={<CloseOutlined />}
      mask={false}
      style={{ position: 'absolute' }}
    >
      {node.type === 'server' ? (
        <>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Code">{node.code}</Descriptions.Item>
            <Descriptions.Item label="Hostname">{node.hostname}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[node.status]}>{node.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Environment">{node.environment}</Descriptions.Item>
            <Descriptions.Item label="Purpose">{node.purpose.replace('_', ' ')}</Descriptions.Item>
            <Descriptions.Item label="Infra Type">{node.infra_type.replace('_', ' ')}</Descriptions.Item>
            <Descriptions.Item label="Site">{node.site}</Descriptions.Item>
            {node.description && (
              <Descriptions.Item label="Description">{node.description}</Descriptions.Item>
            )}
          </Descriptions>

          {node.networkConfigs.length > 0 && (
            <>
              <Divider orientation="left" plain>Network</Divider>
              {node.networkConfigs.map((n) => (
                <div key={n.id} style={{ marginBottom: 6, fontSize: 13 }}>
                  {n.private_ip && <div>Private IP: <Text code>{n.private_ip}</Text></div>}
                  {n.public_ip && <div>Public IP: <Text code>{n.public_ip}</Text></div>}
                  {n.domain && <div>Domain: <Text code>{n.domain}</Text></div>}
                </div>
              ))}
            </>
          )}

          {node.deployments.length > 0 && (
            <>
              <Divider orientation="left" plain>Applications ({node.deployments.length})</Divider>
              {node.deployments.map((d) => (
                <div key={d.id} style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13 }}>{d.application.name}</span>
                  <Space>
                    <Tag color={statusColors[d.status]}>{d.status}</Tag>
                    <Button
                      size="small"
                      icon={<LinkOutlined />}
                      onClick={() => navigate(`/applications/${d.application.id}`)}
                    />
                  </Space>
                </div>
              ))}
            </>
          )}

          <Divider />
          <Button
            block
            icon={<LinkOutlined />}
            onClick={() => navigate(`/servers/${node.id}`)}
          >
            View Server Detail
          </Button>
        </>
      ) : (
        <>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Code">{node.code}</Descriptions.Item>
            {node.groupName && (
              <Descriptions.Item label="Group">{node.groupName}</Descriptions.Item>
            )}
            {node.version && (
              <Descriptions.Item label="Version">v{node.version}</Descriptions.Item>
            )}
            <Descriptions.Item label="Status">
              <Tag color={statusColors[node.deploymentStatus]}>{node.deploymentStatus}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Environment">{node.environment}</Descriptions.Item>
            {node.serverName && (
              <Descriptions.Item label="Server">{node.serverName}</Descriptions.Item>
            )}
          </Descriptions>

          <Divider />
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              block
              icon={<LinkOutlined />}
              onClick={() => navigate(`/applications/${node.id}`)}
            >
              View Application Detail
            </Button>
            {node.deploymentId && (
              <Button
                block
                icon={<LinkOutlined />}
                onClick={() => navigate(`/deployments/${node.deploymentId}`)}
              >
                View Deployment Detail
              </Button>
            )}
          </Space>
        </>
      )}
    </Drawer>
  );
}
