import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Alert, Button, Space, Tag, Typography, Divider, Row, Col, Card, Badge, List, Skeleton } from 'antd';
import {
  ArrowLeftOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import type { PreviewResult, ConflictWarning } from './hooks/useChangeSets';
import { usePreviewChangeSet, useApplyChangeSet, useChangeSetDetail } from './hooks/useChangeSets';
import { message, Modal } from 'antd';

const { Text, Title } = Typography;

const CHANGE_STATUS_COLOR: Record<string, string> = {
  NEW: '#52c41a',
  MODIFIED: '#faad14',
  DELETED: '#ff4d4f',
  UNCHANGED: '#d9d9d9',
};

const CHANGE_STATUS_LABEL: Record<string, string> = {
  NEW: 'NEW',
  MODIFIED: 'MODIFIED',
  DELETED: 'DELETED',
  UNCHANGED: 'UNCHANGED',
};

const CONFLICT_ICON: Record<string, React.ReactNode> = {
  ERROR: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  WARNING: <WarningOutlined style={{ color: '#faad14' }} />,
};

function ResourceNode({ item, type }: { item: any; type: string }) {
  const status = item._change_status ?? 'UNCHANGED';
  const color = CHANGE_STATUS_COLOR[status] ?? '#d9d9d9';
  const label = item.name ?? item.title ?? item.code ?? item.id?.slice(0, 8) ?? '—';

  return (
    <div
      style={{
        border: `2px solid ${color}`,
        borderRadius: 8,
        padding: '8px 12px',
        background: status === 'UNCHANGED' ? '#fafafa' : `${color}15`,
        marginBottom: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Space>
        <Text strong>{label}</Text>
        {item.environment && <Tag>{item.environment}</Tag>}
        {item.status && <Tag>{item.status}</Tag>}
      </Space>
      {status !== 'UNCHANGED' && (
        <Tag color={color} style={{ color: '#fff', fontWeight: 600 }}>
          {CHANGE_STATUS_LABEL[status]}
        </Tag>
      )}
    </div>
  );
}

function ConflictPanel({ conflicts }: { conflicts: ConflictWarning[] }) {
  if (conflicts.length === 0) {
    return (
      <Alert
        type="success"
        icon={<CheckCircleOutlined />}
        message="No conflicts detected"
        description="All changes are valid. You can safely apply this ChangeSet."
        showIcon
      />
    );
  }

  const errors = conflicts.filter((c) => c.severity === 'ERROR');
  const warnings = conflicts.filter((c) => c.severity === 'WARNING');

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {errors.length > 0 && (
        <Alert
          type="error"
          message={`${errors.length} fatal conflict(s) — Apply is DISABLED until resolved`}
          showIcon
        />
      )}
      {warnings.length > 0 && (
        <Alert
          type="warning"
          message={`${warnings.length} warning(s) — Apply is allowed but review recommended`}
          showIcon
        />
      )}
      <List
        size="small"
        dataSource={conflicts}
        renderItem={(c) => (
          <List.Item>
            <Space>
              {CONFLICT_ICON[c.severity]}
              <div>
                <Text strong>{c.type.replace(/_/g, ' ')}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>{c.message}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Affected: {c.affected_resources.map((r) => r.slice(0, 8)).join(', ')}
                </Text>
              </div>
            </Space>
          </List.Item>
        )}
      />
    </Space>
  );
}

export default function ChangeSetPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [applyOpen, setApplyOpen] = useState(false);
  const [rerunning, setRerunning] = useState(false);

  const locationState = location.state as { previewResult?: PreviewResult } | null;
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(
    locationState?.previewResult ?? null,
  );

  const { data: cs } = useChangeSetDetail(id);
  const previewMut = usePreviewChangeSet();
  const applyMut = useApplyChangeSet();

  const hasFatalConflicts = previewResult?.has_fatal_conflicts ?? false;

  async function handleRerunPreview() {
    setRerunning(true);
    try {
      const result = await previewMut.mutateAsync(id!);
      setPreviewResult(result);
    } catch {
      message.error('Preview failed');
    } finally {
      setRerunning(false);
    }
  }

  async function handleApply() {
    try {
      await applyMut.mutateAsync(id!);
      message.success('ChangeSet applied successfully');
      setApplyOpen(false);
      navigate('/changesets');
    } catch (err: any) {
      message.error('Failed to apply ChangeSet — check for conflicts');
      setApplyOpen(false);
    }
  }

  if (!previewResult && !rerunning) {
    return (
      <div>
        <PageHeader
          title={<Space><Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(`/changesets/${id}`)} /> Preview</Space>}
        />
        <Alert
          type="info"
          message="No preview data"
          description="Preview data was not passed. Click 'Re-run Preview' to compute it."
          showIcon
          action={<Button onClick={handleRerunPreview} loading={rerunning}>Re-run Preview</Button>}
        />
      </div>
    );
  }

  const vt = previewResult?.virtual_topology;
  const summary = previewResult?.change_summary;

  return (
    <div>
      <PageHeader
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(`/changesets/${id}`)} />
            Preview — {cs?.title ?? id}
            {cs?.environment && <Tag>{cs.environment}</Tag>}
          </Space>
        }
        subtitle="Virtual topology with pending changes overlaid. Green = NEW, Yellow = MODIFIED, Red = DELETED."
        extra={
          <Space>
            <Button onClick={handleRerunPreview} loading={rerunning || previewMut.isPending}>
              Re-run Preview
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              disabled={hasFatalConflicts}
              onClick={() => setApplyOpen(true)}
            >
              Apply ChangeSet
            </Button>
          </Space>
        }
      />

      {/* Summary strip */}
      {summary && (
        <Space style={{ marginBottom: 16 }} size="large">
          <Badge count={summary.created} showZero color="#52c41a">
            <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>Created</Tag>
          </Badge>
          <Badge count={summary.updated} showZero color="#faad14">
            <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>Modified</Tag>
          </Badge>
          <Badge count={summary.deleted} showZero color="#ff4d4f">
            <Tag color="red" style={{ fontSize: 14, padding: '4px 12px' }}>Deleted</Tag>
          </Badge>
        </Space>
      )}

      <Row gutter={16}>
        {/* Left: conflict panel */}
        <Col xs={24} lg={8}>
          <Card title="Conflict Analysis" size="small" style={{ marginBottom: 16 }}>
            {rerunning ? (
              <Skeleton active />
            ) : (
              <ConflictPanel conflicts={previewResult?.conflicts ?? []} />
            )}
          </Card>

          {/* Legend */}
          <Card title="Color Legend" size="small">
            {Object.entries(CHANGE_STATUS_LABEL).map(([k, label]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: CHANGE_STATUS_COLOR[k] }} />
                <Text style={{ fontSize: 12 }}>{label}</Text>
              </div>
            ))}
          </Card>
        </Col>

        {/* Right: virtual topology */}
        <Col xs={24} lg={16}>
          {rerunning ? (
            <Skeleton active />
          ) : vt ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              {vt.servers.length > 0 && (
                <Card title={`Servers (${vt.servers.length})`} size="small">
                  {vt.servers.map((s: any) => (
                    <ResourceNode key={s.id} item={s} type="SERVER" />
                  ))}
                </Card>
              )}
              {vt.applications.length > 0 && (
                <Card title={`Applications (${vt.applications.length})`} size="small">
                  {vt.applications.map((a: any) => (
                    <ResourceNode key={a.id} item={a} type="APPLICATION" />
                  ))}
                </Card>
              )}
              {vt.network_configs.length > 0 && (
                <Card title={`Network Configs (${vt.network_configs.length})`} size="small">
                  {vt.network_configs.map((n: any) => (
                    <ResourceNode key={n.id} item={{ ...n, name: n.private_ip ?? n.domain ?? n.id }} type="NETWORK_CONFIG" />
                  ))}
                </Card>
              )}
              {vt.connections.length > 0 && (
                <Card title={`Connections (${vt.connections.length})`} size="small">
                  {vt.connections.map((c: any) => (
                    <ResourceNode
                      key={c.id}
                      item={{ ...c, name: `${c.source_app_id?.slice(0, 6)} → ${c.target_app_id?.slice(0, 6)}` }}
                      type="APP_CONNECTION"
                    />
                  ))}
                </Card>
              )}
              {vt.ports.length > 0 && (
                <Card title={`Ports (${vt.ports.length})`} size="small">
                  {vt.ports.map((p: any) => (
                    <ResourceNode
                      key={p.id}
                      item={{ ...p, name: `${p.port_number}/${p.protocol}` }}
                      type="PORT"
                    />
                  ))}
                </Card>
              )}
            </Space>
          ) : null}
        </Col>
      </Row>

      <Modal
        title="Confirm Apply"
        open={applyOpen}
        onCancel={() => setApplyOpen(false)}
        onOk={handleApply}
        confirmLoading={applyMut.isPending}
        okText="Apply"
        okButtonProps={{ type: 'primary', disabled: hasFatalConflicts }}
      >
        <Alert
          type="warning"
          message="This will commit all changes to live data in an ACID transaction."
          description="An automatic topology snapshot will be created after applying. This cannot be undone."
          showIcon
          style={{ marginBottom: 12 }}
        />
        {hasFatalConflicts && (
          <Alert type="error" message="Fatal conflicts detected — resolve before applying." showIcon />
        )}
      </Modal>
    </div>
  );
}
