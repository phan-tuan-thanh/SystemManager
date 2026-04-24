import { Drawer, Descriptions, Tag, Typography, Space, Divider, Button, Popconfirm } from 'antd';
import { CloseOutlined, ApiOutlined, ArrowRightOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ConnectionEdge } from '../hooks/useTopology';

const { Text } = Typography;

const protocolColors: Record<string, string> = {
  HTTP: 'blue',
  HTTPS: 'green',
  TCP: 'orange',
  GRPC: 'purple',
  AMQP: 'magenta',
  KAFKA: 'cyan',
  DATABASE: 'red',
};

interface Props {
  connection: ConnectionEdge | null;
  onClose: () => void;
  onDelete?: (connection: ConnectionEdge) => void;
  deleting?: boolean;
}

export default function ConnectionDetailPanel({ connection, onClose, onDelete, deleting }: Props) {
  if (!connection) return null;

  const portLabel = connection.targetPort
    ? `${connection.targetPort.port_number}/${connection.targetPort.protocol}`
    : null;

  return (
    <Drawer
      title={
        <Space>
          <ApiOutlined />
          <Text strong>Kết nối</Text>
          <Tag color={protocolColors[connection.connectionType] ?? 'default'}>
            {connection.connectionType}
          </Tag>
        </Space>
      }
      placement="right"
      width={360}
      open={!!connection}
      onClose={onClose}
      closeIcon={<CloseOutlined />}
      mask={false}
      style={{ position: 'absolute' }}
    >
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
          <Text type="secondary" style={{ fontSize: 11 }}>Source</Text>
          <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>
            {connection.sourceAppName}
          </div>
        </div>
        <ArrowRightOutlined style={{ color: '#1677ff', fontSize: 16, margin: '0 8px' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Target</Text>
          <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>
            {connection.targetAppName}
          </div>
        </div>
      </div>

      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="Protocol">
          <Tag color={protocolColors[connection.connectionType] ?? 'default'}>
            {connection.connectionType}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Environment">
          <Tag>{connection.environment}</Tag>
        </Descriptions.Item>
        {portLabel && (
          <Descriptions.Item label="Port">
            <Text code>{portLabel}</Text>
            {connection.targetPort?.service_name && (
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                ({connection.targetPort.service_name})
              </Text>
            )}
          </Descriptions.Item>
        )}
        {!portLabel && (
          <Descriptions.Item label="Port">
            <Text type="secondary" style={{ fontSize: 12 }}>Chưa chỉ định</Text>
          </Descriptions.Item>
        )}
        {connection.description && (
          <Descriptions.Item label="Description">
            {connection.description}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Divider />
      <Text type="secondary" style={{ fontSize: 12 }}>
        ID: <Text code style={{ fontSize: 11 }}>{connection.id}</Text>
      </Text>

      {onDelete && (
        <div style={{ marginTop: 24 }}>
          <Popconfirm
            title="Xoá kết nối?"
            description="Bạn có chắc chắn muốn xoá kết nối này?"
            okText="Xoá"
            okType="danger"
            cancelText="Huỷ"
            onConfirm={() => onDelete(connection)}
          >
            <Button danger block icon={<DeleteOutlined />} loading={deleting}>
              Xoá kết nối
            </Button>
          </Popconfirm>
        </div>
      )}
    </Drawer>
  );
}
