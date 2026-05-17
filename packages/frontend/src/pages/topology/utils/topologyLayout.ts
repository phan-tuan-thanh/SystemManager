import { type Node, type Edge, MarkerType } from 'reactflow';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error dagre has no bundled types
import dagre from 'dagre';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { ServerNode, ConnectionEdge } from '../hooks/useTopology';
import type { TopologyZone } from '../hooks/useTopologyZones';
import { protocolColors } from '../components/edges/ProtocolEdge';

// ─── Node dimension constants ─────────────────────────────────────

export const SERVER_NODE_W = 220;
export const SERVER_NODE_H = 150;
export const APP_NODE_W = 180;
export const APP_NODE_H = 92;

// ─── Graph builder ────────────────────────────────────────────────

export function buildGraph(
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
      const paddingY = 48;
      const isContainer = nodeType === 'all' && apps.length > 0;

      const STACK_W = 224;
      const STACK_APP_H = 30;
      const STACK_GAP = 4;

      const serverW = !isContainer ? SERVER_NODE_W : STACK_W;
      const serverH = !isContainer
        ? SERVER_NODE_H
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
          parentId: inContainer ? `server-${server.id}` : undefined,
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
        const edgeId = `conn-srv-${srcServer.id}-${tgtServer.id}`;
        if (!edges.some((e) => e.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: `server-${srcServer.id}`,
            target: `server-${tgtServer.id}`,
            type: 'default',
            animated: false,
            zIndex: 0,
            style: { stroke: '#d9d9d9', strokeWidth: 1.5, strokeDasharray: '4,3', opacity: 0.6 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#d9d9d9' },
            data: { type: 'APP_CONN', _connection: conn },
          });
        }
      }
    }
  });

  // Tag parallel edges so ProtocolEdge can spread them
  const parallelGroups = new Map<string, string[]>();
  edges.forEach((edge) => {
    const srcTop = nodes.find((n) => n.id === edge.source)?.parentId ?? edge.source;
    const tgtTop = nodes.find((n) => n.id === edge.target)?.parentId ?? edge.target;
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

// ─── Dagre layout ─────────────────────────────────────────────────

export function applyDagreLayout(nodes: Node[], edges: Edge[], direction: 'TB' | 'BT' | 'LR' | 'RL'): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 140, ranksep: 200, edgesep: 40, marginx: 60, marginy: 60 });

  const topNodes = nodes.filter((n) => !n.parentId);
  const nodeIdsWithEdges = new Set<string>();
  edges.forEach((e) => { nodeIdsWithEdges.add(e.source); nodeIdsWithEdges.add(e.target); });

  const connectedNodes = topNodes.filter((n) => nodeIdsWithEdges.has(n.id));
  const isolatedNodes = topNodes.filter((n) => !nodeIdsWithEdges.has(n.id));

  connectedNodes.forEach((node) => {
    const w = node.style?.width as number ?? (node.type === 'serverNode' ? SERVER_NODE_W : APP_NODE_W);
    const h = node.style?.height as number ?? (node.type === 'serverNode' ? SERVER_NODE_H : APP_NODE_H);
    g.setNode(node.id, { width: w, height: h });
  });

  edges.forEach((edge) => {
    const srcNode = nodes.find((n) => n.id === edge.source);
    const tgtNode = nodes.find((n) => n.id === edge.target);
    const srcParent = srcNode?.parentId ?? edge.source;
    const tgtParent = tgtNode?.parentId ?? edge.target;
    if (srcParent !== tgtParent && g.hasNode(srcParent) && g.hasNode(tgtParent)) {
      g.setEdge(srcParent, tgtParent);
    }
  });

  dagre.layout(g);

  let maxBottom = 0;
  const laidOutNodes = nodes.map((node) => {
    if (node.parentId) return node;
    const pos = g.node(node.id);
    if (!pos) return node;
    const w = node.style?.width as number ?? (node.type === 'serverNode' ? SERVER_NODE_W : APP_NODE_W);
    const h = node.style?.height as number ?? (node.type === 'serverNode' ? SERVER_NODE_H : APP_NODE_H);
    const newY = pos.y - h / 2;
    maxBottom = Math.max(maxBottom, newY + h);
    return { ...node, position: { x: pos.x - w / 2, y: newY } };
  });

  if (isolatedNodes.length > 0) {
    const COLS = Math.ceil(Math.sqrt(isolatedNodes.length * 1.5));
    const GRID_GAP = 40;
    const START_Y = maxBottom + 120;
    isolatedNodes.forEach((node, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const nodeW = (node.style?.width as number) ?? (node.type === 'serverNode' ? SERVER_NODE_W : APP_NODE_W);
      const nodeH = (node.style?.height as number) ?? (node.type === 'serverNode' ? SERVER_NODE_H : APP_NODE_H);
      const targetNode = laidOutNodes.find((n) => n.id === node.id);
      if (targetNode) {
        targetNode.position = { x: col * (nodeW + GRID_GAP), y: START_Y + row * (nodeH + GRID_GAP) };
      }
    });
  }

  return laidOutNodes;
}

// ─── ELK layout ───────────────────────────────────────────────────

const _elkInstance = new ELK();

const ELK_ALGO_MAP: Record<string, string> = {
  'elk-layered': 'org.eclipse.elk.layered',
  'elk-force':   'org.eclipse.elk.force',
  'elk-tree':    'org.eclipse.elk.mrtree',
  'elk-radial':  'org.eclipse.elk.radial',
};

const ELK_DIR_MAP: Record<string, string> = {
  TB: 'DOWN', BT: 'UP', LR: 'RIGHT', RL: 'LEFT',
};

export async function applyElkLayout(
  nodes: Node[],
  edges: Edge[],
  algorithm: 'elk-layered' | 'elk-force' | 'elk-tree' | 'elk-radial',
  direction: 'TB' | 'BT' | 'LR' | 'RL',
): Promise<Node[]> {
  const topNodes = nodes.filter((n) => !n.parentId);
  const elkChildren = topNodes.map((n) => ({
    id: n.id,
    width: (n.style?.width as number) ?? (n.type === 'serverNode' ? SERVER_NODE_W : APP_NODE_W),
    height: (n.style?.height as number) ?? (n.type === 'serverNode' ? SERVER_NODE_H : APP_NODE_H),
  }));

  const seen = new Set<string>();
  const elkEdges: { id: string; sources: string[]; targets: string[] }[] = [];
  edges.forEach((e) => {
    const src = nodes.find((n) => n.id === e.source)?.parentId ?? e.source;
    const tgt = nodes.find((n) => n.id === e.target)?.parentId ?? e.target;
    if (src === tgt) return;
    const key = `${src}||${tgt}`;
    if (seen.has(key)) return;
    seen.add(key);
    elkEdges.push({ id: `${src}-${tgt}`, sources: [src], targets: [tgt] });
  });

  const graph = {
    id: 'root',
    layoutOptions: {
      'algorithm': ELK_ALGO_MAP[algorithm] ?? 'org.eclipse.elk.layered',
      'elk.direction': ELK_DIR_MAP[direction] ?? 'DOWN',
      'spacing.nodeNode': '80',
      'spacing.edgeNode': '40',
      'spacing.edgeEdge': '20',
      'org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers': '140',
    },
    children: elkChildren,
    edges: elkEdges,
  };

  const result = await _elkInstance.layout(graph);
  const posMap = new Map<string, { x: number; y: number }>();
  result.children?.forEach((n) => {
    if (n.x !== undefined && n.y !== undefined) posMap.set(n.id, { x: n.x, y: n.y });
  });

  return nodes.map((node) => {
    if (node.parentId) return node;
    const pos = posMap.get(node.id);
    return pos ? { ...node, position: pos } : node;
  });
}

// ─── Directional handle routing ───────────────────────────────────
// For server-to-server edges: if target is to the right use default right→left handles;
// if target is to the left route via bottom-to-bottom to avoid crossing node bodies.

function getNodeParentId(node: Node): string | undefined {
  return (node as any).parentId;
}

// Returns the absolute top-left position of a node in React Flow coordinates,
// walking up the parent chain for nested nodes (zone lane children etc.).
function getAbsTopLeft(node: Node, nodeMap: Map<string, Node>): { x: number; y: number } {
  const parentId = getNodeParentId(node);
  if (!parentId) return { x: node.position.x, y: node.position.y };
  const parent = nodeMap.get(parentId);
  if (!parent) return { x: node.position.x, y: node.position.y };
  const grandparentId = getNodeParentId(parent);
  const gpX = grandparentId ? (nodeMap.get(grandparentId)?.position.x ?? 0) : 0;
  const gpY = grandparentId ? (nodeMap.get(grandparentId)?.position.y ?? 0) : 0;
  return {
    x: gpX + parent.position.x + node.position.x,
    y: gpY + parent.position.y + node.position.y,
  };
}

function getAbsCenterX(nodeId: string, nodeMap: Map<string, Node>): number {
  const node = nodeMap.get(nodeId);
  if (!node) return 0;
  const w = (node.style?.width as number) ?? SERVER_NODE_W;
  const { x } = getAbsTopLeft(node, nodeMap);
  return x + w / 2;
}

export interface BackwardRoute {
  _isBackward: true;
}

// Decide whether a server→server edge runs backward (target left of source).
// Returns { _isBackward: true } so the caller can redirect it to the bottom
// handles, or null for forward edges / non-server nodes. The actual arc
// geometry is resolved live by React Flow from the bot-s / bot-t handles —
// never frozen here, so edges stay glued to nodes after drag / re-layout.
// Shared by routeEdgesAfterLayout and the implied-edge builder in index.tsx
// so firewall ALLOW/DENY edges route through the bottom the same way.
export function getBackwardRoute(
  sourceId: string,
  targetId: string,
  nodeMap: Map<string, Node>,
): BackwardRoute | null {
  const srcNode = nodeMap.get(sourceId);
  const tgtNode = nodeMap.get(targetId);
  if (!srcNode || !tgtNode) return null;
  if (srcNode.type !== 'serverNode' || tgtNode.type !== 'serverNode') return null;
  const srcX = getAbsCenterX(sourceId, nodeMap);
  const tgtX = getAbsCenterX(targetId, nodeMap);
  if (tgtX >= srcX) return null;
  return { _isBackward: true };
}

function routeEdgesAfterLayout(nodes: Node[], edges: Edge[]): Edge[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return edges.map((edge) => {
    const route = getBackwardRoute(edge.source, edge.target, nodeMap);
    if (!route) return edge;

    const isCustomEdge = edge.type === 'protocolEdge' || edge.type === 'fwEdge';
    if (isCustomEdge) {
      // ProtocolEdge/FwEdge use the injected coords directly when
      // _isBackward is true → bottom U-arc with ALLOW/DENY colors,
      // flow-dot animation, and protocol labels preserved.
      return {
        ...edge,
        sourceHandle: 'bot-s',
        targetHandle: 'bot-t',
        zIndex: Math.max((edge.zIndex as number | undefined) ?? 0, 6),
        data: { ...edge.data, ...route },
      };
    }

    // Plain APP_CONN server edge: a generic app connection (no ALLOW/DENY).
    // Render it as a faint dashed background smoothstep with a SHALLOW offset
    // (28) so it stays well clear of the colored ALLOW/DENY firewall arcs,
    // which use a deeper offset (58) and a higher z-index.
    return {
      ...edge,
      type: 'smoothstep',
      sourceHandle: 'bot-s',
      targetHandle: 'bot-t',
      zIndex: 3,
      pathOptions: { borderRadius: 10, offset: 28 },
      style: {
        ...edge.style,
        stroke: '#b0b0b0',
        strokeWidth: 1.5,
        strokeDasharray: '5,4',
        opacity: 0.5,
      },
    };
  });
}

// ─── Combined layout entry point ──────────────────────────────────

export function computeLayout(
  servers: ServerNode[],
  connections: ConnectionEdge[],
  nodeType: 'all' | 'server' | 'app',
  direction: 'TB' | 'BT' | 'LR' | 'RL',
  edgeStyle: 'bezier' | 'step' = 'bezier',
): { nodes: Node[]; edges: Edge[] } {
  const { nodes, edges } = buildGraph(servers, connections, nodeType, edgeStyle);
  const laidNodes = applyDagreLayout(nodes, edges, direction);
  return { nodes: laidNodes, edges: routeEdgesAfterLayout(laidNodes, edges) };
}

// ─── Zone lane layout ─────────────────────────────────────────────

export const ZONE_HEADER_H = 32;
const ZONE_PADDING_X = 28;
const ZONE_PADDING_Y = 20;
const ZONE_GAP = 48;
// Padding of the lane wrapper panel around the zones it contains
const LANE_WRAP_PAD = 18;

// Build the background wrapper panel that visually contains every zone in a
// lane (row). It sits behind the zones (zIndex -2) and ignores pointer events.
function makeLaneWrapper(
  lane: number,
  rowY: number,
  rowTotalW: number,
  rowMaxH: number,
): Node {
  return {
    id: `lanewrap-${lane}`,
    type: 'laneWrapper',
    position: { x: -LANE_WRAP_PAD, y: rowY - LANE_WRAP_PAD },
    style: { width: rowTotalW + LANE_WRAP_PAD * 2, height: rowMaxH + LANE_WRAP_PAD * 2 },
    data: { kind: 'wrapper', lane },
    selectable: false,
    draggable: false,
    zIndex: -2,
  };
}

export function computeZoneLaneLayout(
  serversByZone: Map<string, ServerNode[]>,
  activeZones: TopologyZone[],
  connections: ConnectionEdge[],
  nodeType: 'all' | 'server' | 'app',
  direction: 'TB' | 'BT' | 'LR' | 'RL' = 'TB',
  edgeStyle: 'bezier' | 'step' = 'bezier',
): { nodes: Node[]; edges: Edge[] } {
  const allNodes: Node[] = [];
  const allEdges: Edge[] = [];

  // LR/RL: zones stacked left-to-right (vertical bands, servers arranged TB inside)
  // TB/BT: zones stacked top-to-bottom (horizontal bands, servers arranged LR inside)
  const stackHorizontally = direction === 'LR' || direction === 'RL';
  const innerDirection: 'LR' | 'TB' = stackHorizontally ? 'TB' : 'LR';

  // ── Pass 1: build & size each zone's content ─────────────────────
  type ZoneBuild = {
    zone: TopologyZone;
    laidSubNodes: Node[];
    contentW: number;
    contentH: number;
    serverCount: number;
  };
  const builds: ZoneBuild[] = [];

  for (const zone of activeZones) {
    const zoneServers = serversByZone.get(zone.id) ?? [];
    if (zoneServers.length === 0) continue;

    const { nodes: subNodes, edges: subEdges } = buildGraph(zoneServers, connections, nodeType, edgeStyle);
    const laidSubNodes = applyDagreLayout(subNodes, subEdges, innerDirection);

    let maxX = 0;
    let maxY = 0;
    laidSubNodes
      .filter((n) => !n.parentId)
      .forEach((n) => {
        const w = (n.style?.width as number) ?? (n.type === 'serverNode' ? SERVER_NODE_W : APP_NODE_W);
        const h = (n.style?.height as number) ?? (n.type === 'serverNode' ? SERVER_NODE_H : APP_NODE_H);
        maxX = Math.max(maxX, n.position.x + w);
        maxY = Math.max(maxY, n.position.y + h);
      });

    builds.push({
      zone,
      laidSubNodes,
      contentW: maxX + ZONE_PADDING_X * 2,
      contentH: maxY + ZONE_HEADER_H + ZONE_PADDING_Y * 2,
      serverCount: zoneServers.length,
    });
    subEdges.forEach((e) => allEdges.push(e));
  }

  // ── Pass 2: grid placement — group zones by lane (row); every zone in
  // a row gets the same width (= widest zone in that row); rows stack
  // top→bottom with ZONE_GAP. This packs many zones to optimise space.
  const rowsMap = new Map<number, ZoneBuild[]>();
  for (const b of builds) {
    const arr = rowsMap.get(b.zone.lane);
    if (arr) arr.push(b);
    else rowsMap.set(b.zone.lane, [b]);
  }
  const rowKeys = [...rowsMap.keys()].sort((a, b) => a - b);

  let rowY = 0;
  for (const rk of rowKeys) {
    const rowBuilds = (rowsMap.get(rk) ?? []).sort((a, b) => a.zone.order - b.zone.order);
    // Equal WIDTH across the row; each zone keeps its own HEIGHT (fit to its
    // inner nodes). The row advances by the tallest zone so rows never overlap.
    const equalW = Math.max(...rowBuilds.map((b) => b.contentW));
    const rowMaxH = Math.max(...rowBuilds.map((b) => b.contentH));
    const rowTotalW = rowBuilds.length * equalW + (rowBuilds.length - 1) * ZONE_GAP;
    allNodes.push(makeLaneWrapper(rk, rowY, rowTotalW, rowMaxH));
    let colX = 0;

    for (const b of rowBuilds) {
      const laneNodeId = `zone-${b.zone.id}`;
      allNodes.push({
        id: laneNodeId,
        type: 'zoneLane',
        position: { x: colX, y: rowY },
        style: { width: equalW, height: b.contentH },
        data: {
          label: b.zone.name,
          color: b.zone.color,
          borderColor: b.zone.borderColor,
          headerBg: b.zone.headerBg,
          serverCount: b.serverCount,
          lane: b.zone.lane,
        },
        selectable: false,
        draggable: true,
        zIndex: -1,
      });

      // No `extent: 'parent'` — children can be dragged freely; the zone lane
      // grows to fit them (see reflowZoneLanes) instead of clamping the drag.
      b.laidSubNodes.forEach((n) => {
        if (n.parentId) {
          allNodes.push(n);
          return;
        }
        allNodes.push({
          ...n,
          position: {
            x: n.position.x + ZONE_PADDING_X,
            y: n.position.y + ZONE_HEADER_H + ZONE_PADDING_Y,
          },
          parentId: laneNodeId,
        });
      });

      colX += equalW + ZONE_GAP;
    }
    rowY += rowMaxH + ZONE_GAP;
  }

  // Cross-zone edges (not already emitted by per-zone buildGraph)
  const emittedEdgeIds = new Set(allEdges.map((e) => e.id));
  const allServers = [...serversByZone.values()].flat();

  connections.forEach((conn) => {
    // App-level cross-zone edge
    const sourceNodes = allNodes.filter((n) => n.id.startsWith(`app-${conn.sourceAppId}-`));
    const targetNodes = allNodes.filter((n) => n.id.startsWith(`app-${conn.targetAppId}-`));

    if (sourceNodes.length && targetNodes.length) {
      const edgeId = `conn-${conn.id}`;
      if (!emittedEdgeIds.has(edgeId)) {
        const color = protocolColors[conn.connectionType] ?? '#8c8c8c';
        allEdges.push({
          id: edgeId,
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
        emittedEdgeIds.add(edgeId);
      }
      return;
    }

    if (nodeType === 'server') {
      const srcServer = allServers.find((s) =>
        s.deployments.some((d) => d.application.id === conn.sourceAppId),
      );
      const tgtServer = allServers.find((s) =>
        s.deployments.some((d) => d.application.id === conn.targetAppId),
      );
      if (srcServer && tgtServer && srcServer.id !== tgtServer.id) {
        const edgeId = `conn-srv-${srcServer.id}-${tgtServer.id}`;
        if (!emittedEdgeIds.has(edgeId)) {
          allEdges.push({
            id: edgeId,
            source: `server-${srcServer.id}`,
            target: `server-${tgtServer.id}`,
            type: 'default',
            animated: false,
            zIndex: 0,
            style: { stroke: '#d9d9d9', strokeWidth: 1.5, strokeDasharray: '4,3', opacity: 0.6 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#d9d9d9' },
            data: { type: 'APP_CONN', _connection: conn },
          });
          emittedEdgeIds.add(edgeId);
        }
      }
    }
  });

  // Tag parallel edges
  const parallelGroups = new Map<string, string[]>();
  allEdges.forEach((edge) => {
    const srcNode = allNodes.find((n) => n.id === edge.source);
    const tgtNode = allNodes.find((n) => n.id === edge.target);
    // Walk up to top-level (non-zone) parent to detect parallelism between server pairs
    const srcTop = srcNode?.parentId
      ? (allNodes.find((n) => n.id === srcNode.parentId)?.parentId ? srcNode.parentId : srcNode.parentId)
      : edge.source;
    const tgtTop = tgtNode?.parentId
      ? (allNodes.find((n) => n.id === tgtNode.parentId)?.parentId ? tgtNode.parentId : tgtNode.parentId)
      : edge.target;
    if (srcTop === tgtTop) return;
    const key = [srcTop, tgtTop].sort().join('||');
    if (!parallelGroups.has(key)) parallelGroups.set(key, []);
    parallelGroups.get(key)!.push(edge.id);
  });
  parallelGroups.forEach((edgeIds) => {
    const n = edgeIds.length;
    edgeIds.forEach((edgeId, i) => {
      const edge = allEdges.find((e) => e.id === edgeId);
      if (!edge) return;
      edge.data = { ...edge.data, parallelIndex: i, parallelCount: n };
    });
  });

  return { nodes: allNodes, edges: routeEdgesAfterLayout(allNodes, allEdges) };
}

// Top-left of the draggable content area inside a zone lane (below the header,
// inside the padding). Children should not be placed above/left of this.
export const ZONE_CONTENT_ORIGIN = {
  x: ZONE_PADDING_X,
  y: ZONE_HEADER_H + ZONE_PADDING_Y,
};

const ZONE_MIN_CONTENT_W = SERVER_NODE_W;
const ZONE_MIN_CONTENT_H = SERVER_NODE_H;

// Recompute every zone lane's size from its child nodes, then lay the lanes
// out as a GRID: zones sharing a lane (row) sit side-by-side with EQUAL width
// (= the widest zone in that row); rows stack top→bottom with ZONE_GAP. The
// row each zone belongs to comes from its `data.lane`; order within a row is
// the zones' current left→right x. This packs many zones to optimise space.
//
// `normalize` (drag-stop): pin each zone's content top-left to a fixed padded
// origin and shift its children by the same delta, so dragging a node
// left/top expands the zone exactly like dragging it right/bottom. Returns
// child nodes with shifted positions too.
//
// Default (live drag): grow-only — children stay put, the lane just sizes to
// fit; the left/top expansion is finalized once on drag stop.
export function reflowZoneLanes(
  nodes: Node[],
  _stackHorizontally: boolean,
  normalize = false,
): Node[] {
  const lanes = nodes.filter((n) => n.type === 'zoneLane');
  if (lanes.length === 0) return nodes;

  const childrenByParent = new Map<string, Node[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    const arr = childrenByParent.get(n.parentId);
    if (arr) arr.push(n);
    else childrenByParent.set(n.parentId, [n]);
  }

  const ORIGIN_X = ZONE_PADDING_X;
  const ORIGIN_Y = ZONE_HEADER_H + ZONE_PADDING_Y;

  const sizeById = new Map<string, { w: number; h: number }>();
  const shiftById = new Map<string, { x: number; y: number }>();

  for (const lane of lanes) {
    const kids = childrenByParent.get(lane.id) ?? [];

    if (normalize && kids.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const k of kids) {
        const w = (k.style?.width as number) ?? k.width ?? SERVER_NODE_W;
        const h = (k.style?.height as number) ?? k.height ?? SERVER_NODE_H;
        minX = Math.min(minX, k.position.x);
        minY = Math.min(minY, k.position.y);
        maxX = Math.max(maxX, k.position.x + w);
        maxY = Math.max(maxY, k.position.y + h);
      }
      // Grow-only shift: when content crosses left/top of the padded origin,
      // slide the whole block back in by exactly that overflow so the zone
      // grows left/top (mirror of how max edge grows right/bottom). Never
      // negative — dragging right/bottom keeps shift 0 so that path stays
      // pixel-smooth and the dragged node never fights the pointer.
      const shiftX = Math.max(0, ORIGIN_X - minX);
      const shiftY = Math.max(0, ORIGIN_Y - minY);
      shiftById.set(lane.id, { x: shiftX, y: shiftY });
      const right = Math.max(maxX + shiftX, ORIGIN_X + ZONE_MIN_CONTENT_W);
      const bottom = Math.max(maxY + shiftY, ORIGIN_Y + ZONE_MIN_CONTENT_H);
      sizeById.set(lane.id, {
        w: right + ZONE_PADDING_X,
        h: bottom + ZONE_PADDING_Y,
      });
    } else {
      // Grow-only: lane sizes to fit, children stay put.
      let maxX = ZONE_MIN_CONTENT_W;
      let maxY = ZONE_HEADER_H + ZONE_MIN_CONTENT_H;
      for (const k of kids) {
        const w = (k.style?.width as number) ?? k.width ?? SERVER_NODE_W;
        const h = (k.style?.height as number) ?? k.height ?? SERVER_NODE_H;
        const kx = Math.max(k.position.x, 0);
        const ky = Math.max(k.position.y, ZONE_HEADER_H);
        maxX = Math.max(maxX, kx + w);
        maxY = Math.max(maxY, ky + h);
      }
      sizeById.set(lane.id, { w: maxX + ZONE_PADDING_X, h: maxY + ZONE_PADDING_Y });
    }
  }

  // Grid re-stack: group lanes into rows by data.lane; within a row order by
  // current x. Every zone in a row is widened to the row's widest zone and
  // heightened to its tallest; rows stack top→bottom with ZONE_GAP.
  const rowOf = (n: Node): number => Number((n.data as { lane?: number } | undefined)?.lane ?? 0);
  const rowsMap = new Map<number, Node[]>();
  for (const lane of lanes) {
    const r = rowOf(lane);
    const arr = rowsMap.get(r);
    if (arr) arr.push(lane);
    else rowsMap.set(r, [lane]);
  }
  const rowKeys = [...rowsMap.keys()].sort((a, b) => a - b);

  const posById = new Map<string, { x: number; y: number }>();
  const wrappers: Node[] = [];
  let rowY = 0;
  for (const rk of rowKeys) {
    const rowLanes = (rowsMap.get(rk) ?? []).slice().sort((a, b) => a.position.x - b.position.x);
    // Equal WIDTH across the row; keep each zone's own HEIGHT (fit to its
    // inner nodes). Row advances by the tallest zone so rows never overlap.
    const equalW = Math.max(...rowLanes.map((l) => sizeById.get(l.id)!.w));
    const rowMaxH = Math.max(...rowLanes.map((l) => sizeById.get(l.id)!.h));
    let colX = 0;
    for (const l of rowLanes) {
      const ownH = sizeById.get(l.id)!.h;
      posById.set(l.id, { x: colX, y: rowY });
      sizeById.set(l.id, { w: equalW, h: ownH });
      colX += equalW + ZONE_GAP;
    }
    const rowTotalW = rowLanes.length * equalW + (rowLanes.length - 1) * ZONE_GAP;
    wrappers.push(makeLaneWrapper(rk, rowY, rowTotalW, rowMaxH));
    rowY += rowMaxH + ZONE_GAP;
  }

  // Rebuild wrappers fresh every reflow (lane membership may have changed);
  // drop stale laneWrapper nodes and re-append the recomputed ones.
  const mapped = nodes
    .filter((n) => n.type !== 'laneWrapper')
    .map((n) => {
      if (n.type === 'zoneLane') {
        const sz = sizeById.get(n.id);
        const p = posById.get(n.id);
        if (!sz || !p) return n;
        return { ...n, position: p, style: { ...n.style, width: sz.w, height: sz.h } };
      }
      if (normalize && n.parentId) {
        const s = shiftById.get(n.parentId);
        if (s && (s.x !== 0 || s.y !== 0)) {
          return { ...n, position: { x: n.position.x + s.x, y: n.position.y + s.y } };
        }
      }
      return n;
    });
  return [...wrappers, ...mapped];
}

// Auto-arrange: pick the number of columns (zones per row) that lets the whole
// zone grid be zoomed largest to fit the viewport — i.e. best screen usage.
// Returns the flattened (row asc, left→right) assignment with a lane index per
// zone, ready for setZoneArrangement. Zone natural size is derived from each
// lane's child nodes (same sizing as reflowZoneLanes' grow-only path).
export function optimalZoneLaneArrangement(
  nodes: Node[],
  viewportW: number,
  viewportH: number,
): { id: string; lane: number }[] {
  const lanes = nodes.filter((n) => n.type === 'zoneLane');
  if (lanes.length === 0) return [];

  const childrenByParent = new Map<string, Node[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    const arr = childrenByParent.get(n.parentId);
    if (arr) arr.push(n);
    else childrenByParent.set(n.parentId, [n]);
  }

  type ZSize = { id: string; w: number; h: number; ox: number; oy: number };
  const zs: ZSize[] = lanes.map((l) => {
    const kids = childrenByParent.get(l.id) ?? [];
    let maxX = ZONE_MIN_CONTENT_W;
    let maxY = ZONE_HEADER_H + ZONE_MIN_CONTENT_H;
    for (const k of kids) {
      const w = (k.style?.width as number) ?? k.width ?? SERVER_NODE_W;
      const h = (k.style?.height as number) ?? k.height ?? SERVER_NODE_H;
      maxX = Math.max(maxX, Math.max(k.position.x, 0) + w);
      maxY = Math.max(maxY, Math.max(k.position.y, ZONE_HEADER_H) + h);
    }
    return {
      id: l.id,
      w: maxX + ZONE_PADDING_X,
      h: maxY + ZONE_PADDING_Y,
      ox: l.position.x,
      oy: l.position.y,
    };
  });

  // Stable partition order = current reading order (top→bottom, then left→right)
  zs.sort((a, b) => a.oy - b.oy || a.ox - b.ox);
  const N = zs.length;
  const vw = viewportW || 1;
  const vh = viewportH || 1;
  const vAspect = vw / vh;

  let best: { cols: number; scale: number; aspectGap: number } | null = null;
  for (let cols = 1; cols <= N; cols++) {
    const rows = Math.ceil(N / cols);
    let totalW = 0;
    let totalH = 0;
    for (let r = 0; r < rows; r++) {
      const slice = zs.slice(r * cols, r * cols + cols);
      if (slice.length === 0) continue;
      const eqW = Math.max(...slice.map((z) => z.w));
      const rowW = slice.length * eqW + (slice.length - 1) * ZONE_GAP;
      const rowH = Math.max(...slice.map((z) => z.h));
      totalW = Math.max(totalW, rowW);
      totalH += rowH + (r > 0 ? ZONE_GAP : 0);
    }
    // Largest uniform zoom that still fits the viewport → screen utilisation.
    const scale = Math.min(vw / totalW, vh / totalH);
    const aspectGap = Math.abs(Math.log(totalW / totalH / vAspect));
    if (
      !best ||
      scale > best.scale + 1e-6 ||
      (Math.abs(scale - best.scale) <= 1e-6 && aspectGap < best.aspectGap)
    ) {
      best = { cols, scale, aspectGap };
    }
  }

  const cols = best?.cols ?? 1;
  return zs.map((z, i) => ({
    id: z.id.replace(/^zone-/, ''),
    lane: Math.floor(i / cols),
  }));
}
