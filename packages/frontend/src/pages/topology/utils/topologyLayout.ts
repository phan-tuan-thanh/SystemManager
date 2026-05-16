import { type Node, type Edge, MarkerType } from 'reactflow';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error dagre has no bundled types
import dagre from 'dagre';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { ServerNode, ConnectionEdge } from '../hooks/useTopology';
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

// ─── Dagre layout ─────────────────────────────────────────────────

export function applyDagreLayout(nodes: Node[], edges: Edge[], direction: 'TB' | 'BT' | 'LR' | 'RL'): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 140, ranksep: 200, edgesep: 40, marginx: 60, marginy: 60 });

  const topNodes = nodes.filter((n) => !n.parentNode);
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
  const topNodes = nodes.filter((n) => !n.parentNode);
  const elkChildren = topNodes.map((n) => ({
    id: n.id,
    width: (n.style?.width as number) ?? (n.type === 'serverNode' ? SERVER_NODE_W : APP_NODE_W),
    height: (n.style?.height as number) ?? (n.type === 'serverNode' ? SERVER_NODE_H : APP_NODE_H),
  }));

  const seen = new Set<string>();
  const elkEdges: { id: string; sources: string[]; targets: string[] }[] = [];
  edges.forEach((e) => {
    const src = nodes.find((n) => n.id === e.source)?.parentNode ?? e.source;
    const tgt = nodes.find((n) => n.id === e.target)?.parentNode ?? e.target;
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
    if (node.parentNode) return node;
    const pos = posMap.get(node.id);
    return pos ? { ...node, position: pos } : node;
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
  return { nodes: applyDagreLayout(nodes, edges, direction), edges };
}
