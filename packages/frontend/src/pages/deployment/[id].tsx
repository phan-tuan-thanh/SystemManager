import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Tabs, Descriptions, Tag, Space, App, Skeleton,
  Progress, Row, Col, Card, Statistic, Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import DeploymentForm from './components/DeploymentForm';
import DocUploadCard from './components/DocUploadCard';
import { useDeploymentDetail, useDeleteDeployment } from '../../hooks/useDeployments';
import type { Environment } from '../../types/server';

const ENV_COLOR: Record<string, string> = { DEV: 'green', UAT: 'blue', PROD: 'red' };

export default function DeploymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [editOpen, setEditOpen] = useState(false);

  const { data: deployment, isLoading } = useDeploymentDetail(id!);
  const deleteDeployment = useDeleteDeployment();

  if (isLoading) return <Skeleton active />;
  if (!deployment) return <div>Không tìm thấy deployment</div>;

  const handleDelete = async () => {
    try {
      await deleteDeployment.mutateAsync(deployment.id);
      message.success('Đã xoá deployment');
      navigate('/deployments');
    } catch {
      message.error('Không thể xoá deployment');
    }
  };

  const { doc_progress: progress } = deployment;

  return (
    <>
      <PageHeader
        title={deployment.title ?? `${deployment.application?.code} — v${deployment.version}`}
        subtitle={
          <Space>
            <Tag color={ENV_COLOR[deployment.environment as Environment]}>{deployment.environment}</Tag>
            <span>{deployment.server?.name}</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>Sửa</Button>
            <Popconfirm
              title="Xoá deployment này?"
              description="Hành động không thể hoàn tác"
              onConfirm={handleDelete}
              okType="danger"
            >
              <Button danger icon={<DeleteOutlined />}>Xoá</Button>
            </Popconfirm>
          </Space>
        }
      />

      <Button
        icon={<ArrowLeftOutlined />}
        type="link"
        style={{ paddingLeft: 0, marginBottom: 16 }}
        onClick={() => navigate('/deployments')}
      >
        Quay lại danh sách
      </Button>

      <Tabs
        items={[
          {
            key: 'info',
            label: 'Thông tin',
            children: (
              <>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic title="Tổng tài liệu" value={progress.total} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic title="Hoàn thành" value={progress.complete} valueStyle={{ color: '#52c41a' }} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic title="Được miễn" value={progress.waived} valueStyle={{ color: '#faad14' }} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic title="Chờ xử lý" value={progress.pending} valueStyle={{ color: '#ff4d4f' }} />
                    </Card>
                  </Col>
                </Row>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ marginBottom: 4, fontWeight: 500 }}>
                    Tiến độ tài liệu — {progress.pct}%
                  </div>
                  <Progress
                    percent={progress.pct}
                    status={progress.pct === 100 ? 'success' : 'active'}
                    strokeColor={{ from: '#108ee9', to: '#87d068' }}
                  />
                </div>

                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Ứng dụng">
                    <Button
                      type="link"
                      style={{ padding: 0 }}
                      onClick={() => navigate(`/applications/${deployment.application?.id}`)}
                    >
                      {deployment.application?.name}
                    </Button>
                  </Descriptions.Item>
                  <Descriptions.Item label="Server">
                    <Button
                      type="link"
                      style={{ padding: 0 }}
                      onClick={() => navigate(`/servers/${deployment.server?.id}`)}
                    >
                      {deployment.server?.name}
                    </Button>
                  </Descriptions.Item>
                  <Descriptions.Item label="Môi trường">
                    <Tag color={ENV_COLOR[deployment.environment as Environment]}>{deployment.environment}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Version">{deployment.version}</Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <StatusBadge status={deployment.status} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Nhóm ứng dụng">{deployment.application?.group?.name ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="CMC Name">{deployment.cmc_name ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Deployer">{deployment.deployer ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Ngày triển khai">
                    {deployment.deployed_at ? new Date(deployment.deployed_at).toLocaleDateString('vi-VN') : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày kế hoạch">
                    {deployment.planned_at ? new Date(deployment.planned_at).toLocaleDateString('vi-VN') : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tạo lúc">
                    {new Date(deployment.created_at).toLocaleString('vi-VN')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Cập nhật">
                    {new Date(deployment.updated_at).toLocaleString('vi-VN')}
                  </Descriptions.Item>
                </Descriptions>
              </>
            ),
          },
          {
            key: 'docs',
            label: `Tài liệu (${progress.complete + progress.waived}/${progress.total})`,
            children: (
              <>
                {deployment.docs.length === 0 ? (
                  <div style={{ color: '#888', textAlign: 'center', padding: 32 }}>
                    Không có tài liệu nào được yêu cầu cho deployment này
                  </div>
                ) : (
                  deployment.docs.map((doc) => (
                    <DocUploadCard key={doc.id} deploymentId={deployment.id} doc={doc} />
                  ))
                )}
              </>
            ),
          },
          {
            key: 'ports',
            label: 'Ports',
            children: (
              deployment.ports.length === 0 ? (
                <div style={{ color: '#888' }}>Không có port nào được cấu hình</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fafafa' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #f0f0f0' }}>Port</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #f0f0f0' }}>Protocol</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #f0f0f0' }}>Mô tả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deployment.ports.map((p) => (
                      <tr key={p.id}>
                        <td style={{ padding: '8px 12px', border: '1px solid #f0f0f0' }}><strong>{p.port_number}</strong></td>
                        <td style={{ padding: '8px 12px', border: '1px solid #f0f0f0' }}>
                          <Tag color={p.protocol === 'TCP' ? 'blue' : 'orange'}>{p.protocol}</Tag>
                        </td>
                        <td style={{ padding: '8px 12px', border: '1px solid #f0f0f0' }}>{p.description ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ),
          },
        ]}
      />

      <DeploymentForm open={editOpen} deployment={deployment} onClose={() => setEditOpen(false)} />
    </>
  );
}
