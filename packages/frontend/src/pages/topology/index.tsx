import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, {
  type Node, type Edge,
  Controls, MiniMap, Background, BackgroundVariant,
  useNodesState, useEdgesState,
  MarkerType, type ReactFlowInstance, type NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useState as useTabState } from 'react';
import {
  Button, Space, Spin, Alert, Typography, Dropdown, Input, Modal, Badge, App, Tag, Tabs, Tooltip,
} from 'antd';
import {
  DownloadOutlined, ReloadOutlined, HistoryOutlined, SaveOutlined,
  ThunderboltOutlined, FullscreenOutlined, FullscreenExitOutlined,
  MedicineBoxOutlined, ApiOutlined,
} from '@ant-design/icons';

import NodeDetailPanel from './components/NodeDetailPanel';
import ConnectionDetailPanel from './components/ConnectionDetailPanel';
import ImpliedConnectionDetailPanel from './components/ImpliedConnectionDetailPanel';
import TopologyFilterPanel from './components/TopologyFilterPanel';
import SnapshotBrowser from './components/SnapshotBrowser';
import Topology3DView from './components/Topology3DView';
import TopologyVisNetworkView, { type TopologyVisNetworkHandle } from './components/TopologyVisNetworkView';
import TopologyMermaidView from './components/TopologyMermaidView';
import TopologyLegend from './components/TopologyLegend';
import { CreateConnectionModal } from './components/CreateConnectionModal';
import ConnectionHealthDrawer from './components/ConnectionHealthDrawer';
import FirewallTopologyView from './components/FirewallTopologyView';
import { nodeTypes, edgeTypes } from './components/edges';
import { computeLayout, applyDagreLayout, applyElkLayout } from './utils/topologyLayout';
import { useTopologyFilters } from './hooks/useTopologyFilters';
import { useTopologyExport } from './hooks/useTopologyExport';
import { useTopologyQuery, useCreateSnapshot, type ServerNode, type ConnectionEdge, type ImpliedConnectionEdge } from './hooks/useTopology';
import { useTopologySubscription } from './hooks/useTopologySubscription';
import { useCreateConnection, useDeleteConnection } from '../../hooks/useConnections';
import PageHeader from '../../components/common/PageHeader';

const { Text } = Typography;

// ─── Main Component ───────────────────────────────────────────────

function TopologyPageInner() {
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const [renderEngine, setRenderEngine] = useState<'reactflow' | 'visnetwork' | 'mermaid'>(() => {
    try {
      const saved = localStorage.getItem('topology.renderEngine');
      if (saved === 'visnetwork' || saved === 'reactflow' || saved === 'mermaid') return saved;
    } catch { /* ignore */ }
    return 'visnetwork';
  });

  const handleViewModeChange = useCallback((v: '2D' | '3D') => {
    setViewMode(v);
    if (v === '3D') setFilters((f) => f.connectionMode ? { ...f, connectionMode: false } : f);
  }, []);

  const handleRenderEngineChange = useCallback((v: 'reactflow' | 'visnetwork' | 'mermaid') => {
    setRenderEngine(v);
    try { localStorage.setItem('topology.renderEngine', v); } catch { /* ignore */ }
    if (v !== 'reactflow') setFilters((f) => f.connectionMode ? { ...f, connectionMode: false } : f);
  }, []);

  const [filters, setFilters] = useState<{
    environment?: string;
    nodeType: 'all' | 'server' | 'app';
    showMiniMap: boolean;
    layout: 'force' | 'hierarchical';
    layoutAlgorithm: 'dagre' | 'elk-layered' | 'elk-force' | 'elk-tree' | 'elk-radial';
    layoutDirection: 'TB' | 'BT' | 'LR' | 'RL';
    connectionMode: boolean;
    edgeStyle: 'bezier' | 'step';
    visibleGroupNames: string[];
    visibleServerIds: string[];
    visibleAppIds: string[];
  }>({ nodeType: 'server', showMiniMap: true, layout: 'force', layoutAlgorithm: 'elk-layered', layoutDirection: 'LR', connectionMode: false, edgeStyle: 'bezier', visibleGroupNames: [], visibleServerIds: [], visibleAppIds: [] });

  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionEdge | null>(null);
  const [selectedImplied, setSelectedImplied] = useState<ImpliedConnectionEdge | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [realtimeEvents, setRealtimeEvents] = useState<string[]>([]);
  const [createConnModalVisible, setCreateConnModalVisible] = useState(false);
  const [connectionDraft, setConnectionDraft] = useState<any>(null);
  const [healthDrawerOpen, setHealthDrawerOpen] = useState(false);
  const [showImplied, setShowImplied] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const visNetworkViewRef = useRef<TopologyVisNetworkHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const positionsModeRef = useRef<string>(filters.nodeType);
  const setEdgesRef = useRef<((updater: (edges: Edge[]) => Edge[]) => void) | null>(null);

  const stableUpdateEdgeLabel = useCallback((edgeId: string, dx: number, dy: number) => {
    setEdgesRef.current?.((prev: Edge[]) => prev.map((e: Edge) => {
      if (e.id !== edgeId) return e;
      return { ...e, data: { ...e.data, labelOffsetX: (e.data?.labelOffsetX ?? 0) + dx, labelOffsetY: (e.data?.labelOffsetY ?? 0) + dy } };
    }));
  }, []);

  const { data, loading, error, refetch } = useTopologyQuery(filters.environment);
  const createSnapshot = useCreateSnapshot();
  const createConnection = useCreateConnection();
  const deleteConnection = useDeleteConnection();
  const { message, modal } = App.useApp();

  // ─── Filters & computed options ──────────────────────────────────
  const { filteredData, dropdownOptions, cascadeMaps, healthIssueCount } = useTopologyFilters(
    data?.topology, filters,
  );
  const { groupOptions, serverOptions, appOptions } = dropdownOptions;
  const { serverGroupsMap, serverAppsMap } = cascadeMaps;

  // ─── Realtime subscriptions ───────────────────────────────────
  useTopologySubscription({
    environment: filters.environment,
    onServerStatusChanged: (event) => {
      setRealtimeEvents((prev: string[]) => [`Server "${event.name}" → ${event.status}`, ...prev.slice(0, 4)]);
      refetch();
    },
    onConnectionStatusChanged: (event) => {
      setRealtimeEvents((prev: string[]) => [`Connection ${event.sourceAppName}→${event.targetAppName}: ${event.status}`, ...prev.slice(0, 4)]);
      refetch();
    },
    onTopologyChanged: () => { refetch(); },
  });

  // ─── ReactFlow layout + implied edges ───────────────────────────
  const { nodes: computedNodes, edges: computedEdges } = useMemo(() => {
    if (!data?.topology) return { nodes: [], edges: [] };

    const layoutServers = filters.nodeType === 'server' ? filteredData.serversForEdgeResolution : filteredData.servers;
    const layoutConnections = filters.nodeType === 'server' ? filteredData.connectionsForEdgeResolution : filteredData.connections;
    const result = computeLayout(layoutServers, layoutConnections, filters.nodeType, filters.layoutDirection, filters.edgeStyle);

    const edgesWithCallback = result.edges.map((e) => ({
      ...e,
      data: { ...e.data, onLabelMove: (dx: number, dy: number) => stableUpdateEdgeLabel(e.id, dx, dy) },
    }));

    const FW_ACTION: Record<string, { color: string }> = {
      ALLOW: { color: '#389e0d' },
      DENY:  { color: '#cf1322' },
    };
    const impliedEdges: Edge[] = [];

    if (showImplied && data.topology.impliedConnections) {
      const allNodes = result.nodes;
      const addedServerPairs = new Map<string, Set<string>>();

      data.topology.impliedConnections.forEach((ic: ImpliedConnectionEdge) => {
        const action = ic.action ?? 'ALLOW';
        const cfg = FW_ACTION[action] ?? FW_ACTION.ALLOW;
        const portNum = ic.targetPort?.portNumber ?? (ic.targetPort as any)?.port_number;

        const commonEdgeProps = {
          type: 'fwEdge' as const,
          animated: false,
          zIndex: 10,
          markerEnd: { type: MarkerType.ArrowClosed, color: cfg.color },
          data: { type: 'IMPLIED', action, firewallRuleId: ic.firewallRuleId, firewallRuleName: ic.firewallRuleName, portNum, _implied: ic },
        };

        const pushServerPair = (srcId: string, tgtId: string) => {
          if (srcId === tgtId) return;
          const srcNodeId = `server-${srcId}`;
          const tgtNodeId = `server-${tgtId}`;
          if (!allNodes.some((n) => n.id === srcNodeId) || !allNodes.some((n) => n.id === tgtNodeId)) return;
          const pairKey = `${action}::${srcId}::${tgtId}`;
          if (!addedServerPairs.has(action)) addedServerPairs.set(action, new Set());
          if (addedServerPairs.get(action)!.has(pairKey)) return;
          addedServerPairs.get(action)!.add(pairKey);
          impliedEdges.push({ id: `implied-srv-${action}-${srcId}-${tgtId}`, source: srcNodeId, target: tgtNodeId, ...commonEdgeProps });
        };

        if (ic.sourceServerId && ic.targetServerId) {
          pushServerPair(ic.sourceServerId, ic.targetServerId);
        } else {
          const srcSrv = filteredData.serversForEdgeResolution.find((s) => s.deployments.some((d) => d.application.id === ic.sourceAppId));
          const tgtSrv = filteredData.serversForEdgeResolution.find((s) => s.deployments.some((d) => d.application.id === ic.targetAppId));
          if (srcSrv && tgtSrv) pushServerPair(srcSrv.id, tgtSrv.id);
        }
      });
    }

    return { nodes: result.nodes, edges: [...edgesWithCallback, ...impliedEdges] };
  }, [filteredData, filters.nodeType, filters.layoutDirection, filters.edgeStyle, stableUpdateEdgeLabel, showImplied, data?.topology?.impliedConnections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges);

  useEffect(() => { setEdgesRef.current = setEdges; }, [setEdges]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useMemo(() => {
    if (positionsModeRef.current !== filters.nodeType) {
      userPositionsRef.current = {};
      positionsModeRef.current = filters.nodeType;
    }
    const mergedNodes = computedNodes.map((node) => {
      const savedPos = userPositionsRef.current[node.id];
      return savedPos ? { ...node, position: savedPos } : node;
    });
    setNodes(mergedNodes);
    setEdges(computedEdges);
  }, [computedNodes, computedEdges, filters.nodeType]);

  useEffect(() => {
    const id = requestAnimationFrame(() => { reactFlowRef.current?.fitView({ padding: 0.2, duration: 300 }); });
    return () => cancelAnimationFrame(id);
  }, [filters.nodeType]);

  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  const edgesRef = useRef(edges);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // ─── Focus highlight ────────────────────────────────────────────
  const displayNodes = useMemo(() => {
    if (!focusedNodeId) return nodes;
    const highlighted = new Set<string>([focusedNodeId]);
    nodes.forEach((n) => { if (n.parentNode === focusedNodeId) highlighted.add(n.id); });
    edges.forEach((e) => {
      if (highlighted.has(e.source) || highlighted.has(e.target)) { highlighted.add(e.source); highlighted.add(e.target); }
    });
    nodes.forEach((n) => { if (n.parentNode && highlighted.has(n.id)) highlighted.add(n.parentNode); });
    nodes.forEach((n) => { if (n.parentNode && highlighted.has(n.parentNode)) highlighted.add(n.id); });
    return nodes.map((n) => ({ ...n, style: { ...n.style, opacity: highlighted.has(n.id) ? 1 : 0.12, transition: 'opacity 0.2s ease' } }));
  }, [nodes, edges, focusedNodeId]);

  const displayEdges = useMemo(() => {
    if (!focusedNodeId) return edges;
    const childIds = new Set(nodes.filter((n) => n.parentNode === focusedNodeId).map((n) => n.id));
    childIds.add(focusedNodeId);
    return edges.map((e) => {
      const isHighlighted = childIds.has(e.source) || childIds.has(e.target);
      return { ...e, style: { ...e.style, opacity: isHighlighted ? 1 : 0.08, strokeWidth: isHighlighted ? 3 : (e.style?.strokeWidth ?? 2) }, zIndex: isHighlighted ? 10 : 0 };
    });
  }, [edges, nodes, focusedNodeId]);

  useEffect(() => {
    if (!focusedNodeId || renderEngine !== 'reactflow') return;
    const highlighted = new Set<string>([focusedNodeId]);
    nodesRef.current.forEach((n) => { if (n.parentNode === focusedNodeId) highlighted.add(n.id); });
    edgesRef.current.forEach((e) => {
      if (highlighted.has(e.source) || highlighted.has(e.target)) { highlighted.add(e.source); highlighted.add(e.target); }
    });
    nodesRef.current.forEach((n) => { if (n.parentNode && highlighted.has(n.id)) highlighted.add(n.parentNode); });
    requestAnimationFrame(() => {
      reactFlowRef.current?.fitView({ nodes: [...highlighted].map((id) => ({ id })), duration: 500, padding: 0.3, minZoom: 0.2, maxZoom: 1.5 });
    });
  }, [focusedNodeId, renderEngine]);

  // ─── Drag & snap handlers ─────────────────────────────────────
  const handleNodeDragStop = useCallback((_evt: React.MouseEvent, node: Node) => {
    const parentId = node.parentNode;
    if (parentId) {
      const STACK_PADDING_X = 14;
      const STACK_PADDING_Y = 48;
      const STACK_APP_H = 30;
      const STACK_GAP = 4;
      const siblings = nodesRef.current.filter((n) => n.parentNode === parentId);
      const sorted = [...siblings].sort((a, b) => {
        const ay = a.id === node.id ? node.position.y : a.position.y;
        const by = b.id === node.id ? node.position.y : b.position.y;
        return ay - by;
      });
      const updates: Record<string, { x: number; y: number }> = {};
      sorted.forEach((n, idx) => {
        updates[n.id] = { x: STACK_PADDING_X, y: STACK_PADDING_Y + idx * (STACK_APP_H + STACK_GAP) };
        userPositionsRef.current[n.id] = updates[n.id];
      });
      setNodes((nds) => nds.map((n) => updates[n.id] ? { ...n, position: updates[n.id] } : n));
      return;
    }

    const GAP = 8;
    const { x, y } = node.position;
    const nW = node.width ?? 160;
    const nH = node.height ?? 44;
    const topSiblings = nodesRef.current.filter((other) => other.id !== node.id && !other.parentNode);
    const collidesAt = (tx: number, ty: number) => topSiblings.some((other) => {
      const oW = other.width ?? 160;
      const oH = other.height ?? 44;
      return tx < other.position.x + oW - 2 && tx + nW > other.position.x + 2 &&
             ty < other.position.y + oH - 2 && ty + nH > other.position.y + 2;
    });

    if (!collidesAt(x, y)) { userPositionsRef.current[node.id] = { x, y }; return; }

    const step = Math.max(nW, nH) + GAP;
    const DIRS = [
      { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
      { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 },
    ];
    let bestPos: { x: number; y: number } | null = null;
    for (let ring = 1; ring <= 20 && !bestPos; ring++) {
      let nearest: { pos: { x: number; y: number }; dist: number } | null = null;
      for (const { dx, dy } of DIRS) {
        const tx = x + dx * ring * step;
        const ty = y + dy * ring * step;
        if (!collidesAt(tx, ty)) {
          const dist = Math.sqrt((tx - x) ** 2 + (ty - y) ** 2);
          if (!nearest || dist < nearest.dist) nearest = { pos: { x: tx, y: ty }, dist };
        }
      }
      if (nearest) bestPos = nearest.pos;
    }
    if (bestPos) {
      setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, position: bestPos! } : n));
      userPositionsRef.current[node.id] = bestPos;
    }
  }, [setNodes]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    const ALIGN_THRESHOLD = 14;
    const alignedChanges = changes.map((change) => {
      if (change.type !== 'position' || change.dragging !== false || !change.position) return change;
      const draggedNode = nodesRef.current.find((n) => n.id === change.id);
      const parentId = draggedNode?.parentNode;
      let { x, y } = change.position;
      let snappedX = false;
      let snappedY = false;
      for (const other of nodesRef.current) {
        if (other.id === change.id) continue;
        const isSibling = parentId ? other.parentNode === parentId : !other.parentNode;
        if (!isSibling) continue;
        if (!snappedX && Math.abs(other.position.x - x) <= ALIGN_THRESHOLD) { x = other.position.x; snappedX = true; }
        if (!snappedY && Math.abs(other.position.y - y) <= ALIGN_THRESHOLD) { y = other.position.y; snappedY = true; }
        if (snappedX && snappedY) break;
      }
      userPositionsRef.current[change.id] = { x, y };
      return { ...change, position: { x, y } };
    });
    onNodesChange(alignedChanges);
  }, [onNodesChange]);

  // ─── Auto-arrange ─────────────────────────────────────────────
  const handleAutoArrange = useCallback(async () => {
    if (renderEngine === 'visnetwork') { visNetworkViewRef.current?.autoArrange(); return; }
    userPositionsRef.current = {};
    let arranged: Node[];
    if (filters.layoutAlgorithm !== 'dagre') {
      try {
        arranged = await applyElkLayout(nodes, edges, filters.layoutAlgorithm as 'elk-layered' | 'elk-force' | 'elk-tree' | 'elk-radial', filters.layoutDirection);
      } catch {
        arranged = applyDagreLayout(nodes, edges, filters.layoutDirection);
      }
    } else {
      arranged = applyDagreLayout(nodes, edges, filters.layoutDirection);
    }
    setNodes(arranged);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      reactFlowRef.current?.fitView({ padding: 0.2, duration: 500, minZoom: 0.25, maxZoom: 1.5, includeHiddenNodes: false });
    }));
  }, [renderEngine, nodes, edges, filters.layoutAlgorithm, filters.layoutDirection, setNodes]);

  const handleAutoArrangeRef = useRef(handleAutoArrange);
  useEffect(() => { handleAutoArrangeRef.current = handleAutoArrange; }, [handleAutoArrange]);

  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) { isFirstRenderRef.current = false; return; }
    if (renderEngine !== 'reactflow' || nodes.length === 0) return;
    handleAutoArrangeRef.current();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.layoutAlgorithm, filters.layoutDirection]);

  // ─── Connection handlers ──────────────────────────────────────
  const onConnect = useCallback(async (params: any) => {
    if (!filters.connectionMode) return;
    const sourceNode = nodes.find((n) => n.id === params.source);
    const targetNode = nodes.find((n) => n.id === params.target);
    if (!sourceNode?.data._app || !targetNode?.data._app) return;
    const sourceApp = sourceNode.data._app;
    const targetApp = targetNode.data._app;
    if (sourceApp.environment !== targetApp.environment) {
      message.warning('Chỉ có thể tạo kết nối giữa các app cùng môi trường');
      return;
    }
    if (targetApp.ports?.length === 1) {
      modal.confirm({
        title: 'Tạo kết nối?',
        content: `${sourceApp.name} → ${targetApp.name} (Port ${targetApp.ports[0].port_number})`,
        okText: 'Tạo', cancelText: 'Huỷ',
        onOk: async () => {
          try {
            await createConnection.mutateAsync({ source_app_id: sourceApp.id, target_app_id: targetApp.id, environment: sourceApp.environment, connection_type: 'HTTP', target_port_id: targetApp.ports[0].id } as any);
            message.success('Tạo kết nối thành công');
            refetch();
          } catch (e: any) {
            message.error(e?.response?.data?.error?.message ?? 'Không thể tạo kết nối');
          }
        },
      });
    } else {
      setConnectionDraft({ sourceApp, targetApp });
      setCreateConnModalVisible(true);
    }
  }, [filters.connectionMode, nodes, createConnection, modal, message, refetch]);

  const handleCreateConnectionSubmit = async (values: any) => {
    if (!connectionDraft) return;
    try {
      await createConnection.mutateAsync({ source_app_id: connectionDraft.sourceApp.id, target_app_id: connectionDraft.targetApp.id, environment: connectionDraft.sourceApp.environment, ...values });
      message.success('Tạo kết nối thành công');
      setCreateConnModalVisible(false);
      setConnectionDraft(null);
      refetch();
    } catch (e: any) { throw e; }
  };

  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    const conn = edge.data?._connection as ConnectionEdge | undefined;
    const implied = edge.data?._implied as ImpliedConnectionEdge | undefined;
    setSelectedNode(null);
    setFocusedNodeId(null);
    if (conn) { setSelectedConnection(conn); setSelectedImplied(null); }
    else if (implied) { setSelectedImplied(implied); setSelectedConnection(null); }
  }, []);

  const handleDeleteConnection = useCallback(async (conn: ConnectionEdge) => {
    try {
      await deleteConnection.mutateAsync(conn.id);
      message.success('Xóa kết nối thành công');
      setSelectedConnection(null);
      refetch();
    } catch (e: any) {
      message.error(e?.response?.data?.error?.message ?? 'Không thể xoá kết nối');
    }
  }, [deleteConnection, message, refetch]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedConnection(null);
    setSelectedImplied(null);
    setFocusedNodeId(node.id);
    if (node.data._server) {
      const server = node.data._server as ServerNode;
      setSelectedNode({ type: 'server', id: server.id, name: server.name, code: server.code, hostname: server.hostname, purpose: server.purpose, status: server.status, environment: server.environment, infra_type: server.infra_type, site: server.site, description: server.description, deployments: server.deployments, networkConfigs: server.networkConfigs });
    } else if (node.data._app) {
      const app = node.data._app;
      setSelectedNode({ type: 'app', id: app.id, name: app.name, code: app.code, version: app.version, groupName: app.groupName, deploymentStatus: app.deploymentStatus, environment: app.environment, serverName: app.serverName, deploymentId: app.deploymentId });
    }
  }, []);

  // ─── Export helpers ───────────────────────────────────────────
  const { exportAsJSON, exportAsMermaid, exportAsPNG, exportAsSVG } = useTopologyExport(
    data?.topology,
    filters.environment,
    (msg) => message.error(msg),
    (msg) => message.success(msg),
  );

  const handleSaveSnapshot = async () => {
    try {
      await createSnapshot.mutateAsync({ label: snapshotLabel || undefined, environment: filters.environment });
      message.success('Snapshot saved');
      setSaveModalOpen(false);
      setSnapshotLabel('');
    } catch { message.error('Failed to save snapshot'); }
  };

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  const serverCount = data?.topology?.servers?.length ?? 0;
  const connectionCount = data?.topology?.connections?.length ?? 0;
  const CANVAS_H = 'calc(100vh - 64px - 48px - 48px - 72px - 48px)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Topology"
        helpKey="topology"
        subtitle={!loading && data ? `${serverCount} server${serverCount !== 1 ? 's' : ''} · ${connectionCount} connection${connectionCount !== 1 ? 's' : ''}` : 'Loading...'}
        extra={
          <Space>
            {realtimeEvents.length > 0 && (
              <Tag icon={<ThunderboltOutlined />} color="blue" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {realtimeEvents[0]}
              </Tag>
            )}
            <Badge count={healthIssueCount} size="small" offset={[-3, 3]}>
              <Button icon={<MedicineBoxOutlined />} onClick={() => setHealthDrawerOpen(true)} danger={healthIssueCount > 0}>
                Kiểm tra kết nối
              </Button>
            </Badge>
            <Tooltip title="Hiện/ẩn kết nối ngầm định từ FirewallRule ALLOW">
              <Button size="small" type={showImplied ? 'primary' : 'default'} ghost={showImplied} onClick={() => setShowImplied((v) => !v)} icon={<ApiOutlined />}>
                Implied
              </Button>
            </Tooltip>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={loading}>Làm mới</Button>
            <Button icon={<SaveOutlined />} onClick={() => setSaveModalOpen(true)}>Lưu bản chụp</Button>
            <Badge count={0} showZero={false}>
              <Button icon={<HistoryOutlined />} onClick={() => setShowSnapshots(true)}>Bản chụp</Button>
            </Badge>
            <Dropdown menu={{ items: [
              ...(viewMode === '2D' && renderEngine === 'reactflow' ? [
                { key: 'png', label: 'Xuất ảnh PNG', icon: <DownloadOutlined />, onClick: exportAsPNG },
                { key: 'svg', label: 'Xuất ảnh SVG', icon: <DownloadOutlined />, onClick: exportAsSVG },
              ] : []),
              { key: 'json', label: 'Xuất file JSON', icon: <DownloadOutlined />, onClick: exportAsJSON },
              { key: 'mermaid', label: 'Xuất file Mermaid', icon: <DownloadOutlined />, onClick: exportAsMermaid },
            ] }}>
              <Button icon={<DownloadOutlined />}>Xuất file</Button>
            </Dropdown>
            <Button icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={toggleFullscreen} title={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình'} />
          </Space>
        }
      />

      {error && <Alert type="error" message="Không thể tải sơ đồ" description={error.message} style={{ margin: '0 24px 8px' }} showIcon />}

      <TopologyFilterPanel
        filters={filters}
        onChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        renderEngine={renderEngine}
        onRenderEngineChange={handleRenderEngineChange}
        onAutoArrange={handleAutoArrange}
        groupOptions={groupOptions}
        serverOptions={serverOptions}
        appOptions={appOptions}
        serverGroupsMap={serverGroupsMap}
        serverAppsMap={serverAppsMap}
      />

      <div ref={containerRef} style={{ position: 'relative', height: isFullscreen ? '100vh' : CANVAS_H, minHeight: 400 }}>
        {loading && !data && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, background: 'rgba(255,255,255,0.7)' }}>
            <Spin size="large" />
            <div style={{ marginTop: 12, color: '#8c8c8c' }}>Đang tải sơ đồ...</div>
          </div>
        )}

        {/* ── ReactFlow ── */}
        {viewMode === '2D' && renderEngine === 'reactflow' && (
          <>
            <ReactFlow
              nodes={displayNodes} edges={displayEdges}
              onNodesChange={handleNodesChange} onEdgesChange={onEdgesChange}
              onConnect={onConnect} onNodeClick={onNodeClick} onEdgeClick={onEdgeClick}
              onPaneClick={() => { setSelectedNode(null); setSelectedConnection(null); setSelectedImplied(null); setFocusedNodeId(null); }}
              onNodeDragStop={handleNodeDragStop}
              nodeTypes={nodeTypes} edgeTypes={edgeTypes}
              fitView fitViewOptions={{ padding: 0.25 }} elevateEdgesOnSelect
              onInit={(instance) => { reactFlowRef.current = instance; }}
              style={{ background: '#f0f2f5' }}
            >
              <Controls />
              {filters.showMiniMap && (
                <MiniMap
                  nodeColor={(node) => {
                    const status = node.data?.status ?? node.data?.deploymentStatus;
                    if (status === 'ACTIVE' || status === 'RUNNING') return '#52c41a';
                    if (status === 'INACTIVE' || status === 'STOPPED') return '#ff4d4f';
                    if (status === 'MAINTENANCE') return '#faad14';
                    return '#8c8c8c';
                  }}
                  maskColor="rgba(0,0,0,0.05)"
                />
              )}
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e0e0e0" />
            </ReactFlow>
            {filters.nodeType === 'server' && <TopologyLegend hasEnvironment={!!filters.environment} />}
            <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
            <ConnectionDetailPanel connection={selectedConnection} onClose={() => setSelectedConnection(null)} onDelete={handleDeleteConnection} deleting={deleteConnection.isPending} />
            <ImpliedConnectionDetailPanel connection={selectedImplied} servers={filteredData.serversForEdgeResolution} onClose={() => setSelectedImplied(null)} />
          </>
        )}

        {/* ── VisNetwork ── */}
        {viewMode === '2D' && renderEngine === 'visnetwork' && data?.topology && (
          <>
            <TopologyVisNetworkView
              ref={visNetworkViewRef}
              servers={filteredData.serversForEdgeResolution}
              connections={filteredData.connectionsForEdgeResolution}
              impliedConnections={data.topology.impliedConnections ?? []}
              showImplied={showImplied}
              nodeType={filters.nodeType}
              layout={filters.layout === 'hierarchical' ? 'hierarchical' : 'physics'}
              onNodeClick={(payload) => {
                setSelectedConnection(null);
                if (payload.type === 'server') {
                  const s = data.topology.servers.find((x) => x.id === payload.id);
                  if (s) setSelectedNode({ type: 'server', ...s });
                } else {
                  const dep = data.topology.servers.flatMap((s) => s.deployments.map((d) => ({ d, s }))).find(({ d }) => d.application.id === payload.id);
                  if (dep) setSelectedNode({ type: 'app', id: dep.d.application.id, name: dep.d.application.name, code: dep.d.application.code, deploymentStatus: dep.d.status, environment: dep.d.environment, serverName: dep.s.name });
                }
              }}
              onEdgeClick={(conn) => { setSelectedNode(null); setSelectedConnection(conn); }}
            />
            <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
            <ConnectionDetailPanel connection={selectedConnection} onClose={() => setSelectedConnection(null)} onDelete={handleDeleteConnection} deleting={deleteConnection.isPending} />
          </>
        )}

        {/* ── Mermaid ── */}
        {viewMode === '2D' && renderEngine === 'mermaid' && (
          <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: '#f0f2f5', padding: 16 }}>
            <TopologyMermaidView servers={filteredData.serversForEdgeResolution} connections={filteredData.connectionsForEdgeResolution} nodeType={filters.nodeType} environment={filters.environment} />
          </div>
        )}

        {/* ── 3D ── */}
        {viewMode === '3D' && data?.topology && (
          <Topology3DView servers={filteredData.servers} connections={filteredData.connections} onNodeSelect={(node) => { if (!node) { setSelectedNode(null); return; } setSelectedNode({ type: node.type, ...node.data }); }} />
        )}
        {viewMode === '3D' && selectedNode && <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />}
      </div>

      <Modal title="Save Topology Snapshot" open={saveModalOpen} onOk={handleSaveSnapshot} onCancel={() => setSaveModalOpen(false)} confirmLoading={createSnapshot.isPending} okText="Save">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div><Text>Environment: </Text><Text strong>{filters.environment ?? 'All'}</Text></div>
          <Input placeholder="Label (optional)" value={snapshotLabel} onChange={(e) => setSnapshotLabel(e.target.value)} />
        </Space>
      </Modal>

      <CreateConnectionModal open={createConnModalVisible} sourceApp={connectionDraft?.sourceApp} targetApp={connectionDraft?.targetApp} onCancel={() => { setCreateConnModalVisible(false); setConnectionDraft(null); }} onSubmit={handleCreateConnectionSubmit} />

      <SnapshotBrowser open={showSnapshots} onClose={() => setShowSnapshots(false)} currentEnvironment={filters.environment} />

      <ConnectionHealthDrawer
        open={healthDrawerOpen} onClose={() => setHealthDrawerOpen(false)}
        servers={data?.topology?.servers ?? []} connections={data?.topology?.connections ?? []}
        onFocusNode={(nodeId) => { setFocusedNodeId(nodeId); if (renderEngine !== 'reactflow') setRenderEngine('reactflow'); }}
      />
    </div>
  );
}

export default function TopologyPage() {
  const [activeTab, setActiveTab] = useTabState<'app' | 'firewall'>('app');
  return (
    <App>
      <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as 'app' | 'firewall')} style={{ padding: '0 24px' }}
        items={[{ key: 'app', label: 'Sơ đồ ứng dụng' }, { key: 'firewall', label: '🔒 Firewall Topology' }]}
      />
      {activeTab === 'app' ? <TopologyPageInner /> : <FirewallTopologyView />}
    </App>
  );
}
