import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  NodeTypes,
  EdgeTypes,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  EdgeProps,
  ReactFlowInstance,
  NodeChange,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

import {
  Button,
  Space,
  Spin,
  Alert,
  Typography,
  Dropdown,
  Input,
  Modal,
  Badge,
  App,
  Segmented,
  Tag,
} from 'antd';
import {
  DownloadOutlined,
  ReloadOutlined,
  HistoryOutlined,
  SaveOutlined,
  FilterOutlined,
  PartitionOutlined,
  ThunderboltOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons';

import ServerFlowNode from './components/ServerFlowNode';
import AppFlowNode from './components/AppFlowNode';
import NodeDetailPanel from './components/NodeDetailPanel';
import ConnectionDetailPanel from './components/ConnectionDetailPanel';
import TopologyFilterPanel from './components/TopologyFilterPanel';
import SnapshotBrowser from './components/SnapshotBrowser';
import Topology3DView from './components/Topology3DView';
import TopologyCytoscapeView, { type TopologyCytoscapeHandle } from './components/TopologyCytoscapeView';
import TopologyVisNetworkView, { type TopologyVisNetworkHandle } from './components/TopologyVisNetworkView';
import { CreateConnectionModal } from './components/CreateConnectionModal';
import { useTopologyQuery, ServerNode, ConnectionEdge } from './hooks/useTopology';
import { useCreateSnapshot } from './hooks/useTopology';
import { useTopologySubscription } from './hooks/useTopologySubscription';
import { useCreateConnection, useDeleteConnection } from '../../hooks/useConnections';
import PageHeader from '../../components/common/PageHeader';

const { Text } = Typography;

// ─── Custom edge with protocol label ─────────────────────────────

const protocolColors: Record<string, string> = {
  HTTP: '#1677ff',
  HTTPS: '#52c41a',
  TCP: '#fa8c16',
  GRPC: '#722ed1',
  AMQP: '#eb2f96',
  KAFKA: '#13c2c2',
  DATABASE: '#ff4d4f',
};

function ProtocolEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, style, selected,
}: EdgeProps) {
  const pIdx = data?.parallelIndex ?? 0;
  const pCount = data?.parallelCount ?? 1;
  const protocolColor = protocolColors[data?.protocol] ?? '#8c8c8c';
  const edgeStyle: 'bezier' | 'step' = data?.edgeStyle ?? 'bezier';

  // Perpendicular unit vector — used to spread bezier labels sideways off the midpoint
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;

  let edgePath: string;
  let labelX: number;
  let labelY: number;
  let spread: number;

  if (edgeStyle === 'step') {
    // Orthogonal mode: spread parallel edges via offset (24 px per edge from center)
    const offsetStep = pCount <= 1 ? 0 : (pIdx - (pCount - 1) / 2) * 24;
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      borderRadius: 8,
      offset: offsetStep !== 0 ? offsetStep : undefined,
    });
    spread = 0; // offset handles the separation, no perpendicular spread needed
  } else {
    // Bezier mode: curvature-based spread for parallel edges
    const curvature = pCount <= 1
      ? 0.25
      : 0.08 + (pIdx / Math.max(1, pCount - 1)) * 0.72;
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      curvature,
    });
    spread = pCount <= 1 ? 0 : (pIdx - (pCount - 1) / 2) * 22;
  }

  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  // Manual offset stored in edge.data (draggable label from previous sprint)
  const manualOffsetX = data?.labelOffsetX ?? 0;
  const manualOffsetY = data?.labelOffsetY ?? 0;

  const handleLabelMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const ddx = e.clientX - dragStart.current.x;
      const ddy = e.clientY - dragStart.current.y;
      dragStart.current = { x: e.clientX, y: e.clientY };
      data?.onLabelMove?.(ddx, ddy);
    };
    const onUp = () => setIsDragging(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, data]);

  const finalLabelX = labelX + perpX * spread + manualOffsetX;
  const finalLabelY = labelY + perpY * spread + manualOffsetY;

  // Selected edge: thicker stroke, glow, and emphasised label
  const pathStyle: React.CSSProperties = selected
    ? { ...style, stroke: protocolColor, strokeWidth: 4, filter: `drop-shadow(0 0 6px ${protocolColor})` }
    : (style as React.CSSProperties);

  const portLabel = data?.targetPort
    ? `:${data.targetPort.port_number}`
    : '';
  return (
    <>
      {/* Invisible wider hit-area for easier clicking/hovering */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={18} style={{ cursor: 'pointer' }} />
      <path id={id} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} style={pathStyle} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${finalLabelX}px,${finalLabelY}px)`,
            background: protocolColor,
            color: '#fff',
            padding: selected ? '2px 7px' : '1px 5px',
            borderRadius: 3,
            fontSize: selected ? 10 : 9,
            fontWeight: 700,
            pointerEvents: 'all',
            whiteSpace: 'nowrap',
            lineHeight: '14px',
            boxShadow: selected
              ? `0 0 0 2px #fff, 0 0 0 4px ${protocolColor}, 0 2px 8px rgba(0,0,0,0.35)`
              : '0 1px 4px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
            letterSpacing: '0.3px',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            transition: 'all 0.15s ease',
          }}
          className="nodrag nopan"
          onMouseDown={handleLabelMouseDown}
          title="Kéo để di chuyển nhãn"
        >
          {data?.protocol}{portLabel}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// ─── Node types ───────────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  serverNode: ServerFlowNode,
  appNode: AppFlowNode,
};

const edgeTypes: EdgeTypes = {
  protocolEdge: ProtocolEdge,
};

// ─── Layout helpers ───────────────────────────────────────────────

const SERVER_NODE_W = 220;
const SERVER_NODE_H = 150;
const APP_NODE_W = 180;
const APP_NODE_H = 92;

function buildGraph(
  servers: ServerNode[],
  connections: ConnectionEdge[],
  nodeType: 'all' | 'server' | 'app',
  edgeStyle: 'bezier' | 'step' = 'bezier',
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  servers.forEach((server) => {
    if (nodeType !== 'app') {
      const apps = server.deployments;

      const paddingX = 14;
      const paddingY = 48; // matches compact header height
      const isContainer = nodeType === 'all' && apps.length > 0;

      // Stack layout constants (1 col, compact rows)
      const STACK_W = 224;
      const STACK_APP_H = 30;
      const STACK_GAP = 4;

      const serverW = !isContainer ? SERVER_NODE_W : STACK_W;
      const serverH = !isContainer ? SERVER_NODE_H
        : paddingY + apps.length * STACK_APP_H + Math.max(0, apps.length - 1) * STACK_GAP + 12;

      const primaryIp = server.networkConfigs[0]?.private_ip;
      nodes.push({
        id: `server-${server.id}`,
        type: 'serverNode',
        position: { x: 0, y: 0 },
        style: { width: serverW, height: serverH },
        data: {
          label: server.name,
          code: server.code,
          hostname: server.hostname,
          purpose: server.purpose,
          status: server.status,
          environment: server.environment,
          site: server.site,
          infra_type: server.infra_type,
          deploymentCount: server.deployments.length,
          privateIp: primaryIp,
          isContainer,
          _server: server,
        },
      });
    }

    if (nodeType !== 'server') {
      const apps = server.deployments;
      const paddingX = 14;
      const paddingY = 48;
      const STACK_W = 224;
      const STACK_APP_H = 30;
      const STACK_GAP = 4;

      apps.forEach((dep, idx) => {
        const inContainer = nodeType === 'all';
        const childX = inContainer ? paddingX : 0;
        const childY = inContainer ? paddingY + idx * (STACK_APP_H + STACK_GAP) : 0;

        nodes.push({
          id: `app-${dep.application.id}-${server.id}`,
          type: 'appNode',
          position: { x: childX, y: childY },
          ...(inContainer ? { style: { width: STACK_W - paddingX * 2, height: STACK_APP_H } } : {}),
          parentNode: inContainer ? `server-${server.id}` : undefined,
          extent: inContainer ? 'parent' : undefined,
          data: {
            label: dep.application.name,
            code: dep.application.code,
            groupName: dep.application.groupName,
            deploymentStatus: dep.status,
            environment: dep.environment,
            version: dep.application.version,
            serverName: server.name,
            deploymentId: dep.id,
            application_type: dep.application.application_type,
            ports: dep.application.ports,
            compact: inContainer,
            _app: { ...dep.application, deploymentStatus: dep.status, environment: dep.environment, serverName: server.name, deploymentId: dep.id },
          },
        });
      });
    }
  });

  connections.forEach((conn) => {
    const sourceNodes = nodes.filter((n) => n.id.startsWith(`app-${conn.sourceAppId}-`));
    const targetNodes = nodes.filter((n) => n.id.startsWith(`app-${conn.targetAppId}-`));

    if (sourceNodes.length && targetNodes.length) {
      const color = protocolColors[conn.connectionType] ?? '#8c8c8c';
      edges.push({
        id: `conn-${conn.id}`,
        source: sourceNodes[0].id,
        target: targetNodes[0].id,
        type: 'protocolEdge',
        animated: true,
        data: {
          protocol: conn.connectionType,
          description: conn.description,
          targetPort: conn.targetPort,
          edgeStyle,
          _connection: conn,
        },
        style: { stroke: color, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color },
      });
    } else if (nodeType === 'server') {
      const srcServer = servers.find((s) => s.deployments.some((d) => d.application.id === conn.sourceAppId));
      const tgtServer = servers.find((s) => s.deployments.some((d) => d.application.id === conn.targetAppId));
      if (srcServer && tgtServer && srcServer.id !== tgtServer.id) {
        const color = protocolColors[conn.connectionType] ?? '#8c8c8c';
        const existingEdge = edges.find(
          (e) => e.source === `server-${srcServer.id}` && e.target === `server-${tgtServer.id}`,
        );
        if (!existingEdge) {
          edges.push({
            id: `conn-srv-${conn.id}`,
            source: `server-${srcServer.id}`,
            target: `server-${tgtServer.id}`,
            type: 'protocolEdge',
            animated: true,
            data: {
              protocol: conn.connectionType,
              targetPort: conn.targetPort,
              edgeStyle,
              _connection: conn,
            },
            style: { stroke: color, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color },
          });
        }
      }
    }
  });

  // Tag parallel edges (same node-pair) with index/count so ProtocolEdge can spread them
  const parallelGroups = new Map<string, string[]>();
  edges.forEach((edge) => {
    const srcTop = nodes.find((n) => n.id === edge.source)?.parentNode ?? edge.source;
    const tgtTop = nodes.find((n) => n.id === edge.target)?.parentNode ?? edge.target;
    if (srcTop === tgtTop) return;
    const key = [srcTop, tgtTop].sort().join('||');
    if (!parallelGroups.has(key)) parallelGroups.set(key, []);
    parallelGroups.get(key)!.push(edge.id);
  });
  parallelGroups.forEach((edgeIds) => {
    const n = edgeIds.length;
    edgeIds.forEach((edgeId, i) => {
      const edge = edges.find((e) => e.id === edgeId);
      if (!edge) return;
      edge.data = { ...edge.data, parallelIndex: i, parallelCount: n };
    });
  });

  return { nodes, edges };
}

function applyDagreLayout(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR'): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 140, ranksep: 200, edgesep: 40, marginx: 60, marginy: 60 });

  const topNodes = nodes.filter(n => !n.parentNode);
  const nodeIdsWithEdges = new Set<string>();
  edges.forEach(e => {
    nodeIdsWithEdges.add(e.source);
    nodeIdsWithEdges.add(e.target);
  });

  const connectedNodes = topNodes.filter(n => nodeIdsWithEdges.has(n.id));
  const isolatedNodes = topNodes.filter(n => !nodeIdsWithEdges.has(n.id));

  connectedNodes.forEach((node) => {
    const w = node.style?.width as number ?? (node.type === 'serverNode' ? SERVER_NODE_W : APP_NODE_W);
    const h = node.style?.height as number ?? (node.type === 'serverNode' ? SERVER_NODE_H : APP_NODE_H);
    g.setNode(node.id, { width: w, height: h });
  });

  edges.forEach((edge) => {
    const srcNode = nodes.find(n => n.id === edge.source);
    const tgtNode = nodes.find(n => n.id === edge.target);
    const srcParent = srcNode?.parentNode ?? edge.source;
    const tgtParent = tgtNode?.parentNode ?? edge.target;
    
    if (srcParent !== tgtParent && g.hasNode(srcParent) && g.hasNode(tgtParent)) {
      g.setEdge(srcParent, tgtParent);
    }
  });

  dagre.layout(g);

  let maxBottom = 0;
  const laidOutNodes = nodes.map((node) => {
    if (node.parentNode) return node;

    const pos = g.node(node.id);
    if (!pos) return node; // Isolated nodes handled later
    
    const w = node.style?.width as number ?? (node.type === 'serverNode' ? SERVER_NODE_W : APP_NODE_W);
    const h = node.style?.height as number ?? (node.type === 'serverNode' ? SERVER_NODE_H : APP_NODE_H);
    const newY = pos.y - h / 2;
    maxBottom = Math.max(maxBottom, newY + h);
    return { ...node, position: { x: pos.x - w / 2, y: newY } };
  });

  // Layout isolated nodes in a compact grid below the main graph
  if (isolatedNodes.length > 0) {
    const COLS = Math.ceil(Math.sqrt(isolatedNodes.length * 1.5));
    const GRID_GAP = 40;
    const START_Y = maxBottom + 120;
    
    isolatedNodes.forEach((node, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const w = node.style?.width as number ?? (node.type === 'serverNode' ? SERVER_NODE_W : APP_NODE_W);
      const h = node.style?.height as number ?? (node.type === 'serverNode' ? SERVER_NODE_H : APP_NODE_H);
      
      const targetNode = laidOutNodes.find(n => n.id === node.id);
      if (targetNode) {
        targetNode.position = {
          x: col * (SERVER_NODE_W + GRID_GAP),
          y: START_Y + row * (SERVER_NODE_H + GRID_GAP)
        };
      }
    });
  }

  return laidOutNodes;
}

function computeLayout(
  servers: ServerNode[],
  connections: ConnectionEdge[],
  nodeType: 'all' | 'server' | 'app',
  layout: 'force' | 'hierarchical',
  edgeStyle: 'bezier' | 'step' = 'bezier',
): { nodes: Node[]; edges: Edge[] } {
  const { nodes, edges } = buildGraph(servers, connections, nodeType, edgeStyle);
  const direction = layout === 'hierarchical' ? 'TB' : 'LR';
  const layoutNodes = applyDagreLayout(nodes, edges, direction);
  return { nodes: layoutNodes, edges };
}

// ─── Main Component ───────────────────────────────────────────────

function TopologyPageInner() {
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const [renderEngine, setRenderEngine] = useState<'reactflow' | 'cytoscape' | 'visnetwork'>(() => {
    try {
      const saved = localStorage.getItem('topology.renderEngine');
      if (saved === 'cytoscape' || saved === 'visnetwork' || saved === 'reactflow') return saved;
    } catch {
      /* ignore */
    }
    return 'visnetwork';
  });
  useEffect(() => {
    try {
      localStorage.setItem('topology.renderEngine', renderEngine);
    } catch {
      /* ignore */
    }
  }, [renderEngine]);
  const [filters, setFilters] = useState<{
    environment?: string;
    nodeType: 'all' | 'server' | 'app';
    showMiniMap: boolean;
    layout: 'force' | 'hierarchical';
    connectionMode: boolean;
    edgeStyle: 'bezier' | 'step';
  }>({ nodeType: 'all', showMiniMap: true, layout: 'force', connectionMode: false, edgeStyle: 'bezier' });

  const [showFilters, setShowFilters] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionEdge | null>(null);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [realtimeEvents, setRealtimeEvents] = useState<string[]>([]);
  
  const [createConnModalVisible, setCreateConnModalVisible] = useState(false);
  const [connectionDraft, setConnectionDraft] = useState<any>(null);

  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const cytoscapeViewRef = useRef<TopologyCytoscapeHandle>(null);
  const visNetworkViewRef = useRef<TopologyVisNetworkHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track user-dragged node positions — persisted across refetches, cleared on Auto Arrange or when nodeType changes
  const userPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  // Remember the mode these positions belong to — positions from one mode are meaningless in another
  const positionsModeRef = useRef<string>(filters.nodeType);

  // Stable ref to setEdges for use inside edge label drag callbacks
  const setEdgesRef = useRef<any>(null);
  const stableUpdateEdgeLabel = useCallback((edgeId: string, dx: number, dy: number) => {
    setEdgesRef.current?.((prev) => prev.map((e) => {
      if (e.id !== edgeId) return e;
      return {
        ...e,
        data: {
          ...e.data,
          labelOffsetX: (e.data?.labelOffsetX ?? 0) + dx,
          labelOffsetY: (e.data?.labelOffsetY ?? 0) + dy,
        },
      };
    }));
  }, []);

  const { data, loading, error, refetch } = useTopologyQuery(filters.environment);
  const createSnapshot = useCreateSnapshot();
  const createConnection = useCreateConnection();
  const deleteConnection = useDeleteConnection();
  const { message, modal } = App.useApp();

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
    onTopologyChanged: () => {
      refetch();
    },
  });

  const filteredData = useMemo(() => {
    if (!data?.topology) return { servers: [], connections: [] };

    let servers = [...data.topology.servers];
    let connections = [...data.topology.connections];

    // 1. Filter by environment
    if (filters.environment) {
      servers = servers
        .filter((s) => s.environment === filters.environment)
        .map((s) => ({
          ...s,
          deployments: s.deployments.filter((d) => d.environment === filters.environment),
        }));
      
      // Connections only if both sides exist in filtered set
      const validAppIds = new Set();
      servers.forEach(s => s.deployments.forEach(d => validAppIds.add(d.application.id)));
      
      connections = connections.filter(c => validAppIds.has(c.sourceAppId) && validAppIds.has(c.targetAppId));
    }

    // 2. Filter by node type (for Vis/Cytoscape mostly, as ReactFlow handles it in buildGraph)
    if (filters.nodeType === 'server') {
      servers = servers.map(s => ({ ...s, deployments: [] }));
      connections = [];
    } else if (filters.nodeType === 'app') {
      // Keep only apps? Actually usually "app only" view still shows apps, but maybe hide servers if the engine supports it.
      // For now, ReactFlow buildGraph handles this specifically.
    }

    return { servers, connections };
  }, [data, filters.environment, filters.nodeType]);

  // ─── 2D layout ───────────────────────────────────────────────
  const { nodes: computedNodes, edges: computedEdges } = useMemo(() => {
    if (!data?.topology) return { nodes: [], edges: [] };
    // Use filtered data for React Flow too
    const result = computeLayout(filteredData.servers, filteredData.connections, filters.nodeType, filters.layout, filters.edgeStyle);
    // Attach stable onLabelMove callback to each edge for draggable labels
    const edgesWithCallback = result.edges.map((e) => ({
      ...e,
      data: {
        ...e.data,
        onLabelMove: (dx: number, dy: number) => stableUpdateEdgeLabel(e.id, dx, dy),
      },
    }));
    return { nodes: result.nodes, edges: edgesWithCallback };
  }, [filteredData, filters.nodeType, filters.layout, filters.edgeStyle, stableUpdateEdgeLabel]);

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges);

  // Keep setEdgesRef in sync so stableUpdateEdgeLabel always uses the latest setter
  useEffect(() => { setEdgesRef.current = setEdges; }, [setEdges]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useMemo(() => {
    // If view mode changed since positions were saved, drop them — node sizes/ids are mode-specific
    if (positionsModeRef.current !== filters.nodeType) {
      userPositionsRef.current = {};
      positionsModeRef.current = filters.nodeType;
    }
    // Merge user-dragged positions back so refetch doesn't reset manually moved nodes
    const mergedNodes = computedNodes.map((node) => {
      const savedPos = userPositionsRef.current[node.id];
      return savedPos ? { ...node, position: savedPos } : node;
    });
    setNodes(mergedNodes);
    setEdges(computedEdges);
  }, [computedNodes, computedEdges, filters.nodeType]);

  // Re-fit the viewport whenever the view mode changes so the new layout is centered
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      reactFlowRef.current?.fitView({ padding: 0.2, duration: 300 });
    });
    return () => cancelAnimationFrame(id);
  }, [filters.nodeType]);

  // Keep a ref to current nodes so handleNodesChange can read them without stale closure
  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  // Drag stop handler:
  //   • Child app inside a server → reorder as a vertical list (drop-between behaviour)
  //   • Top-level node → collision push (snapping is handled in handleNodesChange)
  const handleNodeDragStop = useCallback((_evt: React.MouseEvent, node: Node) => {
    const parentId = node.parentNode;

    // ── CHILD APP INSIDE SERVER: list reorder ────────────────────────
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
        updates[n.id] = {
          x: STACK_PADDING_X,
          y: STACK_PADDING_Y + idx * (STACK_APP_H + STACK_GAP),
        };
        userPositionsRef.current[n.id] = updates[n.id];
      });
      setNodes((nds) => nds.map((n) => updates[n.id] ? { ...n, position: updates[n.id] } : n));
      return;
    }

    // ── TOP-LEVEL NODE: collision push ────────────────────────────────
    // Snapping was already done in handleNodesChange. Here we just ensure no overlap.
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

    if (collidesAt(x, y)) {
      const step = nH + GAP;
      let resolved = false;
      for (let i = 1; i <= 20 && !resolved; i++) {
        for (const dir of [1, -1]) {
          const ty = y + i * step * dir;
          if (!collidesAt(x, ty)) {
            setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, position: { x, y: ty } } : n));
            userPositionsRef.current[node.id] = { x, y: ty };
            resolved = true;
            break;
          }
        }
      }
    }
  }, [setNodes]);

  // Magnetic alignment snap: modify position INSIDE the change before React Flow sees it
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    const ALIGN_THRESHOLD = 14;
    const alignedChanges = changes.map((change) => {
      // Only process drag-end events that carry a final position
      if (change.type !== 'position' || change.dragging !== false || !change.position) {
        return change;
      }

      // Determine whether this is a child node (app inside a server box)
      const draggedNode = nodesRef.current.find((n) => n.id === change.id);
      const parentId = draggedNode?.parentNode; // defined → child node, undefined → top-level
      let { x, y } = change.position;
      let snappedX = false;
      let snappedY = false;
      for (const other of nodesRef.current) {
        if (other.id === change.id) continue;

        // Child node: only align against siblings (same parentNode).
        // Top-level node: only align against other top-level nodes.
        const isSibling = parentId
          ? other.parentNode === parentId
          : !other.parentNode;
        if (!isSibling) continue;

        if (!snappedX && Math.abs(other.position.x - x) <= ALIGN_THRESHOLD) {
          x = other.position.x;
          snappedX = true;
        }
        if (!snappedY && Math.abs(other.position.y - y) <= ALIGN_THRESHOLD) {
          y = other.position.y;
          snappedY = true;
        }
        if (snappedX && snappedY) break;
      }
      userPositionsRef.current[change.id] = { x, y };
      return { ...change, position: { x, y } };
    });
    onNodesChange(alignedChanges);
  }, [onNodesChange]);

  const handleAutoArrange = useCallback(() => {
    if (renderEngine === 'cytoscape') {
      cytoscapeViewRef.current?.autoArrange();
      return;
    }
    if (renderEngine === 'visnetwork') {
      visNetworkViewRef.current?.autoArrange();
      return;
    }
    // React Flow: clear saved positions, re-run dagre, then fit with zoom clamps
    userPositionsRef.current = {};
    const direction = filters.layout === 'hierarchical' ? ('TB' as const) : ('LR' as const);
    const arranged = applyDagreLayout(nodes, edges, direction);
    setNodes(arranged);
    // Double rAF: first frame commits new positions, second frame triggers fitView after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        reactFlowRef.current?.fitView({
          padding: 0.2,
          duration: 500,
          minZoom: 0.25,
          maxZoom: 1.5,
          includeHiddenNodes: false,
        });
      });
    });
  }, [renderEngine, nodes, edges, filters.layout, setNodes]);

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
        okText: 'Tạo',
        cancelText: 'Huỷ',
        onOk: async () => {
          try {
            await createConnection.mutateAsync({
              source_app_id: sourceApp.id,
              target_app_id: targetApp.id,
              environment: sourceApp.environment,
              connection_type: 'HTTP',
              target_port_id: targetApp.ports[0].id,
            } as any);
            message.success('Đã tạo kết nối');
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
      await createConnection.mutateAsync({
        source_app_id: connectionDraft.sourceApp.id,
        target_app_id: connectionDraft.targetApp.id,
        environment: connectionDraft.sourceApp.environment,
        ...values,
      });
      message.success('Đã tạo kết nối');
      setCreateConnModalVisible(false);
      setConnectionDraft(null);
      refetch();
    } catch (e: any) {
      throw e; // Modal handles error display if needed
    }
  };

  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    // Always open connection detail pane (delete is available inside the pane)
    const conn = edge.data?._connection as ConnectionEdge | undefined;
    if (conn) {
      setSelectedNode(null);
      setSelectedConnection(conn);
    }
  }, []);

  const handleDeleteConnection = useCallback(async (conn: ConnectionEdge) => {
    try {
      await deleteConnection.mutateAsync(conn.id);
      message.success('Đã xoá kết nối');
      setSelectedConnection(null);
      refetch();
    } catch (e: any) {
      message.error(e?.response?.data?.error?.message ?? 'Không thể xoá kết nối');
    }
  }, [deleteConnection, message, refetch]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedConnection(null);
    if (node.data._server) {
      const server = node.data._server as ServerNode;
      setSelectedNode({ type: 'server', id: server.id, name: server.name, code: server.code, hostname: server.hostname, purpose: server.purpose, status: server.status, environment: server.environment, infra_type: server.infra_type, site: server.site, description: server.description, deployments: server.deployments, networkConfigs: server.networkConfigs });
    } else if (node.data._app) {
      const app = node.data._app;
      setSelectedNode({ type: 'app', id: app.id, name: app.name, code: app.code, version: app.version, groupName: app.groupName, deploymentStatus: app.deploymentStatus, environment: app.environment, serverName: app.serverName, deploymentId: app.deploymentId });
    }
  }, []);

  // ─── Export helpers ───────────────────────────────────────────

  const exportAsJSON = useCallback(() => {
    if (!data?.topology) return;
    const blob = new Blob([JSON.stringify(data.topology, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topology-${filters.environment ?? 'all'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, filters.environment]);

  const exportAsMermaid = useCallback(() => {
    if (!data?.topology) return;
    const lines = ['graph LR'];
    data.topology.servers.forEach((s: ServerNode) => lines.push(`  ${s.code}["${s.name}"]`));
    data.topology.connections.forEach((c: ConnectionEdge) => {
      const srcCode = data.topology.servers.flatMap((s: ServerNode) => s.deployments.map((d) => ({ sCode: s.code, appId: d.application.id }))).find((x: { sCode: string; appId: string }) => x.appId === c.sourceAppId)?.sCode ?? c.sourceAppId;
      const tgtCode = data.topology.servers.flatMap((s: ServerNode) => s.deployments.map((d) => ({ sCode: s.code, appId: d.application.id }))).find((x: { sCode: string; appId: string }) => x.appId === c.targetAppId)?.sCode ?? c.targetAppId;
      lines.push(`  ${srcCode} -->|${c.connectionType}| ${tgtCode}`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topology-${filters.environment ?? 'all'}-${Date.now()}.mmd`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Mermaid diagram exported');
  }, [data, filters.environment, message]);

  const exportAsPNG = useCallback(() => {
    const svgEl = document.querySelector('.react-flow__renderer svg') as SVGElement;
    if (!svgEl) { message.error('Cannot capture topology'); return; }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const { width, height } = svgEl.getBoundingClientRect();
      canvas.width = width * 2; canvas.height = height * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2); ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `topology-${filters.environment ?? 'all'}-${Date.now()}.png`;
        a.click();
      }, 'image/png');
    };
    img.src = url;
  }, [filters.environment, message]);

  const exportAsSVG = useCallback(() => {
    const svgEl = document.querySelector('.react-flow__renderer svg') as SVGElement;
    if (!svgEl) { message.error('Cannot capture topology'); return; }
    const serializer = new XMLSerializer();
    const blob = new Blob([serializer.serializeToString(svgEl)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topology-${filters.environment ?? 'all'}-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('SVG exported');
  }, [filters.environment, message]);

  const handleSaveSnapshot = async () => {
    try {
      await createSnapshot.mutateAsync({ label: snapshotLabel || undefined, environment: filters.environment });
      message.success('Snapshot saved');
      setSaveModalOpen(false);
      setSnapshotLabel('');
    } catch {
      message.error('Failed to save snapshot');
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const serverCount = data?.topology?.servers?.length ?? 0;
  const connectionCount = data?.topology?.connections?.length ?? 0;

  const CANVAS_H = 'calc(100vh - 64px - 48px - 48px - 72px)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Topology"
        helpKey="topology"
        subtitle={
          !loading && data
            ? `${serverCount} server${serverCount !== 1 ? 's' : ''} · ${connectionCount} connection${connectionCount !== 1 ? 's' : ''}`
            : 'Loading...'
        }
        extra={
          <Space>
            <Segmented
              value={viewMode}
              onChange={(v: string | number) => setViewMode(v as '2D' | '3D')}
              options={[
                { label: '2D', value: '2D' },
                { label: '3D', value: '3D' },
              ]}
              size="small"
            />
            {viewMode === '2D' && (
              <Segmented
                value={renderEngine}
                onChange={(v: string | number) =>
                  setRenderEngine(v as 'reactflow' | 'cytoscape' | 'visnetwork')
                }
                options={[
                  { label: 'React Flow', value: 'reactflow' },
                  { label: 'Cytoscape', value: 'cytoscape' },
                  { label: 'vis-network', value: 'visnetwork' },
                ]}
                size="small"
              />
            )}
            {/* Realtime event badge */}
            {realtimeEvents.length > 0 && (
              <Tag icon={<ThunderboltOutlined />} color="blue" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {realtimeEvents[0]}
              </Tag>
            )}
            {viewMode === '2D' && (
              <>
                <Button icon={<FilterOutlined />} onClick={() => setShowFilters((v) => !v)}>
                  {showFilters ? 'Ẩn bộ lọc' : 'Bộ lọc'}
                </Button>
                <Button icon={<PartitionOutlined />} onClick={handleAutoArrange} title="Sắp xếp tự động các nút">
                  Tự động sắp xếp
                </Button>
              </>
            )}
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={loading}>
              Làm mới
            </Button>
            <Button icon={<SaveOutlined />} onClick={() => setSaveModalOpen(true)}>
              Lưu bản chụp
            </Button>
            <Badge count={0} showZero={false}>
              <Button icon={<HistoryOutlined />} onClick={() => setShowSnapshots(true)}>
                Bản chụp
              </Button>
            </Badge>
            {viewMode === '2D' && (
              <>
                <Dropdown
                  menu={{
                    items: [
                      { key: 'png', label: 'Xuất ảnh PNG', icon: <DownloadOutlined />, onClick: exportAsPNG },
                      { key: 'svg', label: 'Xuất ảnh SVG', icon: <DownloadOutlined />, onClick: exportAsSVG },
                      { key: 'json', label: 'Xuất file JSON', icon: <DownloadOutlined />, onClick: exportAsJSON },
                      { key: 'mermaid', label: 'Xuất file Mermaid', icon: <DownloadOutlined />, onClick: exportAsMermaid },
                    ],
                  }}
                >
                  <Button icon={<DownloadOutlined />}>Xuất file</Button>
                </Dropdown>
                <Button
                  icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình'}
                />
              </>
            )}
          </Space>
        }
      />

      {error && (
        <Alert type="error" message="Không thể tải sơ đồ" description={error.message} style={{ margin: '0 24px 16px' }} showIcon />
      )}

      <div
        ref={containerRef}
        style={{ position: 'relative', height: isFullscreen ? '100vh' : CANVAS_H, minHeight: 400 }}
      >
        {loading && !data && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, background: 'rgba(255,255,255,0.7)' }}>
            <Spin size="large" />
            <div style={{ marginTop: 12, color: '#8c8c8c' }}>Đang tải sơ đồ...</div>
          </div>
        )}

        {showFilters && <TopologyFilterPanel filters={filters} onChange={setFilters} />}

        {/* ── 2D VIEW — React Flow (full editor) ── */}
        {viewMode === '2D' && renderEngine === 'reactflow' && (
          <>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={() => { setSelectedNode(null); setSelectedConnection(null); }}
              onNodeDragStop={handleNodeDragStop}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              elevateEdgesOnSelect
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
            <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
            <ConnectionDetailPanel
              connection={selectedConnection}
              onClose={() => setSelectedConnection(null)}
              onDelete={handleDeleteConnection}
              deleting={deleteConnection.isPending}
            />
          </>
        )}

        {/* ── 2D VIEW — Cytoscape.js ── */}
        {viewMode === '2D' && renderEngine === 'cytoscape' && data?.topology && (
          <>
            <TopologyCytoscapeView
              ref={cytoscapeViewRef}
              servers={filteredData.servers}
              connections={filteredData.connections}
              layout={filters.layout === 'hierarchical' ? 'dagre' : 'cose'}
              onNodeClick={(payload) => {
                setSelectedConnection(null);
                if (payload.type === 'server') {
                  const s = data.topology.servers.find((x) => x.id === payload.id);
                  if (s) setSelectedNode({ type: 'server', ...s });
                } else {
                  const dep = data.topology.servers
                    .flatMap((s) => s.deployments.map((d) => ({ d, s })))
                    .find(({ d }) => d.application.id === payload.id);
                  if (dep) {
                    setSelectedNode({
                      type: 'app',
                      id: dep.d.application.id,
                      name: dep.d.application.name,
                      code: dep.d.application.code,
                      deploymentStatus: dep.d.status,
                      environment: dep.d.environment,
                      serverName: dep.s.name,
                    });
                  }
                }
              }}
              onEdgeClick={(conn) => {
                setSelectedNode(null);
                setSelectedConnection(conn);
              }}
            />
            <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
            <ConnectionDetailPanel
              connection={selectedConnection}
              onClose={() => setSelectedConnection(null)}
              onDelete={handleDeleteConnection}
              deleting={deleteConnection.isPending}
            />
          </>
        )}

        {/* ── 2D VIEW — vis-network ── */}
        {viewMode === '2D' && renderEngine === 'visnetwork' && data?.topology && (
          <>
            <TopologyVisNetworkView
              ref={visNetworkViewRef}
              servers={filteredData.servers}
              connections={filteredData.connections}
              layout={filters.layout === 'hierarchical' ? 'hierarchical' : 'physics'}
              onNodeClick={(payload) => {
                setSelectedConnection(null);
                if (payload.type === 'server') {
                  const s = data.topology.servers.find((x) => x.id === payload.id);
                  if (s) setSelectedNode({ type: 'server', ...s });
                } else {
                  const dep = data.topology.servers
                    .flatMap((s) => s.deployments.map((d) => ({ d, s })))
                    .find(({ d }) => d.application.id === payload.id);
                  if (dep) {
                    setSelectedNode({
                      type: 'app',
                      id: dep.d.application.id,
                      name: dep.d.application.name,
                      code: dep.d.application.code,
                      deploymentStatus: dep.d.status,
                      environment: dep.d.environment,
                      serverName: dep.s.name,
                    });
                  }
                }
              }}
              onEdgeClick={(conn) => {
                setSelectedNode(null);
                setSelectedConnection(conn);
              }}
            />
            <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
            <ConnectionDetailPanel
              connection={selectedConnection}
              onClose={() => setSelectedConnection(null)}
              onDelete={handleDeleteConnection}
              deleting={deleteConnection.isPending}
            />
          </>
        )}

        {/* ── 3D VIEW ── */}
        {viewMode === '3D' && data?.topology && (
          <Topology3DView
            servers={filteredData.servers}
            connections={filteredData.connections}
            onNodeSelect={(node) => {
              if (!node) { setSelectedNode(null); return; }
              setSelectedNode({ type: node.type, ...node.data });
            }}
          />
        )}

        {viewMode === '3D' && selectedNode && (
          <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </div>

      {/* Save Snapshot Modal */}
      <Modal
        title="Save Topology Snapshot"
        open={saveModalOpen}
        onOk={handleSaveSnapshot}
        onCancel={() => setSaveModalOpen(false)}
        confirmLoading={createSnapshot.isPending}
        okText="Save"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>Environment: </Text>
            <Text strong>{filters.environment ?? 'All'}</Text>
          </div>
          <Input placeholder="Label (optional)" value={snapshotLabel} onChange={(e) => setSnapshotLabel(e.target.value)} />
        </Space>
      </Modal>

      <CreateConnectionModal
        open={createConnModalVisible}
        sourceApp={connectionDraft?.sourceApp}
        targetApp={connectionDraft?.targetApp}
        onCancel={() => {
          setCreateConnModalVisible(false);
          setConnectionDraft(null);
        }}
        onSubmit={handleCreateConnectionSubmit}
      />

      {/* Snapshot Browser Drawer */}
      <SnapshotBrowser open={showSnapshots} onClose={() => setShowSnapshots(false)} currentEnvironment={filters.environment} />
    </div>
  );
}

export default function TopologyPage() {
  return (
    <App>
      <TopologyPageInner />
    </App>
  );
}
