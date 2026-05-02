import { useState, useMemo, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  MarkerType,
  NodeTypes,
  Handle,
  Position,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { Select, Space, Tag, Empty, Spin, Typography, Card } from 'antd';
// @ts-expect-error dagre has no bundled types
import dagre from 'dagre';
import apiClient from '../../../api/client';
import type { FirewallRule } from '../../../types/firewall-rule';

const { Text } = Typography;

const ACTION_COLOR: Record<string, string> = {
  ALLOW: '#52c41a',
  DENY: '#ff4d4f',
};


const ZONE_DEFAULT_COLOR = '#1890ff';

// ─── Custom Node: Zone ────────────────────────────────────────────

function ZoneNode({ data }: NodeProps) {
  const bgColor = data.color || ZONE_DEFAULT_COLOR;
  return (
    <div
      style={{
        background: `${bgColor}22`,
        border: `2px solid ${bgColor}`,
        borderRadius: 10,
        padding: '10px 16px',
        minWidth: 140,
        textAlign: 'center',
      }}
    >
      <Handle type="source" position={Position.Right} style={{ background: bgColor }} />
      <div style={{ fontSize: 11, color: bgColor, fontWeight: 700, marginBottom: 2 }}>ZONE</div>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{data.name}</div>
      <div style={{ fontSize: 11, color: '#888' }}>{data.code}</div>
      {data.ipCount > 0 && (
        <Tag color="blue" style={{ marginTop: 4, fontSize: 10 }}>
          {data.ipCount} IPs
        </Tag>
      )}
    </div>
  );
}

// ─── Custom Node: Server ──────────────────────────────────────────

function ServerNode({ data }: NodeProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #1890ff',
        borderRadius: 8,
        padding: '8px 14px',
        minWidth: 160,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#1890ff' }} />
      <div style={{ fontSize: 11, color: '#1890ff', fontWeight: 700, marginBottom: 2 }}>SERVER</div>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{data.name}</div>
      <div style={{ fontSize: 11, color: '#888' }}>{data.code}</div>
      {data.ports && data.ports.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {data.ports.slice(0, 6).map((p: { id: string; port_number: number; protocol: string }) => (
            <Tag key={p.id} color="geekblue" style={{ fontSize: 10, margin: 0 }}>
              {p.port_number}/{p.protocol}
            </Tag>
          ))}
          {data.ports.length > 6 && <Tag style={{ fontSize: 10, margin: 0 }}>+{data.ports.length - 6}</Tag>}
        </div>
      )}
    </div>
  );
}

// ─── Custom Node: Source IP (no zone) ───────────────────��────────

function IpNode({ data }: NodeProps) {
  return (
    <div
      style={{
        background: '#fffbe6',
        border: '1.5px solid #faad14',
        borderRadius: 8,
        padding: '8px 14px',
        minWidth: 130,
        textAlign: 'center',
      }}
    >
      <Handle type="source" position={Position.Right} style={{ background: '#faad14' }} />
      <div style={{ fontSize: 11, color: '#faad14', fontWeight: 700, marginBottom: 2 }}>IP</div>
      <div style={{ fontWeight: 600, fontSize: 12 }}>{data.ip}</div>
    </div>
  );
}

const NODE_TYPES: NodeTypes = {
  zone: ZoneNode,
  server: ServerNode,
  ip: IpNode,
};

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 120 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((n) => g.setNode(n.id, { width: 170, height: 80 }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return { ...n, position: { x: pos.x - 85, y: pos.y - 40 } };
  });
}

// ─── Main Component ───────────────────────────────────────────────

export default function FirewallTopologyView() {
  const [envFilter, setEnvFilter] = useState<string | undefined>();
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  const { data: rulesResp, isLoading } = useQuery({
    queryKey: ['firewall-rules', 'topology', envFilter, actionFilter, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '500', page: '1' };
      if (envFilter) params.environment = envFilter;
      if (actionFilter) params.action = actionFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get<{ data: FirewallRule[] }>('/firewall-rules', { params });
      return res.data;
    },
  });

  const rules = rulesResp?.data ?? [];

  const { nodes, edges } = useMemo(() => {
    const zoneMap = new Map<string, { id: string; name: string; code: string; color?: string; ipCount: number }>();
    const serverMap = new Map<string, { id: string; name: string; code: string; ports: { id: string; port_number: number; protocol: string }[] }>();
    const ipNodes = new Map<string, string>(); // ip → nodeId

    rules.forEach((r) => {
      if (r.source_zone_id && r.source_zone) {
        if (!zoneMap.has(r.source_zone_id)) {
          zoneMap.set(r.source_zone_id, { id: r.source_zone_id, name: r.source_zone.name, code: r.source_zone.code, color: r.source_zone.color, ipCount: 0 });
        }
      } else if (r.source_ip) {
        if (!ipNodes.has(r.source_ip)) {
          ipNodes.set(r.source_ip, `ip-${r.source_ip.replace(/[./]/g, '-')}`);
        }
      }

      if (!serverMap.has(r.destination_server_id)) {
        serverMap.set(r.destination_server_id, {
          id: r.destination_server_id,
          name: r.destination_server?.name ?? r.destination_server_id.slice(0, 8),
          code: r.destination_server?.code ?? '',
          ports: [],
        });
      }

      if (r.destination_port) {
        const srv = serverMap.get(r.destination_server_id)!;
        if (!srv.ports.find((p) => p.id === r.destination_port_id)) {
          srv.ports.push({ id: r.destination_port_id!, port_number: r.destination_port.port_number, protocol: r.destination_port.protocol });
        }
      }
    });

    const rawNodes: Node[] = [
      ...Array.from(zoneMap.values()).map((z) => ({
        id: `zone-${z.id}`,
        type: 'zone',
        position: { x: 0, y: 0 },
        data: { name: z.name, code: z.code, color: z.color, ipCount: z.ipCount },
      })),
      ...Array.from(ipNodes.entries()).map(([ip, nodeId]) => ({
        id: nodeId,
        type: 'ip',
        position: { x: 0, y: 0 },
        data: { ip },
      })),
      ...Array.from(serverMap.values()).map((s) => ({
        id: `server-${s.id}`,
        type: 'server',
        position: { x: 0, y: 0 },
        data: { name: s.name, code: s.code, ports: s.ports },
      })),
    ];

    const rawEdges: Edge[] = rules.map((r) => {
      const srcId = r.source_zone_id
        ? `zone-${r.source_zone_id}`
        : r.source_ip
        ? ipNodes.get(r.source_ip)!
        : null;
      if (!srcId) return null;

      const dstId = `server-${r.destination_server_id}`;
      const portLabel = r.destination_port ? `${r.destination_port.port_number}/${r.destination_port.protocol}` : r.protocol;
      const color = ACTION_COLOR[r.action] ?? '#8c8c8c';

      return {
        id: r.id,
        source: srcId,
        target: dstId,
        label: portLabel,
        style: { stroke: color, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color },
        data: { rule: r, action: r.action, status: r.status },
        labelStyle: { fill: color, fontWeight: 600, fontSize: 11 },
        labelBgStyle: { fill: `${color}22` },
      } as Edge;
    }).filter(Boolean) as Edge[];

    const layoutNodes = rawNodes.length > 0 ? applyDagreLayout(rawNodes, rawEdges) : rawNodes;

    return { nodes: layoutNodes, edges: rawEdges };
  }, [rules]);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const rule: FirewallRule = edge.data?.rule;
    if (!rule) return;
    // Could open a detail panel — for now just console nothing
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 500 }}>
        <Spin tip="Đang tải firewall rules..." />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filter bar */}
      <div style={{ padding: '12px 24px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Text strong>Firewall Topology</Text>
        <Select
          placeholder="Môi trường"
          allowClear
          style={{ width: 120 }}
          value={envFilter}
          onChange={setEnvFilter}
          options={[
            { value: 'DEV', label: 'DEV' },
            { value: 'UAT', label: 'UAT' },
            { value: 'PROD', label: 'PROD' },
          ]}
        />
        <Select
          placeholder="Hành động"
          allowClear
          style={{ width: 130 }}
          value={actionFilter}
          onChange={setActionFilter}
          options={[
            { value: 'ALLOW', label: <Tag color="success">ALLOW</Tag> },
            { value: 'DENY', label: <Tag color="error">DENY</Tag> },
          ]}
        />
        <Select
          placeholder="Trạng thái"
          style={{ width: 170 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'ACTIVE', label: 'ACTIVE' },
            { value: 'INACTIVE', label: 'INACTIVE' },
            { value: 'PENDING_APPROVAL', label: 'PENDING_APPROVAL' },
            { value: 'REJECTED', label: 'REJECTED' },
            { value: '', label: 'Tất cả trạng thái' },
          ]}
        />
        <Space>
          <Text type="secondary">{rules.length} rules</Text>
          <span style={{ marginLeft: 8 }}>
            <Tag color="success">■ ALLOW</Tag>
            <Tag color="error">■ DENY</Tag>
          </span>
        </Space>
      </div>

      {nodes.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Empty description="Không có firewall rule nào. Tạo rules trong trang Firewall Rule Management." />
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 500 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            onEdgeClick={onEdgeClick}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.2}
            maxZoom={2}
          >
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                if (n.type === 'zone') return n.data.color || ZONE_DEFAULT_COLOR;
                if (n.type === 'server') return '#1890ff';
                return '#faad14';
              }}
            />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          </ReactFlow>
        </div>
      )}

      {/* Legend */}
      <Card size="small" style={{ margin: '8px 24px', borderRadius: 6 }}>
        <Space wrap>
          <Text type="secondary" style={{ fontSize: 12 }}>Legend:</Text>
          <span style={{ fontSize: 12 }}>🟦 Zone</span>
          <span style={{ fontSize: 12 }}>🟨 IP Nguồn</span>
          <span style={{ fontSize: 12 }}>⬜ Server đích</span>
          <span style={{ color: ACTION_COLOR.ALLOW, fontSize: 12 }}>→ ALLOW (xanh)</span>
          <span style={{ color: ACTION_COLOR.DENY, fontSize: 12 }}>→ DENY (đỏ)</span>
        </Space>
      </Card>
    </div>
  );
}
