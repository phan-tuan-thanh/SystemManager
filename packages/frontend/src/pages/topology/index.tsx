import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, {
  type Node, type Edge,
  Controls, MiniMap, Background, BackgroundVariant,
  useNodesState, useEdgesState,
  MarkerType, type ReactFlowInstance, type NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Button, Space, Spin, Alert, Typography, Dropdown, Input, Modal, Badge, App, Tag, Tooltip,
} from 'antd';
import {
  DownloadOutlined, ReloadOutlined, HistoryOutlined, SaveOutlined,
  ThunderboltOutlined, FullscreenOutlined, FullscreenExitOutlined,
  MedicineBoxOutlined, ApiOutlined, CompressOutlined,
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
import { nodeTypes, edgeTypes } from './components/edges';
import { computeLayout, applyDagreLayout, applyElkLayout, computeZoneLaneLayout, getSmartRoute, getSmartRouteWithZones, reflowZoneLanes, reflowZoneNodes, optimalZoneLaneArrangement, rebuildLaneWrappers, resizeZonesFromChildren, ZONE_CONTENT_ORIGIN } from './utils/topologyLayout';
import { useTopologyFilters } from './hooks/useTopologyFilters';
import { useTopologyExport } from './hooks/useTopologyExport';
import { useTopologyQuery, useCreateSnapshot, type ServerNode, type ConnectionEdge, type ImpliedConnectionEdge, type TopologyData, type Snapshot } from './hooks/useTopology';
import { useTopologySubscription } from './hooks/useTopologySubscription';
import { useNetworkZonesWithIps, useTopologyZones } from './hooks/useTopologyZones';
import type { NetworkZone } from '../../types/network-zone';
import ZoneConfigPanel from './components/ZoneConfigPanel';
import { useCreateConnection, useDeleteConnection } from '../../hooks/useConnections';
import PageHeader from '../../components/common/PageHeader';
import dayjs from 'dayjs';

const { Text } = Typography;

// Stable empty reference — avoids infinite re-render from inline `= []` default
const EMPTY_NETWORK_ZONES: NetworkZone[] = [];

interface TopologyFilters {
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
  showZones: boolean;
}

// ─── Per-snapshot view state (every option + positions) ───────────
// Snapshots only store logical servers/connections; the full view (all
// filters/options, render engine, view mode, node positions, zone geometry
// and dragged edge-label offsets) is captured client-side keyed by snapshot
// id so loading re-presents exactly what the user saw when they saved it.
interface SnapshotLayout {
  filters: TopologyFilters;
  viewMode: '2D' | '3D';
  renderEngine: 'reactflow' | 'visnetwork' | 'mermaid';
  showImplied: boolean;
  positions: Record<string, { x: number; y: number }>;
  zones: Record<string, { x: number; y: number; width: number; height: number }>;
  edgeLabelOffsets: Record<string, { x: number; y: number }>;
}
const SNAP_LAYOUT_KEY = 'topology.snapshotLayouts.v1';
function loadSnapshotLayouts(): Record<string, SnapshotLayout> {
  try {
    const raw = localStorage.getItem(SNAP_LAYOUT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SnapshotLayout>) : {};
  } catch {
    return {};
  }
}
function saveSnapshotLayout(id: string, layout: SnapshotLayout) {
  try {
    const all = loadSnapshotLayouts();
    all[id] = layout;
    localStorage.setItem(SNAP_LAYOUT_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

// ─── Persisted view preferences (per-browser) ─────────────────────
// Every toolbar option (filters + view mode + render engine + implied
// toggle) is auto-saved to localStorage so a reload re-presents the exact
// view the user last chose. A reset restores DEFAULT_FILTERS.
const DEFAULT_FILTERS: TopologyFilters = {
  environment: 'PROD', nodeType: 'server', showMiniMap: true, layout: 'force',
  layoutAlgorithm: 'elk-layered', layoutDirection: 'TB', connectionMode: false,
  edgeStyle: 'bezier', visibleGroupNames: [], visibleServerIds: [], visibleAppIds: [], showZones: true,
};

interface ViewPrefs {
  filters: TopologyFilters;
  viewMode: '2D' | '3D';
  renderEngine: 'reactflow' | 'visnetwork' | 'mermaid';
  showImplied: boolean;
}
const VIEW_PREFS_KEY = 'topology.viewPrefs.v1';

function loadViewPrefs(): Partial<ViewPrefs> {
  try {
    const raw = localStorage.getItem(VIEW_PREFS_KEY);
    if (raw) return JSON.parse(raw) as Partial<ViewPrefs>;
  } catch { /* ignore */ }
  // Migrate the legacy single-key render-engine preference.
  try {
    const legacy = localStorage.getItem('topology.renderEngine');
    if (legacy === 'visnetwork' || legacy === 'reactflow' || legacy === 'mermaid') {
      return { renderEngine: legacy };
    }
  } catch { /* ignore */ }
  return {};
}

function saveViewPrefs(prefs: ViewPrefs) {
  try { localStorage.setItem(VIEW_PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

// ─── Edge handle balancing ────────────────────────────────────────
// When multiple edges connect to the same node, distribute their handles
// across available options (top/bottom) to prevent stacking.
function balanceEdgeHandles(edges: Edge[]): Edge[] {
  const edgesByTarget = new Map<string, Edge[]>();
  for (const edge of edges) {
    const key = edge.target as string;
    const arr = edgesByTarget.get(key);
    if (arr) arr.push(edge);
    else edgesByTarget.set(key, [edge]);
  }

  // For each target node with multiple edges, reassign handles to spread them
  for (const [_, targetEdges] of edgesByTarget) {
    if (targetEdges.length <= 1) continue;
    const handles: Array<'bot-t' | 'top-t'> = ['bot-t', 'top-t'];
    targetEdges.forEach((edge, idx) => {
      const handle = handles[idx % handles.length];
      edge.targetHandle = handle;
    });
  }

  // Similarly balance source handles
  const edgesBySource = new Map<string, Edge[]>();
  for (const edge of edges) {
    const key = edge.source as string;
    const arr = edgesBySource.get(key);
    if (arr) arr.push(edge);
    else edgesBySource.set(key, [edge]);
  }

  for (const [_, sourceEdges] of edgesBySource) {
    if (sourceEdges.length <= 1) continue;
    const handles: Array<'bot-s' | 'top-s'> = ['bot-s', 'top-s'];
    sourceEdges.forEach((edge, idx) => {
      const handle = handles[idx % handles.length];
      edge.sourceHandle = handle;
    });
  }

  return edges;
}

// ─── Main Component ───────────────────────────────────────────────

function TopologyPageInner() {
  const [bootPrefs] = useState(loadViewPrefs);
  const [viewMode, setViewMode] = useState<'2D' | '3D'>(bootPrefs.viewMode ?? '2D');
  const [renderEngine, setRenderEngine] = useState<'reactflow' | 'visnetwork' | 'mermaid'>(bootPrefs.renderEngine ?? 'visnetwork');

  const handleViewModeChange = useCallback((v: '2D' | '3D') => {
    setViewMode(v);
    if (v === '3D') setFilters((f) => f.connectionMode ? { ...f, connectionMode: false } : f);
  }, []);

  const handleRenderEngineChange = useCallback((v: 'reactflow' | 'visnetwork' | 'mermaid') => {
    setRenderEngine(v);
    if (v !== 'reactflow') setFilters((f) => f.connectionMode ? { ...f, connectionMode: false } : f);
  }, []);

  const [filters, setFilters] = useState<TopologyFilters>(
    bootPrefs.filters ? { ...DEFAULT_FILTERS, ...bootPrefs.filters } : DEFAULT_FILTERS,
  );

  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionEdge | null>(null);
  const [selectedImplied, setSelectedImplied] = useState<ImpliedConnectionEdge | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [showSnapshots, setShowSnapshots] = useState(false);
  // When set, the topology renders from this saved snapshot instead of live data
  const [snapshotView, setSnapshotView] = useState<{ payload: TopologyData; meta: Snapshot } | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [realtimeEvents, setRealtimeEvents] = useState<string[]>([]);
  const [createConnModalVisible, setCreateConnModalVisible] = useState(false);
  const [connectionDraft, setConnectionDraft] = useState<any>(null);
  const [healthDrawerOpen, setHealthDrawerOpen] = useState(false);
  const [showImplied, setShowImplied] = useState(bootPrefs.showImplied ?? true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutRevision, setLayoutRevision] = useState(0);

  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const visNetworkViewRef = useRef<TopologyVisNetworkHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  // Persisted zone-lane geometry after drag-resize, restored on recompute
  const zoneLayoutRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const positionsModeRef = useRef<string>(filters.nodeType);
  // Dragged edge-label offsets restored from a loaded snapshot
  const edgeLabelOffsetsRef = useRef<Record<string, { x: number; y: number }>>({});
  const appliedRevisionRef = useRef(0);
  const setEdgesRef = useRef<((updater: (edges: Edge[]) => Edge[]) => void) | null>(null);

  const stableUpdateEdgeLabel = useCallback((edgeId: string, dx: number, dy: number) => {
    setEdgesRef.current?.((prev: Edge[]) => prev.map((e: Edge) => {
      if (e.id !== edgeId) return e;
      return { ...e, data: { ...e.data, labelOffsetX: (e.data?.labelOffsetX ?? 0) + dx, labelOffsetY: (e.data?.labelOffsetY ?? 0) + dy } };
    }));
  }, []);

  // Auto-persist toolbar options. Skipped while viewing a snapshot so the
  // snapshot's temporary view never overwrites the live preferences.
  useEffect(() => {
    if (snapshotView) return;
    saveViewPrefs({ filters, viewMode, renderEngine, showImplied });
  }, [filters, viewMode, renderEngine, showImplied, snapshotView]);

  const handleResetOptions = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setViewMode('2D');
    setRenderEngine('visnetwork');
    setShowImplied(true);
    userPositionsRef.current = {};
    zoneLayoutRef.current = {};
    edgeLabelOffsetsRef.current = {};
    setLayoutRevision((r) => r + 1);
  }, []);

  // Exit snapshot view → restore the user's saved live options (persistence
  // was paused during the snapshot, so localStorage still holds them).
  const handleExitSnapshot = useCallback(() => {
    const live = loadViewPrefs();
    if (live.filters) setFilters({ ...DEFAULT_FILTERS, ...live.filters });
    if (live.viewMode) setViewMode(live.viewMode);
    if (live.renderEngine) setRenderEngine(live.renderEngine);
    if (typeof live.showImplied === 'boolean') setShowImplied(live.showImplied);
    setSnapshotView(null);
    userPositionsRef.current = {};
    zoneLayoutRef.current = {};
    edgeLabelOffsetsRef.current = {};
    setLayoutRevision((r) => r + 1);
  }, []);

  const { data, loading, error, refetch } = useTopologyQuery(filters.environment);
  const createSnapshot = useCreateSnapshot();
  const createConnection = useCreateConnection();
  const deleteConnection = useDeleteConnection();
  const { message, modal } = App.useApp();

  // When viewing a saved snapshot, the whole page renders from its payload
  // instead of the live query result.
  const effectiveTopology = snapshotView?.payload ?? data?.topology;

  // ─── Filters & computed options ──────────────────────────────────
  const { filteredData, dropdownOptions, cascadeMaps, healthIssueCount } = useTopologyFilters(
    effectiveTopology, filters,
  );
  const { groupOptions, serverOptions, appOptions } = dropdownOptions;
  const { serverGroupsMap, serverAppsMap } = cascadeMaps;

  // ─── Zone mode ────────────────────────────────────────────────────
  const { data: networkZones = EMPTY_NETWORK_ZONES } = useNetworkZonesWithIps(filters.environment);
  const {
    zones: allTopologyZones,
    activeZones,
    serversByZone,
    reorderZones,
    setZoneArrangement,
    assignServer,
    resetZones,
  } = useTopologyZones(filteredData.serversForEdgeResolution, networkZones);

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
    if (!effectiveTopology) return { nodes: [], edges: [] };

    const layoutServers = filters.nodeType === 'server' ? filteredData.serversForEdgeResolution : filteredData.servers;
    const layoutConnections = filters.nodeType === 'server' ? filteredData.connectionsForEdgeResolution : filteredData.connections;

    // Zone lane mode: stack servers in swimlane rows grouped by NetworkZone
    if (filters.showZones && filters.nodeType !== 'app' && activeZones.length > 0) {
      const result = computeZoneLaneLayout(
        serversByZone, activeZones, layoutConnections, filters.nodeType, filters.layoutDirection, filters.edgeStyle,
      );
      // Elevate edges above zone lane background panels (edge SVG layer is behind nodes by default)
      // and attach label-move callback for ProtocolEdge labels
      const zoneEdges = result.edges.map((e) => ({
        ...e,
        zIndex: 5,
        data: { ...e.data, onLabelMove: (dx: number, dy: number) => stableUpdateEdgeLabel(e.id, dx, dy) },
      }));

      // Implied connections in zone mode
      const zoneImpliedEdges: Edge[] = [];
      if (showImplied && effectiveTopology.impliedConnections) {
        const FW_ACTION: Record<string, { color: string }> = {
          ALLOW: { color: '#389e0d' },
          DENY:  { color: '#cf1322' },
        };
        const allZoneNodes = result.nodes;
        const zoneNodeMap = new Map(allZoneNodes.map((n) => [n.id, n]));
        const addedServerPairs = new Map<string, Set<string>>();
        effectiveTopology.impliedConnections.forEach((ic: ImpliedConnectionEdge) => {
          const action = ic.action ?? 'ALLOW';
          const cfg = FW_ACTION[action] ?? FW_ACTION.ALLOW;
          const portNum = ic.targetPort?.portNumber ?? (ic.targetPort as any)?.port_number;
          const commonEdgeProps = {
            type: 'fwEdge' as const,
            animated: false,
            zIndex: 10,
            markerEnd: { type: MarkerType.ArrowClosed, color: cfg.color },
            data: { type: 'IMPLIED', action, firewallRuleId: ic.firewallRuleId, firewallRuleName: ic.firewallRuleName, portNum, expiresAt: ic.expiresAt, neverExpires: ic.neverExpires, edgeStyle: filters.edgeStyle, _implied: ic },
          };
          const pushServerPair = (srcId: string, tgtId: string) => {
            if (srcId === tgtId) return;
            const srcNodeId = `server-${srcId}`;
            const tgtNodeId = `server-${tgtId}`;
            if (!allZoneNodes.some((n) => n.id === srcNodeId) || !allZoneNodes.some((n) => n.id === tgtNodeId)) return;
            const pairKey = `${action}::${srcId}::${tgtId}`;
            if (!addedServerPairs.has(action)) addedServerPairs.set(action, new Set());
            if (addedServerPairs.get(action)!.has(pairKey)) return;
            addedServerPairs.get(action)!.add(pairKey);
            const srcNode = zoneNodeMap.get(srcNodeId);
            const tgtNode = zoneNodeMap.get(tgtNodeId);
            const handles = (srcNode?.parentId && tgtNode?.parentId)
              ? getSmartRouteWithZones(srcNodeId, tgtNodeId, zoneNodeMap)
              : getSmartRoute(srcNodeId, tgtNodeId, zoneNodeMap);
            zoneImpliedEdges.push({
              id: `implied-srv-${action}-${srcId}-${tgtId}`,
              source: srcNodeId,
              target: tgtNodeId,
              ...commonEdgeProps,
              ...handles,
            });
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

      return { nodes: result.nodes, edges: [...zoneEdges, ...zoneImpliedEdges] };
    }

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

    if (showImplied && effectiveTopology.impliedConnections) {
      const allNodes = result.nodes;
      const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
      const addedServerPairs = new Map<string, Set<string>>();

      effectiveTopology.impliedConnections.forEach((ic: ImpliedConnectionEdge) => {
        const action = ic.action ?? 'ALLOW';
        const cfg = FW_ACTION[action] ?? FW_ACTION.ALLOW;
        const portNum = ic.targetPort?.portNumber ?? (ic.targetPort as any)?.port_number;

        const commonEdgeProps = {
          type: 'fwEdge' as const,
          animated: false,
          zIndex: 10,
          markerEnd: { type: MarkerType.ArrowClosed, color: cfg.color },
          data: { type: 'IMPLIED', action, firewallRuleId: ic.firewallRuleId, firewallRuleName: ic.firewallRuleName, portNum, expiresAt: ic.expiresAt, neverExpires: ic.neverExpires, edgeStyle: filters.edgeStyle, _implied: ic },
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
          const srcNode = nodeMap.get(srcNodeId);
          const tgtNode = nodeMap.get(tgtNodeId);
          const handles = (srcNode?.parentId && tgtNode?.parentId)
            ? getSmartRouteWithZones(srcNodeId, tgtNodeId, nodeMap)
            : getSmartRoute(srcNodeId, tgtNodeId, nodeMap);
          impliedEdges.push({
            id: `implied-srv-${action}-${srcId}-${tgtId}`,
            source: srcNodeId,
            target: tgtNodeId,
            ...commonEdgeProps,
            ...handles,
          });
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
  }, [filteredData, filters.nodeType, filters.layoutDirection, filters.edgeStyle, filters.showZones, activeZones, serversByZone, stableUpdateEdgeLabel, showImplied, effectiveTopology]);

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges);

  useEffect(() => { setEdgesRef.current = setEdges; }, [setEdges]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useMemo(() => {
    const modeKey = filters.nodeType + (filters.showZones ? ':zone' : '');
    if (positionsModeRef.current !== modeKey) {
      userPositionsRef.current = {};
      zoneLayoutRef.current = {};
      positionsModeRef.current = modeKey;
    }
    // Revision bump: clear server positions but NOT zone positions.
    // Zone positions survive intentional server→zone reassignment so the user's
    // custom zone arrangement is preserved. handleAutoArrange explicitly clears
    // zoneLayoutRef before bumping the revision when a full reset is needed.
    if (layoutRevision > appliedRevisionRef.current) {
      userPositionsRef.current = {};
      appliedRevisionRef.current = layoutRevision;
    }
    // Skip laneWrapper nodes here — they will be rebuilt below from the
    // actual (zoneLayoutRef-adjusted) zone positions so they always match.
    const merged = computedNodes
      .filter((node) => node.type !== 'laneWrapper')
      .map((node) => {
        if (node.type === 'zoneLane') {
          const z = zoneLayoutRef.current[node.id];
          // Restore saved position AND size. The size is then corrected by
          // resizeZonesFromChildren so it always encompasses the actual
          // server positions — including custom-dragged positions that differ
          // from the default layout sizes stored here.
          return z
            ? { ...node, position: { x: z.x, y: z.y }, style: { ...node.style, width: z.width, height: z.height } }
            : node;
        }
        const savedPos = userPositionsRef.current[node.id];
        return savedPos ? { ...node, position: savedPos } : node;
      });
    // 1. Resize every zone to tightly fit its children at their ACTUAL
    //    positions (custom-dragged or default). This corrects stale sizes in
    //    zoneLayoutRef after server moves, and handles servers dragged to
    //    positions that exceed the default-layout zone height/width.
    // 2. Rebuild laneWrapper panels from the corrected zone geometry.
    const mergedNodes = rebuildLaneWrappers(resizeZonesFromChildren(merged));
    setNodes(mergedNodes);
    const offs = edgeLabelOffsetsRef.current;
    const mergedEdges = Object.keys(offs).length === 0
      ? computedEdges
      : computedEdges.map((e) => {
          const o = offs[e.id];
          return o ? { ...e, data: { ...e.data, labelOffsetX: o.x, labelOffsetY: o.y } } : e;
        });
    // Balance handles when multiple edges connect to/from the same node
    const balancedEdges = balanceEdgeHandles(mergedEdges);
    setEdges(balancedEdges);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedNodes, computedEdges, filters.nodeType, filters.showZones, layoutRevision]);

  useEffect(() => {
    const id = requestAnimationFrame(() => { reactFlowRef.current?.fitView({ padding: 0.2, duration: 300 }); });
    return () => cancelAnimationFrame(id);
  }, [filters.nodeType]);

  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  const edgesRef = useRef(edges);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  // Set by drag-stop; consumed by the reroute effect once node positions settle.
  const pendingRerouteRef = useRef(false);

  // ─── Focus highlight ────────────────────────────────────────────
  const displayNodes = useMemo(() => {
    if (!focusedNodeId) return nodes;
    const highlighted = new Set<string>([focusedNodeId]);
    nodes.forEach((n) => { if (n.parentId === focusedNodeId) highlighted.add(n.id); });
    edges.forEach((e) => {
      if (highlighted.has(e.source) || highlighted.has(e.target)) { highlighted.add(e.source); highlighted.add(e.target); }
    });
    nodes.forEach((n) => { if (n.parentId && highlighted.has(n.id)) highlighted.add(n.parentId); });
    nodes.forEach((n) => { if (n.parentId && highlighted.has(n.parentId)) highlighted.add(n.id); });
    return nodes.map((n) => ({ ...n, style: { ...n.style, opacity: highlighted.has(n.id) ? 1 : 0.12, transition: 'opacity 0.2s ease' } }));
  }, [nodes, edges, focusedNodeId]);

  const displayEdges = useMemo(() => {
    if (!focusedNodeId) return edges;
    const childIds = new Set(nodes.filter((n) => n.parentId === focusedNodeId).map((n) => n.id));
    childIds.add(focusedNodeId);
    return edges.map((e) => {
      const isHighlighted = childIds.has(e.source) || childIds.has(e.target);
      return { ...e, style: { ...e.style, opacity: isHighlighted ? 1 : 0.08, strokeWidth: isHighlighted ? 3 : (e.style?.strokeWidth ?? 2) }, zIndex: isHighlighted ? 10 : 0 };
    });
  }, [edges, nodes, focusedNodeId]);

  useEffect(() => {
    if (!focusedNodeId || renderEngine !== 'reactflow') return;
    const highlighted = new Set<string>([focusedNodeId]);
    nodesRef.current.forEach((n) => { if (n.parentId === focusedNodeId) highlighted.add(n.id); });
    edgesRef.current.forEach((e) => {
      if (highlighted.has(e.source) || highlighted.has(e.target)) { highlighted.add(e.source); highlighted.add(e.target); }
    });
    nodesRef.current.forEach((n) => { if (n.parentId && highlighted.has(n.id)) highlighted.add(n.parentId); });
    requestAnimationFrame(() => {
      reactFlowRef.current?.fitView({ nodes: [...highlighted].map((id) => ({ id })), duration: 500, padding: 0.3, minZoom: 0.2, maxZoom: 1.5 });
    });
  }, [focusedNodeId, renderEngine]);

  // Re-evaluate handle selection for every server↔server edge against the
  // CURRENT node positions. Called after a drag settles so connections
  // re-route per the smart rules when nodes (or zones) move.
  const rerouteEdges = useCallback(() => {
    const nodeMap = new Map(nodesRef.current.map((n) => [n.id, n]));
    setEdges((eds) => eds.map((e) => {
      const srcNode = nodeMap.get(e.source);
      const tgtNode = nodeMap.get(e.target);
      if (srcNode?.type !== 'serverNode' || tgtNode?.type !== 'serverNode') return e;
      // Use zone-aware routing if both nodes are in zones, else use standard routing.
      const route = (srcNode.parentId && tgtNode.parentId)
        ? getSmartRouteWithZones(e.source, e.target, nodeMap)
        : getSmartRoute(e.source, e.target, nodeMap);
      const newSrc = route.sourceHandle ?? null;
      const newTgt = route.targetHandle ?? null;
      if ((e.sourceHandle ?? null) === newSrc && (e.targetHandle ?? null) === newTgt) return e;
      return { ...e, sourceHandle: newSrc, targetHandle: newTgt };
    }));
  }, [setEdges]);

  // Reroute connections after node positions settle from a drag. The effect
  // fires on the next `nodes` change (post setNodes in the branches below),
  // by which point nodesRef holds the final snapped/reflowed coordinates.
  useEffect(() => {
    if (!pendingRerouteRef.current) return;
    pendingRerouteRef.current = false;
    rerouteEdges();
  }, [nodes, rerouteEdges]);

  // ─── Drag & snap handlers ─────────────────────────────────────
  const handleNodeDragStop = useCallback((_evt: React.MouseEvent, node: Node) => {
    // After a server/zone drag repositions nodes, flag a reroute so the effect
    // above re-evaluates edge handles at the new positions.
    if (node.type === 'serverNode' || node.type === 'zoneLane') {
      pendingRerouteRef.current = true;
    }
    const parentId = node.parentId;

    // App node inside server container → snap to vertical stack
    if (parentId && node.type === 'appNode') {
      const STACK_PADDING_X = 14;
      const STACK_PADDING_Y = 48;
      const STACK_APP_H = 30;
      const STACK_GAP = 4;
      const siblings = nodesRef.current.filter((n) => n.parentId === parentId);
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

    // Zone lane dragged → cluster zones into lanes by overlap on the CROSS
    // axis (Y for LR/RL rows, X for TB/BT columns); within a lane order by
    // the MAIN axis. Drop a zone so it overlaps a lane → it joins; drop into
    // empty space → new lane. Persist grid (lane + order) and re-stack.
    if (node.type === 'zoneLane' && filters.showZones) {
      const stackH = filters.layoutDirection === 'LR' || filters.layoutDirection === 'RL';
      setNodes((nds) => {
        const moved = nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n));

        const zoneNodes = moved.filter((n) => n.type === 'zoneLane');
        // Cross-axis span used to cluster, main-axis position used to order.
        const crossLo = (n: Node) => (stackH ? n.position.y : n.position.x);
        const crossHi = (n: Node) => {
          const sz = stackH
            ? (n.style?.height as number) ?? (n.height as number) ?? 200
            : (n.style?.width as number) ?? (n.width as number) ?? 200;
          return crossLo(n) + sz;
        };
        const mainPos = (n: Node) => (stackH ? n.position.x : n.position.y);

        const dragged = zoneNodes.find((n) => n.id === node.id);
        const others = zoneNodes.filter((n) => n.id !== node.id);

        // Keep EXISTING lanes intact by grouping the non-dragged zones on
        // their stable data.lane. A naive overlap re-cluster of all zones
        // chain-merges: a zone dropped in the gap bridges two lanes, its
        // expanded bounds then swallow the next lane, and so on. Holding the
        // other lanes fixed and only re-homing the dragged zone avoids that.
        const laneGroups = new Map<number, Node[]>();
        for (const z of others) {
          const ln = Number((z.data as { lane?: number } | undefined)?.lane ?? 0);
          const arr = laneGroups.get(ln);
          if (arr) arr.push(z);
          else laneGroups.set(ln, [z]);
        }

        const laneBands = [...laneGroups.values()]
          .map((zs) => ({
            lo: Math.min(...zs.map(crossLo)),
            hi: Math.max(...zs.map(crossHi)),
            zones: [...zs],
          }))
          .sort((a, b) => a.lo - b.lo);

        // Home the dragged zone into the existing lane it overlaps MOST on
        // the cross axis. Require ≥50% of its own cross size to actually
        // join; a drop landing mostly in a gap becomes its own new lane,
        // slotted into position by cross-axis order.
        if (dragged) {
          const dLo = crossLo(dragged);
          const dHi = crossHi(dragged);
          const dSize = Math.max(1, dHi - dLo);
          let best: { lo: number; hi: number; zones: Node[] } | null = null;
          let bestOverlap = 0;
          for (const band of laneBands) {
            const overlap = Math.min(dHi, band.hi) - Math.max(dLo, band.lo);
            if (overlap > bestOverlap) {
              bestOverlap = overlap;
              best = band;
            }
          }
          if (best && bestOverlap >= dSize * 0.5) {
            best.zones.push(dragged);
          } else {
            laneBands.push({ lo: dLo, hi: dHi, zones: [dragged] });
          }
        }

        laneBands.sort((a, b) => a.lo - b.lo);

        // Flatten to (lane asc, main asc) with lane index; tag data.lane.
        const laneOf = new Map<string, number>();
        const items: { id: string; lane: number }[] = [];
        laneBands.forEach((r, laneIdx) => {
          r.zones
            .slice()
            .sort((a, b) => mainPos(a) - mainPos(b))
            .forEach((z) => {
              laneOf.set(z.id, laneIdx);
              items.push({ id: z.id.replace(/^zone-/, ''), lane: laneIdx });
            });
        });
        setZoneArrangement(items);

        const withLane = moved.map((n) =>
          n.type === 'zoneLane' && laneOf.has(n.id)
            ? { ...n, data: { ...n.data, lane: laneOf.get(n.id) } }
            : n,
        );
        const reflowed = reflowZoneLanes(withLane, stackH);
        reflowed.forEach((n) => {
          if (n.type === 'zoneLane') {
            zoneLayoutRef.current[n.id] = {
              x: n.position.x, y: n.position.y,
              width: n.style?.width as number, height: n.style?.height as number,
            };
          }
        });
        return reflowed;
      });
      return;
    }

    // Server node dragged inside a zone lane → snap to grid within the same
    // zone. Cross-zone reassignment via drag is intentionally disabled — nodes
    // are always constrained to their own zone visually and on drop.
    if (parentId && filters.showZones) {
      const parent = nodesRef.current.find((n) => n.id === parentId);
      if (parent?.type === 'zoneLane') {
        const stackH = filters.layoutDirection === 'LR' || filters.layoutDirection === 'RL';
        // Snap all siblings in this zone to column-stack grid, then resize lanes.
        setNodes((nds) => {
          const moved = nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n));
          const snapped = reflowZoneNodes(moved, parentId);
          const reflowed = reflowZoneLanes(snapped, stackH, true);
          reflowed.forEach((n) => {
            if (n.type === 'zoneLane') {
              zoneLayoutRef.current[n.id] = {
                x: n.position.x, y: n.position.y,
                width: n.style?.width as number, height: n.style?.height as number,
              };
            } else if (n.parentId) {
              userPositionsRef.current[n.id] = { x: n.position.x, y: n.position.y };
            }
          });
          return reflowed;
        });
        return;
      }
    }

    const GAP = 8;
    const { x, y } = node.position;
    const nW = node.width ?? 160;
    const nH = node.height ?? 44;
    // In zone mode servers have a zone lane parentId — collide only against zone siblings
    const topSiblings = parentId
      ? nodesRef.current.filter((other) => other.id !== node.id && other.parentId === parentId)
      : nodesRef.current.filter((other) => other.id !== node.id && !other.parentId);
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

    // Clean up drop hints when drag stops.
    setNodes((nds) => nds.filter((n) => n.id !== 'lanewrap-drophint' && n.id !== 'lanewrap-server-hint'));
  }, [setNodes, filters.showZones, filters.layoutDirection, setZoneArrangement, assignServer]);

  // Live: while a server is dragged inside a zone, grow the zone right/bottom
  // only (grow-only path) and re-stack the sibling zones to keep spacing.
  // Left/top fitting is intentionally NOT done live — it is finalized once on
  // drag stop (handleNodeDragStop normalizes) to avoid the dragged node
  // shifting against the pointer.
  const handleNodeDrag = useCallback((_evt: React.MouseEvent, node: Node) => {
    if (!filters.showZones) return;

    // Dragging a whole zone → show a dashed wrapper where it will land:
    // over an existing lane it overlaps, or a new-lane band in empty space.
    if (node.type === 'zoneLane') {
      const stackH = filters.layoutDirection === 'LR' || filters.layoutDirection === 'RL';
      const dh = (node.height as number) ?? (node.style?.height as number) ?? 200;
      const dw = (node.style?.width as number) ?? (node.width as number) ?? 200;

      const bands = new Map<number, { minX: number; minY: number; maxX: number; maxY: number }>();
      for (const z of nodesRef.current) {
        if (z.type !== 'zoneLane' || z.id === node.id) continue;
        const lane = Number((z.data as { lane?: number } | undefined)?.lane ?? 0);
        const zw = (z.style?.width as number) ?? (z.width as number) ?? 200;
        const zh = (z.style?.height as number) ?? (z.height as number) ?? 200;
        const b = bands.get(lane);
        bands.set(lane, b
          ? { minX: Math.min(b.minX, z.position.x), minY: Math.min(b.minY, z.position.y), maxX: Math.max(b.maxX, z.position.x + zw), maxY: Math.max(b.maxY, z.position.y + zh) }
          : { minX: z.position.x, minY: z.position.y, maxX: z.position.x + zw, maxY: z.position.y + zh });
      }
      const lo = (bb: { minX: number; minY: number }) => (stackH ? bb.minY : bb.minX);
      const hi = (bb: { maxX: number; maxY: number }) => (stackH ? bb.maxY : bb.maxX);
      const sorted = [...bands.values()].sort((a, b) => lo(a) - lo(b));

      const PAD = 18;
      // Match the drop logic exactly: pick the lane the dragged zone overlaps
      // MOST on the cross axis, requiring ≥50% of its own cross size to join.
      // Otherwise preview a brand-new lane slotted in by cross-axis order.
      const dLo = stackH ? node.position.y : node.position.x;
      const dHi = stackH ? node.position.y + dh : node.position.x + dw;
      const dSize = Math.max(1, dHi - dLo);
      let target: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
      let bestOverlap = 0;
      let bestIdx = -1;
      for (let i = 0; i < sorted.length; i++) {
        const band = sorted[i];
        const overlap = Math.min(dHi, hi(band)) - Math.max(dLo, lo(band));
        if (overlap > bestOverlap) { bestOverlap = overlap; target = band; bestIdx = i; }
      }
      let displayIdx: number;
      if (target && bestOverlap >= dSize * 0.5) {
        displayIdx = bestIdx;
      } else {
        target = null;
        displayIdx = sorted.filter((b) => lo(b) < dLo).length;
      }

      let hint: Node;
      if (target) {
        // Join an existing lane: extend the lane band along the MAIN axis to
        // include the dragged zone (X for rows, Y for columns).
        const x0 = stackH ? Math.min(target.minX, node.position.x) : target.minX;
        const y0 = stackH ? target.minY : Math.min(target.minY, node.position.y);
        const x1 = stackH ? Math.max(target.maxX, node.position.x + dw) : target.maxX;
        const y1 = stackH ? target.maxY : Math.max(target.maxY, node.position.y + dh);
        hint = {
          id: 'lanewrap-drophint', type: 'laneWrapper',
          position: { x: x0 - PAD, y: y0 - PAD },
          style: { width: (x1 - x0) + PAD * 2, height: (y1 - y0) + PAD * 2 },
          data: { kind: 'hint', lane: displayIdx, isNewLane: false },
          selectable: false, draggable: false, zIndex: 50,
        };
      } else {
        hint = {
          id: 'lanewrap-drophint', type: 'laneWrapper',
          position: { x: node.position.x - PAD, y: node.position.y - PAD },
          style: { width: dw + PAD * 2, height: dh + PAD * 2 },
          data: { kind: 'hint', lane: displayIdx, isNewLane: true },
          selectable: false, draggable: false, zIndex: 50,
        };
      }
      // Remove server hint when dropping zone into a lane.
      setNodes((nds) => [...nds.filter((n) => n.id !== 'lanewrap-drophint' && n.id !== 'lanewrap-server-hint'), hint]);
      return;
    }

    if (!node.parentId) return;
    const parent = nodesRef.current.find((n) => n.id === node.parentId);
    if (parent?.type !== 'zoneLane') return;
    const stackH = filters.layoutDirection === 'LR' || filters.layoutDirection === 'RL';

    // When dragging a server, show a lane wrapper hint indicating which lane
    // it would drop into (similar to zone drag).
    if (node.id.startsWith('server-')) {
      const nW = (node.width as number) ?? (node.style?.width as number) ?? 200;
      const nH = (node.height as number) ?? (node.style?.height as number) ?? 150;
      const absX = parent.position.x + node.position.x + nW / 2;
      const absY = parent.position.y + node.position.y + nH / 2;
      const cc = stackH ? absY : absX;

      // Calculate lane bands (same as in drag drop).
      const bands = new Map<number, { minX: number; minY: number; maxX: number; maxY: number; idx: number }>();
      const zoneNodes = nodesRef.current.filter((z) => z.type === 'zoneLane');
      for (const z of zoneNodes) {
        const lane = Number((z.data as { lane?: number } | undefined)?.lane ?? 0);
        const zw = (z.style?.width as number) ?? (z.width as number) ?? 200;
        const zh = (z.style?.height as number) ?? (z.height as number) ?? 200;
        const b = bands.get(lane);
        bands.set(lane, b
          ? { minX: Math.min(b.minX, z.position.x), minY: Math.min(b.minY, z.position.y), maxX: Math.max(b.maxX, z.position.x + zw), maxY: Math.max(b.maxY, z.position.y + zh), idx: b.idx }
          : { minX: z.position.x, minY: z.position.y, maxX: z.position.x + zw, maxY: z.position.y + zh, idx: lane });
      }

      const lo = (bb: any) => (stackH ? bb.minY : bb.minX);
      const hi = (bb: any) => (stackH ? bb.maxY : bb.maxX);
      const sorted = [...bands.values()].sort((a, b) => lo(a) - lo(b));

      let targetBand = null;
      let displayIdx = 0;
      for (let i = 0; i < sorted.length; i++) {
        const band = sorted[i];
        if (cc >= lo(band) - 24 && cc <= hi(band) + 24) { targetBand = band; displayIdx = i; break; }
        if (cc > hi(band) + 24) displayIdx = i + 1;
      }

      const PAD = 18;
      let hint: Node;
      if (targetBand) {
        // Show wrapper for existing lane band.
        const x0 = targetBand.minX;
        const y0 = targetBand.minY;
        const x1 = targetBand.maxX;
        const y1 = targetBand.maxY;
        hint = {
          id: 'lanewrap-server-hint', type: 'laneWrapper',
          position: { x: x0 - PAD, y: y0 - PAD },
          style: { width: (x1 - x0) + PAD * 2, height: (y1 - y0) + PAD * 2 },
          data: { kind: 'hint', lane: displayIdx, isNewLane: false },
          selectable: false, draggable: false, zIndex: 49,
        };
      } else {
        // Show wrapper for a hypothetical new lane in the current area.
        hint = {
          id: 'lanewrap-server-hint', type: 'laneWrapper',
          position: { x: parent.position.x - PAD, y: parent.position.y - PAD },
          style: { width: (parent.style?.width as number ?? 400) + PAD * 2, height: 120 },
          data: { kind: 'hint', lane: displayIdx, isNewLane: false },
          selectable: false, draggable: false, zIndex: 49,
        };
      }
      setNodes((nds) => [...nds.filter((n) => n.id !== 'lanewrap-server-hint'), hint]);
    }

    // Live resize zone when dragging server inside.
    // Clamp the node to the padded content origin so it can't exit the zone
    // through the left or top edge — the zone only grows right/bottom live.
    const clampedPos = {
      x: Math.max(node.position.x, ZONE_CONTENT_ORIGIN.x),
      y: Math.max(node.position.y, ZONE_CONTENT_ORIGIN.y),
    };
    setNodes((nds) => {
      const live = nds.map((n) => (n.id === node.id ? { ...n, position: clampedPos } : n));
      return reflowZoneLanes(live, stackH);
    });
  }, [setNodes, filters.showZones, filters.layoutDirection]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    const ALIGN_THRESHOLD = 14;
    const alignedChanges = changes.map((change) => {
      if (change.type !== 'position' || change.dragging !== false || !change.position) return change;
      const draggedNode = nodesRef.current.find((n) => n.id === change.id);
      const parentId = draggedNode?.parentId;
      let { x, y } = change.position;
      let snappedX = false;
      let snappedY = false;
      for (const other of nodesRef.current) {
        if (other.id === change.id) continue;
        if (other.type === 'laneWrapper') continue;
        const isSibling = parentId ? other.parentId === parentId : !other.parentId;
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

  // ─── Fit view (zoom to show the whole diagram, no re-layout) ──────
  const handleFitView = useCallback(() => {
    if (renderEngine === 'visnetwork') {
      visNetworkViewRef.current?.fit();
      return;
    }
    if (renderEngine === 'reactflow') {
      reactFlowRef.current?.fitView({
        padding: 0.2, duration: 500, minZoom: 0.1, maxZoom: 1.5,
        includeHiddenNodes: false,
      });
    }
  }, [renderEngine]);

  // ─── Auto-arrange ─────────────────────────────────────────────
  const handleAutoArrange = useCallback(async () => {
    if (renderEngine === 'visnetwork') { visNetworkViewRef.current?.autoArrange(); return; }

    // Zone mode: distribute zones into the column count that best fills the
    // viewport, persist it, then bump revision so computeZoneLaneLayout
    // re-applies the optimal grid.
    if (filters.showZones) {
      const vp = containerRef.current;
      const stackH = filters.layoutDirection === 'LR' || filters.layoutDirection === 'RL';
      const arrangement = optimalZoneLaneArrangement(
        nodesRef.current,
        vp?.clientWidth ?? window.innerWidth,
        vp?.clientHeight ?? window.innerHeight,
        stackH,
      );
      if (arrangement.length) setZoneArrangement(arrangement);
      // Explicitly reset both refs so the recomputed zone grid is used fresh.
      zoneLayoutRef.current = {};
      userPositionsRef.current = {};
      setLayoutRevision((r) => r + 1);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        reactFlowRef.current?.fitView({ padding: 0.2, duration: 500, minZoom: 0.15, maxZoom: 1.5, includeHiddenNodes: false });
      }));
      return;
    }

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
  }, [renderEngine, filters.showZones, filters.layoutAlgorithm, filters.layoutDirection, nodes, edges, setNodes, setZoneArrangement]);

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
    effectiveTopology,
    filters.environment,
    (msg) => message.error(msg),
    (msg) => message.success(msg),
  );

  const handleSaveSnapshot = async () => {
    try {
      const res: any = await createSnapshot.mutateAsync({ label: snapshotLabel || undefined, environment: filters.environment });
      const newId: string | undefined = res?.data?.id ?? res?.id;
      // Capture the current canvas arrangement so loading this snapshot later
      // re-presents the exact layout (snapshots themselves are logical-only).
      if (newId) {
        const positions: Record<string, { x: number; y: number }> = {};
        const zones: Record<string, { x: number; y: number; width: number; height: number }> = {};
        nodesRef.current.forEach((n) => {
          if (n.type === 'laneWrapper') {
            // Wrappers are derived from the layout — not persisted.
            return;
          }
          if (n.type === 'zoneLane') {
            zones[n.id] = {
              x: n.position.x, y: n.position.y,
              width: (n.style?.width as number) ?? 0, height: (n.style?.height as number) ?? 0,
            };
          } else {
            positions[n.id] = { x: n.position.x, y: n.position.y };
          }
        });
        const edgeLabelOffsets: Record<string, { x: number; y: number }> = {};
        edgesRef.current.forEach((e) => {
          const ox = e.data?.labelOffsetX ?? 0;
          const oy = e.data?.labelOffsetY ?? 0;
          if (ox !== 0 || oy !== 0) edgeLabelOffsets[e.id] = { x: ox, y: oy };
        });
        saveSnapshotLayout(newId, {
          filters,
          viewMode,
          renderEngine,
          showImplied,
          positions,
          zones,
          edgeLabelOffsets,
        });
      }
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

  const serverCount = effectiveTopology?.servers?.length ?? 0;
  const connectionCount = effectiveTopology?.connections?.length ?? 0;
  const CANVAS_H = 'calc(100vh - 64px - 48px - 48px - 72px - 48px)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Sơ đồ hệ thống"
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
            {viewMode === '2D' && (renderEngine === 'reactflow' || renderEngine === 'visnetwork') && (
              <Tooltip title="Hiển thị toàn sơ đồ">
                <Button icon={<CompressOutlined />} onClick={handleFitView}>Vừa màn hình</Button>
              </Tooltip>
            )}
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

      {snapshotView && (
        <Alert
          type="warning"
          showIcon
          icon={<HistoryOutlined />}
          style={{ margin: '0 24px 8px' }}
          message={
            <span>
              Đang xem bản chụp{' '}
              <Text strong>{snapshotView.meta.label ?? snapshotView.meta.id.slice(0, 8)}</Text>
              {' · '}
              {dayjs(snapshotView.meta.created_at).format('YYYY-MM-DD HH:mm')}
              {' '}(chỉ đọc, không phản ánh dữ liệu hiện tại)
            </span>
          }
          action={
            <Button size="small" onClick={handleExitSnapshot}>
              Thoát xem bản chụp
            </Button>
          }
        />
      )}

      <TopologyFilterPanel
        filters={filters}
        onChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        renderEngine={renderEngine}
        onRenderEngineChange={handleRenderEngineChange}
        onAutoArrange={handleAutoArrange}
        onReset={handleResetOptions}
        groupOptions={groupOptions}
        serverOptions={serverOptions}
        appOptions={appOptions}
        serverGroupsMap={serverGroupsMap}
        serverAppsMap={serverAppsMap}
        zoneConfigNode={
          <ZoneConfigPanel
            zones={allTopologyZones}
            onReorder={reorderZones}
            onReset={resetZones}
          />
        }
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
              onNodeDrag={handleNodeDrag} onNodeDragStop={handleNodeDragStop}
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
        {viewMode === '2D' && renderEngine === 'visnetwork' && effectiveTopology && (
          <>
            <TopologyVisNetworkView
              ref={visNetworkViewRef}
              servers={filteredData.serversForEdgeResolution}
              connections={filteredData.connectionsForEdgeResolution}
              impliedConnections={effectiveTopology.impliedConnections ?? []}
              showImplied={showImplied}
              nodeType={filters.nodeType}
              layout={filters.layout === 'hierarchical' ? 'hierarchical' : 'physics'}
              onNodeClick={(payload) => {
                setSelectedConnection(null);
                if (payload.type === 'server') {
                  const s = effectiveTopology?.servers.find((x) => x.id === payload.id);
                  if (s) setSelectedNode({ type: 'server', ...s });
                } else {
                  const dep = (effectiveTopology?.servers ?? []).flatMap((s) => s.deployments.map((d) => ({ d, s }))).find(({ d }) => d.application.id === payload.id);
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
            <TopologyMermaidView servers={filteredData.serversForEdgeResolution} connections={filteredData.connectionsForEdgeResolution} impliedConnections={effectiveTopology?.impliedConnections ?? []} showImplied={showImplied} nodeType={filters.nodeType} environment={filters.environment} />
          </div>
        )}

        {/* ── 3D ── */}
        {viewMode === '3D' && effectiveTopology && (
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

      <SnapshotBrowser
        open={showSnapshots}
        onClose={() => setShowSnapshots(false)}
        currentEnvironment={filters.environment}
        onLoad={(payload, meta) => {
          setSnapshotView({ payload, meta });
          setSelectedNode(null);
          setSelectedConnection(null);
          setSelectedImplied(null);
          setFocusedNodeId(null);

          const saved = loadSnapshotLayouts()[meta.id];
          if (saved) {
            // Re-present exactly what the user saw: restore every option, the
            // render engine / view mode, node positions, zone geometry and
            // dragged edge-label offsets. Prime the refs and freeze the
            // merge-pass mode/revision so it doesn't wipe them.
            if (saved.filters) setFilters(saved.filters);
            if (saved.viewMode) setViewMode(saved.viewMode);
            if (saved.renderEngine) setRenderEngine(saved.renderEngine);
            if (typeof saved.showImplied === 'boolean') setShowImplied(saved.showImplied);
            userPositionsRef.current = { ...(saved.positions ?? {}) };
            zoneLayoutRef.current = { ...(saved.zones ?? {}) };
            edgeLabelOffsetsRef.current = { ...(saved.edgeLabelOffsets ?? {}) };
            const sf = saved.filters ?? filters;
            positionsModeRef.current = sf.nodeType + (sf.showZones ? ':zone' : '');
            appliedRevisionRef.current = layoutRevision;
          } else {
            // Older snapshot without a saved layout → lay out fresh.
            userPositionsRef.current = {};
            zoneLayoutRef.current = {};
            edgeLabelOffsetsRef.current = {};
            setLayoutRevision((r) => r + 1);
          }

          // Visible confirmation: re-fit the canvas once nodes have settled.
          requestAnimationFrame(() => requestAnimationFrame(() => {
            reactFlowRef.current?.fitView({ padding: 0.2, duration: 500, minZoom: 0.15, maxZoom: 1.5 });
          }));
        }}
      />

      <ConnectionHealthDrawer
        open={healthDrawerOpen} onClose={() => setHealthDrawerOpen(false)}
        servers={effectiveTopology?.servers ?? []} connections={effectiveTopology?.connections ?? []}
        onFocusNode={(nodeId) => { setFocusedNodeId(nodeId); if (renderEngine !== 'reactflow') setRenderEngine('reactflow'); }}
      />
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
