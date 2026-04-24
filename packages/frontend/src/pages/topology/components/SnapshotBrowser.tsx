import { useState, useMemo } from 'react';
import {
  Drawer,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Spin,
  Alert,
  Modal,
  Descriptions,
  Empty,
  Divider,
  Select,
} from 'antd';
import { EyeOutlined, DiffOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSnapshotList, useSnapshotDetail, Snapshot } from '../hooks/useTopology';

const { Text } = Typography;

// ─── Snapshot Detail Modal ────────────────────────────────────────

function SnapshotDetailModal({
  snapshotId,
  open,
  onClose,
}: {
  snapshotId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useSnapshotDetail(snapshotId);
  const snapshot = data?.data;

  return (
    <Modal title="Snapshot Detail" open={open} onCancel={onClose} footer={null} width={700}>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : snapshot ? (
        <>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="ID" span={2}>
              <Text code style={{ fontSize: 12 }}>
                {snapshot.id}
              </Text>
            </Descriptions.Item>
            {snapshot.label && (
              <Descriptions.Item label="Label" span={2}>
                {snapshot.label}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Environment">
              {snapshot.environment ? (
                <Tag color="blue">{snapshot.environment}</Tag>
              ) : (
                <Text type="secondary">All</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {dayjs(snapshot.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left" plain style={{ marginTop: 16 }}>
            Payload Summary
          </Divider>

          {snapshot.payload && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Servers: </Text>
                <Text>{(snapshot.payload as any).servers?.length ?? 0}</Text>
              </div>
              <div>
                <Text strong>Connections: </Text>
                <Text>{(snapshot.payload as any).connections?.length ?? 0}</Text>
              </div>
              <Divider plain style={{ margin: '8px 0' }} />
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                <pre
                  style={{
                    fontSize: 11,
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4,
                  }}
                >
                  {JSON.stringify(snapshot.payload, null, 2)}
                </pre>
              </div>
            </Space>
          )}
        </>
      ) : (
        <Empty description="Snapshot not found" />
      )}
    </Modal>
  );
}

// ─── Snapshot Compare Modal ───────────────────────────────────────

function SnapshotCompareModal({
  snapshotA,
  snapshotB,
  open,
  onClose,
}: {
  snapshotA: string;
  snapshotB: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: dataA, isLoading: loadA } = useSnapshotDetail(snapshotA);
  const { data: dataB, isLoading: loadB } = useSnapshotDetail(snapshotB);

  const loading = loadA || loadB;
  const snA = dataA?.data;
  const snB = dataB?.data;

  const diff = useMemo(() => {
    if (!snA?.payload || !snB?.payload) return null;
    const pA = snA.payload as any;
    const pB = snB.payload as any;
    const serversA = new Set<string>((pA.servers ?? []).map((s: any) => s.id));
    const serversB = new Set<string>((pB.servers ?? []).map((s: any) => s.id));
    const connsA = new Set<string>((pA.connections ?? []).map((c: any) => c.id));
    const connsB = new Set<string>((pB.connections ?? []).map((c: any) => c.id));

    return {
      serversAdded: (pB.servers ?? [])
        .filter((s: any) => !serversA.has(s.id))
        .map((s: any) => s.name),
      serversRemoved: (pA.servers ?? [])
        .filter((s: any) => !serversB.has(s.id))
        .map((s: any) => s.name),
      connsAdded: (pB.connections ?? []).filter((c: any) => !connsA.has(c.id)).length,
      connsRemoved: (pA.connections ?? []).filter((c: any) => !connsB.has(c.id)).length,
    };
  }, [snA, snB]);

  return (
    <Modal title="Compare Snapshots" open={open} onCancel={onClose} footer={null} width={600}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : diff ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div
              style={{
                background: '#f9f0ff',
                padding: 12,
                borderRadius: 6,
                border: '1px solid #d3adf7',
              }}
            >
              <Text strong>Snapshot A</Text>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {snA?.label ?? snA?.id?.slice(0, 8)}
                <br />
                {snA ? dayjs(snA.created_at).format('YYYY-MM-DD HH:mm') : ''}
              </div>
            </div>
            <div
              style={{
                background: '#e6fffb',
                padding: 12,
                borderRadius: 6,
                border: '1px solid #87e8de',
              }}
            >
              <Text strong>Snapshot B</Text>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {snB?.label ?? snB?.id?.slice(0, 8)}
                <br />
                {snB ? dayjs(snB.created_at).format('YYYY-MM-DD HH:mm') : ''}
              </div>
            </div>
          </div>

          <Divider orientation="left" plain>
            Differences
          </Divider>

          {diff.serversAdded.length > 0 && (
            <div>
              <Tag color="success">+ {diff.serversAdded.length} server(s) added</Tag>
              <Text style={{ fontSize: 12, marginLeft: 8 }}>{diff.serversAdded.join(', ')}</Text>
            </div>
          )}
          {diff.serversRemoved.length > 0 && (
            <div>
              <Tag color="error">- {diff.serversRemoved.length} server(s) removed</Tag>
              <Text style={{ fontSize: 12, marginLeft: 8 }}>
                {diff.serversRemoved.join(', ')}
              </Text>
            </div>
          )}
          {diff.connsAdded > 0 && (
            <div>
              <Tag color="success">+ {diff.connsAdded} connection(s) added</Tag>
            </div>
          )}
          {diff.connsRemoved > 0 && (
            <div>
              <Tag color="error">- {diff.connsRemoved} connection(s) removed</Tag>
            </div>
          )}
          {diff.serversAdded.length === 0 &&
            diff.serversRemoved.length === 0 &&
            diff.connsAdded === 0 &&
            diff.connsRemoved === 0 && (
              <Alert
                type="info"
                message="No structural differences found between the two snapshots."
              />
            )}
        </Space>
      ) : (
        <Empty description="Unable to compute diff" />
      )}
    </Modal>
  );
}

// ─── Main Snapshot Browser ────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  currentEnvironment?: string;
}

export default function SnapshotBrowser({ open, onClose, currentEnvironment }: Props) {
  const [envFilter, setEnvFilter] = useState<string | undefined>(currentEnvironment);
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const { data, isLoading, error } = useSnapshotList(envFilter, page);
  const snapshots = data?.data ?? [];
  const meta = data?.meta;

  const selectedKeys = [compareA, compareB].filter(Boolean) as string[];

  const columns = [
    {
      title: 'Label',
      dataIndex: 'label',
      render: (label: string, record: Snapshot) =>
        label ?? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.id.slice(0, 8)}…
          </Text>
        ),
    },
    {
      title: 'Env',
      dataIndex: 'environment',
      width: 80,
      render: (env: string) =>
        env ? <Tag color="blue">{env}</Tag> : <Text type="secondary">All</Text>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      width: 160,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '',
      width: 80,
      render: (_: any, record: Snapshot) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setDetailId(record.id)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title="Topology Snapshots"
        placement="right"
        width={640}
        open={open}
        onClose={onClose}
      >
        <Space style={{ marginBottom: 12, width: '100%', justifyContent: 'space-between' }}>
          <Select
            allowClear
            placeholder="All environments"
            value={envFilter}
            onChange={(v) => {
              setEnvFilter(v);
              setPage(1);
            }}
            style={{ width: 160 }}
            options={[
              { label: 'DEV', value: 'DEV' },
              { label: 'UAT', value: 'UAT' },
              { label: 'PROD', value: 'PROD' },
            ]}
          />
          <Button
            icon={<DiffOutlined />}
            disabled={selectedKeys.length < 2}
            onClick={() => setCompareOpen(true)}
          >
            Compare ({selectedKeys.length}/2)
          </Button>
        </Space>

        {error && (
          <Alert type="error" message="Failed to load snapshots" style={{ marginBottom: 12 }} />
        )}

        <Table
          columns={columns}
          dataSource={snapshots}
          rowKey="id"
          loading={isLoading}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedKeys,
            onChange: (keys) => {
              const [a, b] = keys as string[];
              setCompareA(a ?? null);
              setCompareB(b ?? null);
            },
            getCheckboxProps: (record: Snapshot) => ({
              disabled:
                selectedKeys.length >= 2 && !selectedKeys.includes(record.id),
            }),
          }}
          size="small"
          pagination={{
            total: meta?.total ?? 0,
            current: page,
            pageSize: 20,
            onChange: setPage,
            showTotal: (t) => `${t} snapshots`,
          }}
          locale={{ emptyText: 'No snapshots yet. Save one from the topology view.' }}
        />
      </Drawer>

      {detailId && (
        <SnapshotDetailModal
          snapshotId={detailId}
          open={!!detailId}
          onClose={() => setDetailId(null)}
        />
      )}

      {compareA && compareB && (
        <SnapshotCompareModal
          snapshotA={compareA}
          snapshotB={compareB}
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </>
  );
}
