import { Modal, Skeleton, Tag, Typography, Divider, Empty } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useAppDependencies } from '../../../hooks/useConnections';
import type { DependencyItem } from '../../../types/connection';

const { Text } = Typography;

const ENV_COLOR: Record<string, string> = { DEV: 'green', UAT: 'blue', PROD: 'red' };

function DependencyRow({ item }: { item: DependencyItem }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 0',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Tag color={ENV_COLOR[item.environment]}>{item.environment}</Tag>
      <Tag>{item.connection_type}</Tag>
      <Text strong>{item.app.name}</Text>
      <Text type="secondary" style={{ fontSize: 12 }}>
        ({item.app.code})
      </Text>
      {item.description && (
        <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
          {item.description}
        </Text>
      )}
    </div>
  );
}

interface Props {
  applicationId: string | null;
  applicationName?: string;
  environment?: string;
  open: boolean;
  onClose: () => void;
}

export default function DependencyTree({
  applicationId,
  applicationName,
  environment,
  open,
  onClose,
}: Props) {
  const { data, isLoading } = useAppDependencies(
    open ? applicationId : null,
    environment,
  );

  return (
    <Modal
      title={`Dependency Map — ${applicationName ?? ''}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : !data ? null : (
        <>
          <Divider orientation="left">
            <ArrowUpOutlined style={{ color: '#52c41a' }} /> Upstream (phụ thuộc vào ứng dụng này)
          </Divider>
          {data.upstream.length === 0 ? (
            <Empty description="Không có upstream" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            data.upstream.map((item) => (
              <DependencyRow key={item.connection_id} item={item} />
            ))
          )}

          <Divider orientation="left" style={{ marginTop: 24 }}>
            <ArrowDownOutlined style={{ color: '#1677ff' }} /> Downstream (ứng dụng này phụ thuộc vào)
          </Divider>
          {data.downstream.length === 0 ? (
            <Empty description="Không có downstream" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            data.downstream.map((item) => (
              <DependencyRow key={item.connection_id} item={item} />
            ))
          )}
        </>
      )}
    </Modal>
  );
}
