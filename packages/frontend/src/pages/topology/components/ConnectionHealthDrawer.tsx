import { useMemo } from 'react';
import { Drawer, List, Tag, Space, Button, Typography, Empty, Divider } from 'antd';
import {
  ExclamationCircleFilled,
  WarningFilled,
  InfoCircleFilled,
  AimOutlined,
} from '@ant-design/icons';
import { ServerNode, ConnectionEdge } from '../hooks/useTopology';

const { Text } = Typography;

// ─── Types ────────────────────────────────────────────────────────

export type IssueSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface HealthIssue {
  id: string;
  severity: IssueSeverity;
  type: 'CIRCULAR_DEP' | 'DEAD_CONNECTION' | 'CROSS_ENV' | 'SPOF' | 'ORPHANED';
  title: string;
  description: string;
  /** React Flow node ID to focus when the user clicks the issue row */
  nodeId?: string;
}

// ─── Analysis ─────────────────────────────────────────────────────

export function analyzeTopologyHealth(
  servers: ServerNode[],
  connections: ConnectionEdge[],
): HealthIssue[] {
  const issues: HealthIssue[] = [];

  // App-level lookup helpers
  const appMeta = new Map<string, { status: string; name: string; serverId: string; env: string }>();
  servers.forEach((s) => {
    s.deployments.forEach((d) => {
      appMeta.set(d.application.id, {
        status: d.status,
        name: d.application.name,
        serverId: s.id,
        env: d.environment,
      });
    });
  });

  // Adjacency list (directed) for DFS cycle detection
  const adj = new Map<string, Set<string>>();
  connections.forEach((c) => {
    if (!adj.has(c.sourceAppId)) adj.set(c.sourceAppId, new Set());
    adj.get(c.sourceAppId)!.add(c.targetAppId);
  });

  // ── 1. Circular dependency (iterative DFS) ────────────────────
  const globalVisited = new Set<string>();
  const cycleKeys = new Set<string>();

  function detectCycle(start: string): void {
    const stack: Array<{ node: string; path: string[] }> = [{ node: start, path: [] }];
    const inStack = new Set<string>();

    while (stack.length > 0) {
      const { node, path } = stack.pop()!;
      if (inStack.has(node)) {
        // Found a back-edge → extract cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          // Normalize by lexicographic minimum rotation to deduplicate
          const minIdx = cycle.reduce((best, _, i) => (cycle[i] < cycle[best] ? i : best), 0);
          const key = [...cycle.slice(minIdx), ...cycle.slice(0, minIdx)].join('→');
          if (!cycleKeys.has(key)) {
            cycleKeys.add(key);
            const names = cycle.map((id) => appMeta.get(id)?.name ?? id);
            const firstServerId = appMeta.get(cycle[0])?.serverId;
            issues.push({
              id: `circular-${key}`,
              severity: 'ERROR',
              type: 'CIRCULAR_DEP',
              title: 'Circular dependency',
              description: `${names.join(' → ')} → (vòng lặp)`,
              nodeId: firstServerId ? `server-${firstServerId}` : undefined,
            });
          }
        }
        continue;
      }
      if (globalVisited.has(node)) continue;

      globalVisited.add(node);
      inStack.add(node);
      const newPath = [...path, node];

      for (const neighbor of adj.get(node) ?? []) {
        stack.push({ node: neighbor, path: newPath });
      }
    }
  }

  for (const appId of adj.keys()) {
    if (!globalVisited.has(appId)) detectCycle(appId);
  }

  // ── 2. Dead connections ──────────────────────────────────────
  connections.forEach((c) => {
    const target = appMeta.get(c.targetAppId);
    if (target && (target.status === 'INACTIVE' || target.status === 'STOPPED')) {
      const sourceName = appMeta.get(c.sourceAppId)?.name ?? c.sourceAppName;
      issues.push({
        id: `dead-${c.id}`,
        severity: 'ERROR',
        type: 'DEAD_CONNECTION',
        title: 'Kết nối đến app không hoạt động',
        description: `${sourceName} → ${target.name} (${target.status})`,
        nodeId: `server-${target.serverId}`,
      });
    }
  });

  // ── 3. Cross-environment connections ────────────────────────
  connections.forEach((c) => {
    const src = appMeta.get(c.sourceAppId);
    const tgt = appMeta.get(c.targetAppId);
    if (src && tgt && src.env !== tgt.env) {
      issues.push({
        id: `cross-env-${c.id}`,
        severity: 'WARNING',
        type: 'CROSS_ENV',
        title: 'Kết nối khác môi trường',
        description: `${c.sourceAppName} (${src.env}) → ${c.targetAppName} (${tgt.env})`,
        nodeId: `server-${src.serverId}`,
      });
    }
  });

  // ── 4. Single Point of Failure (degree ≥ 5) ─────────────────
  const degree = new Map<string, number>();
  connections.forEach((c) => {
    degree.set(c.sourceAppId, (degree.get(c.sourceAppId) ?? 0) + 1);
    degree.set(c.targetAppId, (degree.get(c.targetAppId) ?? 0) + 1);
  });
  degree.forEach((deg, appId) => {
    if (deg >= 5) {
      const meta = appMeta.get(appId);
      issues.push({
        id: `spof-${appId}`,
        severity: 'WARNING',
        type: 'SPOF',
        title: 'Single Point of Failure',
        description: `${meta?.name ?? appId} có ${deg} kết nối (≥5)`,
        nodeId: meta?.serverId ? `server-${meta.serverId}` : undefined,
      });
    }
  });

  // ── 5. Orphaned apps ────────────────────────────────────────
  const connectedApps = new Set<string>();
  connections.forEach((c) => {
    connectedApps.add(c.sourceAppId);
    connectedApps.add(c.targetAppId);
  });
  servers.forEach((s) => {
    s.deployments.forEach((d) => {
      if (!connectedApps.has(d.application.id)) {
        issues.push({
          id: `orphan-${d.application.id}`,
          severity: 'INFO',
          type: 'ORPHANED',
          title: 'App không có kết nối',
          description: `${d.application.name} (trên ${s.name}) không có kết nối nào`,
          nodeId: `server-${s.id}`,
        });
      }
    });
  });

  return issues;
}

// ─── Severity helpers ──────────────────────────────────────────────

const SEV_META: Record<IssueSeverity, { color: string; icon: React.ReactNode; tagColor: string }> = {
  ERROR:   { color: '#ff4d4f', icon: <ExclamationCircleFilled style={{ color: '#ff4d4f' }} />, tagColor: 'red' },
  WARNING: { color: '#faad14', icon: <WarningFilled style={{ color: '#faad14' }} />,           tagColor: 'orange' },
  INFO:    { color: '#1677ff', icon: <InfoCircleFilled style={{ color: '#1677ff' }} />,        tagColor: 'blue' },
};

const SEV_ORDER: IssueSeverity[] = ['ERROR', 'WARNING', 'INFO'];

const SEV_LABEL: Record<IssueSeverity, string> = {
  ERROR:   'Lỗi nghiêm trọng',
  WARNING: 'Cảnh báo',
  INFO:    'Thông tin',
};

// ─── Component ────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  servers: ServerNode[];
  connections: ConnectionEdge[];
  onFocusNode: (nodeId: string) => void;
}

export default function ConnectionHealthDrawer({ open, onClose, servers, connections, onFocusNode }: Props) {
  const issues = useMemo(
    () => analyzeTopologyHealth(servers, connections),
    [servers, connections],
  );

  const byGroup = useMemo(() => {
    const map = new Map<IssueSeverity, HealthIssue[]>();
    SEV_ORDER.forEach((s) => map.set(s, []));
    issues.forEach((i) => map.get(i.severity)!.push(i));
    return map;
  }, [issues]);

  const errorCount   = byGroup.get('ERROR')!.length;
  const warningCount = byGroup.get('WARNING')!.length;
  const infoCount    = byGroup.get('INFO')!.length;

  return (
    <Drawer
      title={
        <Space>
          <span>Đánh giá kết nối</span>
          {errorCount > 0   && <Tag color="red"    style={{ marginInlineEnd: 0 }}>{errorCount} lỗi</Tag>}
          {warningCount > 0 && <Tag color="orange" style={{ marginInlineEnd: 0 }}>{warningCount} cảnh báo</Tag>}
          {infoCount > 0    && <Tag color="blue"   style={{ marginInlineEnd: 0 }}>{infoCount} thông tin</Tag>}
        </Space>
      }
      open={open}
      onClose={onClose}
      width={480}
      styles={{ body: { padding: '12px 16px' } }}
    >
      {issues.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<Text type="secondary">Không phát hiện vấn đề nào</Text>}
          style={{ marginTop: 40 }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {SEV_ORDER.map((sev, sevIdx) => {
            const group = byGroup.get(sev)!;
            if (group.length === 0) return null;
            const meta = SEV_META[sev];
            return (
              <div key={sev}>
                {sevIdx > 0 && <Divider style={{ margin: '8px 0' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  {meta.icon}
                  <Text strong style={{ fontSize: 13, color: meta.color }}>{SEV_LABEL[sev]}</Text>
                  <Tag color={meta.tagColor} style={{ fontSize: 11, lineHeight: '18px', padding: '0 6px', marginInlineEnd: 0 }}>
                    {group.length}
                  </Tag>
                </div>
                <List
                  size="small"
                  dataSource={group}
                  split={false}
                  renderItem={(issue) => (
                    <List.Item
                      style={{
                        padding: '6px 8px',
                        borderRadius: 6,
                        marginBottom: 4,
                        background: '#fafafa',
                        border: '1px solid #f0f0f0',
                        alignItems: 'flex-start',
                      }}
                      extra={
                        issue.nodeId && (
                          <Button
                            size="small"
                            type="link"
                            icon={<AimOutlined />}
                            style={{ padding: '0 4px', height: 20, fontSize: 12 }}
                            title="Tập trung vào node"
                            onClick={() => {
                              onFocusNode(issue.nodeId!);
                              onClose();
                            }}
                          />
                        )
                      }
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ fontSize: 12, display: 'block' }}>{issue.title}</Text>
                        <Text style={{ fontSize: 11, color: '#595959', wordBreak: 'break-word' }}>
                          {issue.description}
                        </Text>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
