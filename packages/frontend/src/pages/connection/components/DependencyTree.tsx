import { Modal, Skeleton, Tag, Typography, Divider, Empty, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useAppDependencies, useConnectionFirewallCoverage } from '../../../hooks/useConnections';
import type { DependencyItem, FirewallCoverageResult } from '../../../types/connection';
import EnvironmentTag from '../../../components/common/EnvironmentTag';

const { Text } = Typography;

function CoverageBadge({ coverage }: { coverage: FirewallCoverageResult | undefined }) {
  if (!coverage) return null;
  if (coverage.status === 'COVERED')
    return <Tooltip title="Có FirewallRule ALLOW phủ"><Tag color="success" style={{ fontSize: 11 }}>✅ FW</Tag></Tooltip>;
  if (coverage.status === 'UNCOVERED')
    return <Tooltip title="Thiếu FirewallRule ALLOW — cần xin cấp quyền mạng"><Tag color="warning" style={{ fontSize: 11 }}>⚠️ No FW</Tag></Tooltip>;
  return null;
}

function DependencyRow({ item, coverage }: { item: DependencyItem; coverage?: FirewallCoverageResult }) {
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
      <EnvironmentTag code={item.environment} />
      <Tag>{item.connection_type}</Tag>
      <Text strong>{item.app.name}</Text>
      <Text type="secondary" style={{ fontSize: 12 }}>
        ({item.app.code})
      </Text>
      <CoverageBadge coverage={coverage} />
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
  const { data: coverageData } = useConnectionFirewallCoverage(open ? environment : undefined);

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
              <DependencyRow key={item.connection_id} item={item} coverage={coverageData?.[item.connection_id]} />
            ))
          )}

          <Divider orientation="left" style={{ marginTop: 24 }}>
            <ArrowDownOutlined style={{ color: '#1677ff' }} /> Downstream (ứng dụng này phụ thuộc vào)
          </Divider>
          {data.downstream.length === 0 ? (
            <Empty description="Không có downstream" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            data.downstream.map((item) => (
              <DependencyRow key={item.connection_id} item={item} coverage={coverageData?.[item.connection_id]} />
            ))
          )}
        </>
      )}
    </Modal>
  );
}
