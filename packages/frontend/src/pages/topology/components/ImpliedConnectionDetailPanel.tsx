import { Drawer, Descriptions, Tag, Typography, Space, Badge } from 'antd';
import { CloseOutlined, FireOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { ImpliedConnectionEdge, ServerNode } from '../hooks/useTopology';

const { Text } = Typography;

interface Props {
  connection: ImpliedConnectionEdge | null;
  servers?: ServerNode[];
  onClose: () => void;
}

export default function ImpliedConnectionDetailPanel({ connection, servers = [], onClose }: Props) {
  if (!connection) return null;

  const isAllow = connection.action === 'ALLOW';
  const actionColor = isAllow ? '#389e0d' : '#cf1322';

  const srcServer = servers.find((s) => s.id === connection.sourceServerId);
  const tgtServer = servers.find((s) => s.id === connection.targetServerId);

  const portNum = (connection.targetPort as any)?.port_number ?? connection.targetPort?.portNumber;
  const portLabel = portNum
    ? `${portNum}/${(connection.targetPort as any)?.protocol ?? ''}`
    : null;

  return (
    <Drawer
      title={
        <Space>
          <FireOutlined style={{ color: actionColor }} />
          <Text strong>Firewall Rule</Text>
          <Tag color={isAllow ? 'success' : 'error'}>{connection.action}</Tag>
        </Space>
      }
      placement="right"
      width={380}
      open={!!connection}
      onClose={onClose}
      closeIcon={<CloseOutlined />}
      mask={false}
      style={{ position: 'absolute' }}
    >
      {/* Action badge */}
      <div
        style={{
          background: isAllow ? '#f6ffed' : '#fff1f0',
          border: `1px solid ${isAllow ? '#b7eb8f' : '#ffa39e'}`,
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Badge color={actionColor} />
        <Text strong style={{ color: actionColor }}>
          {isAllow ? 'Traffic ALLOWED by firewall rule' : 'Traffic DENIED by firewall rule'}
        </Text>
      </div>

      {/* Source → Target flow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px',
          background: '#fafafa',
          borderRadius: 6,
          marginBottom: 16,
        }}
      >
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Source App</Text>
          <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{connection.sourceAppName}</div>
          {srcServer && (
            <Text type="secondary" style={{ fontSize: 11 }}>on {srcServer.name}</Text>
          )}
        </div>
        <ArrowRightOutlined style={{ color: actionColor, fontSize: 16, margin: '0 8px' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Target App</Text>
          <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{connection.targetAppName}</div>
          {tgtServer && (
            <Text type="secondary" style={{ fontSize: 11 }}>on {tgtServer.name}</Text>
          )}
        </div>
      </div>

      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="Firewall Rule">
          <Text strong>{connection.firewallRuleName}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Action">
          <Tag color={isAllow ? 'success' : 'error'}>{connection.action}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Environment">
          <Tag>{connection.environment}</Tag>
        </Descriptions.Item>
        {portLabel && (
          <Descriptions.Item label="Destination Port">
            <Text code>{portLabel}</Text>
          </Descriptions.Item>
        )}
        {srcServer && (
          <Descriptions.Item label="Source Server">
            <Text>{srcServer.name}</Text>
            {srcServer.networkConfigs[0]?.private_ip && (
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
                ({srcServer.networkConfigs[0].private_ip})
              </Text>
            )}
          </Descriptions.Item>
        )}
        {tgtServer && (
          <Descriptions.Item label="Target Server">
            <Text>{tgtServer.name}</Text>
            {tgtServer.networkConfigs[0]?.private_ip && (
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
                ({tgtServer.networkConfigs[0].private_ip})
              </Text>
            )}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Drawer>
  );
}
