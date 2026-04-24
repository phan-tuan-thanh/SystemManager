import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Network, type Options } from 'vis-network';
import { DataSet } from 'vis-data';
import type { ServerNode, ConnectionEdge } from '../hooks/useTopology';

export interface TopologyVisNetworkHandle {
  /** Re-stabilize physics (or re-layout hierarchical) and fit viewport. */
  autoArrange: () => void;
  /** Fit all nodes in the current viewport (animated). */
  fit: () => void;
}

const PROTOCOL_COLOR: Record<string, string> = {
  HTTP: '#1677ff',
  HTTPS: '#52c41a',
  TCP: '#fa8c16',
  GRPC: '#722ed1',
  AMQP: '#eb2f96',
  KAFKA: '#13c2c2',
  DATABASE: '#ff4d4f',
};

// ─── SVG icon helpers ────────────────────────────────────────────────────────

function wrapSvg(color: string, inner: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <circle cx="32" cy="32" r="30" fill="${color}" stroke="#fff" stroke-width="2.5"/>
    <g fill="#fff" transform="translate(12,12)">${inner}</g>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Server rack icon (APP_SERVER)
const ICON_APP_SERVER = wrapSvg(
  '#1677ff',
  `<rect x="2" y="0" width="36" height="8" rx="2"/><rect x="2" y="10" width="36" height="8" rx="2"/>
   <rect x="2" y="20" width="36" height="8" rx="2"/><circle cx="34" cy="4" r="2" fill="#1677ff"/>
   <circle cx="34" cy="14" r="2" fill="#1677ff"/><circle cx="34" cy="24" r="2" fill="#1677ff"/>`,
);

// Cylinder / database icon (DB_SERVER)
const ICON_DB_SERVER = wrapSvg(
  '#722ed1',
  `<ellipse cx="20" cy="6" rx="18" ry="5"/><rect x="2" y="6" width="36" height="22"/>
   <ellipse cx="20" cy="28" rx="18" ry="5"/><ellipse cx="20" cy="17" rx="18" ry="5" fill="rgba(255,255,255,0.2)"/>`,
);

// Arrows exchange (PROXY)
const ICON_PROXY = wrapSvg(
  '#13c2c2',
  `<path d="M2 10 L26 10 L20 4 M26 10 L20 16"/>
   <path d="M38 28 L14 28 L20 22 M14 28 L20 34" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
);

// Tree branches (LOAD_BALANCER)
const ICON_LOAD_BALANCER = wrapSvg(
  '#fa8c16',
  `<line x1="20" y1="0" x2="20" y2="12" stroke="#fff" stroke-width="3"/>
   <line x1="20" y1="12" x2="6" y2="24" stroke="#fff" stroke-width="3"/>
   <line x1="20" y1="12" x2="20" y2="24" stroke="#fff" stroke-width="3"/>
   <line x1="20" y1="12" x2="34" y2="24" stroke="#fff" stroke-width="3"/>
   <circle cx="6" cy="28" r="5"/><circle cx="20" cy="28" r="5"/><circle cx="34" cy="28" r="5"/>`,
);

// Lightning bolt (CACHE)
const ICON_CACHE = wrapSvg(
  '#eb2f96',
  `<polygon points="22,0 10,20 20,20 18,40 30,20 20,20 22,0"/>`,
);

// Chat bubble stack (MESSAGE_QUEUE)
const ICON_MESSAGE_QUEUE = wrapSvg(
  '#52c41a',
  `<rect x="0" y="0" width="32" height="18" rx="4"/>
   <polygon points="6,18 6,26 14,18"/>
   <rect x="6" y="22" width="32" height="14" rx="4" fill="rgba(255,255,255,0.6)"/>`,
);

// Disk / gear (OTHER)
const ICON_OTHER = wrapSvg(
  '#8c8c8c',
  `<circle cx="20" cy="20" r="18" fill="none" stroke="#fff" stroke-width="3"/>
   <circle cx="20" cy="20" r="7"/>`,
);

// App box / cube (app node)
const ICON_APP = wrapSvg(
  '#1677ff',
  `<rect x="4" y="10" width="32" height="24" rx="3"/>
   <polygon points="4,10 20,2 36,10" fill="rgba(255,255,255,0.5)"/>
   <polygon points="36,10 36,34 44,26 44,2" fill="rgba(255,255,255,0.25)"/>`,
);

const SERVER_ICONS: Record<string, string> = {
  APP_SERVER: ICON_APP_SERVER,
  DB_SERVER: ICON_DB_SERVER,
  PROXY: ICON_PROXY,
  LOAD_BALANCER: ICON_LOAD_BALANCER,
  CACHE: ICON_CACHE,
  MESSAGE_QUEUE: ICON_MESSAGE_QUEUE,
  OTHER: ICON_OTHER,
};

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  servers: ServerNode[];
  connections: ConnectionEdge[];
  onNodeClick?: (payload: { type: 'server' | 'app'; id: string; name: string }) => void;
  onEdgeClick?: (connection: ConnectionEdge) => void;
  layout?: 'hierarchical' | 'physics';
}

const TopologyVisNetworkView = forwardRef<TopologyVisNetworkHandle, Props>(function TopologyVisNetworkView(
  { servers, connections, onNodeClick, onEdgeClick, layout = 'physics' },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  useImperativeHandle(ref, () => ({
    autoArrange: () => {
      const network = networkRef.current;
      if (!network) return;
      if (layoutRef.current === 'physics') {
        network.setOptions({ physics: { enabled: true } });
        network.stabilize(200);
      }
      setTimeout(() => network.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } }), 50);
    },
    fit: () => {
      networkRef.current?.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
    },
  }));

  const { nodes, edges, rawLookup } = useMemo(() => {
    const nodes: any[] = [];
    const edges: any[] = [];
    const rawLookup: Record<string, any> = {};

    // A — server nodes (image icons)
    servers.forEach((server) => {
      const id = `server-${server.id}`;
      const icon = SERVER_ICONS[server.purpose] ?? SERVER_ICONS.OTHER;
      const purposeLabel = server.purpose?.replace(/_/g, ' ') ?? 'SERVER';
      const deployCount = server.deployments.length;
      nodes.push({
        id,
        label: server.name,
        shape: 'image',
        image: icon,
        brokenImage: SERVER_ICONS.OTHER,
        size: 32,
        font: {
          color: '#333',
          size: 12,
          face: 'sans-serif',
          vadjust: 6,
          bold: { color: '#222', size: 12 } as any,
        },
        title: `<div style="padding:8px 10px;min-width:140px">
          <b>${server.name}</b><br/>
          <span style="color:#888;font-size:11px">${purposeLabel}</span><br/>
          <span style="font-size:11px">Apps: ${deployCount}</span>
        </div>`,
      });
      rawLookup[id] = { type: 'server', id: server.id, name: server.name };

      // B — app deployment nodes (smaller image icons)
      server.deployments.forEach((dep) => {
        const appId = `app-${dep.application.id}-${server.id}`;
        nodes.push({
          id: appId,
          label: dep.application.name,
          shape: 'image',
          image: ICON_APP,
          brokenImage: ICON_OTHER,
          size: 22,
          font: { color: '#333', size: 10, face: 'sans-serif', vadjust: 4 },
          title: `<div style="padding:8px 10px;min-width:120px">
            <b>${dep.application.name}</b><br/>
            <span style="color:#888;font-size:11px">on ${server.name}</span>
          </div>`,
        });
        rawLookup[appId] = { type: 'app', id: dep.application.id, name: dep.application.name };

        // Dashed containment edge: server → app
        edges.push({
          id: `contain-${appId}`,
          from: id,
          to: appId,
          color: { color: 'rgba(0,0,0,0.08)', highlight: 'rgba(0,0,0,0.2)' },
          width: 1,
          dashes: [4, 4],
          arrows: { to: { enabled: false } },
          smooth: { enabled: true, type: 'curvedCW', roundness: 0.2 } as any,
          selectionWidth: 0,
        });
      });
    });

    // C — application-to-application connections
    const appIdToNodeId = (appId: string) =>
      Object.keys(rawLookup).find((nodeId) => nodeId.startsWith(`app-${appId}-`));

    connections.forEach((conn) => {
      const src = appIdToNodeId(conn.sourceAppId);
      const tgt = appIdToNodeId(conn.targetAppId);
      if (src && tgt) {
        const color = PROTOCOL_COLOR[conn.connectionType] ?? '#8c8c8c';
        const portLabel = conn.targetPort ? `:${conn.targetPort.port_number}` : '';
        const label = `${conn.connectionType}${portLabel}`;
        const edgeId = `conn-${conn.id}`;
        edges.push({
          id: edgeId,
          from: src,
          to: tgt,
          label,
          color: { color, highlight: color, hover: color },
          width: 2,
          font: { color: '#fff', size: 10, background: color, strokeWidth: 0, align: 'middle' } as any,
          arrows: { to: { enabled: true, scaleFactor: 0.6 } },
          smooth: { enabled: true, type: 'continuous', roundness: 0.3 } as any,
          title: `<div style="padding:6px 10px">
            <b>${conn.connectionType}${portLabel}</b>
          </div>`,
        });
        rawLookup[edgeId] = conn;
      }
    });

    return { nodes, edges, rawLookup };
  }, [servers, connections]);

  useEffect(() => {
    if (!containerRef.current) return;

    const nodesDS = new DataSet(nodes);
    const edgesDS = new DataSet(edges);

    const options: Options = {
      layout:
        layout === 'hierarchical'
          ? {
              hierarchical: {
                enabled: true,
                direction: 'LR',
                sortMethod: 'directed',
                levelSeparation: 220,
                nodeSpacing: 120,
                treeSpacing: 180,
              },
            }
          : { hierarchical: { enabled: false } },
      physics:
        layout === 'hierarchical'
          ? { enabled: false }
          : {
              enabled: true,
              solver: 'forceAtlas2Based',
              stabilization: { iterations: 150 },
              forceAtlas2Based: { gravitationalConstant: -60, springLength: 140 },
            },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        dragNodes: true,
        dragView: true,
        zoomView: true,
      },
      nodes: {
        shadow: { enabled: true, color: 'rgba(0,0,0,0.15)', x: 3, y: 3, size: 8 },
        labelHighlightBold: true,
      },
      edges: { smooth: { enabled: true, type: 'continuous', roundness: 0.3 } },
    };

    const network = new Network(
      containerRef.current,
      { nodes: nodesDS, edges: edgesDS } as any,
      options,
    );
    networkRef.current = network;

    network.on('click', (event: any) => {
      if (event.nodes.length) {
        const id = event.nodes[0];
        const raw = rawLookup[id];
        if (raw && raw.type && onNodeClick) onNodeClick(raw);
      } else if (event.edges.length) {
        const id = event.edges[0];
        const raw = rawLookup[id];
        if (raw && !raw.type && onEdgeClick) onEdgeClick(raw);
      }
    });

    network.once('stabilizationIterationsDone', () => {
      network.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
    });
    network.once('afterDrawing', () => {
      if (layoutRef.current === 'hierarchical') {
        network.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
      }
    });

    return () => {
      network.destroy();
      networkRef.current = null;
    };
  }, [nodes, edges, layout, onNodeClick, onEdgeClick, rawLookup]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#f0f2f5', minHeight: 400 }}
    />
  );
});

export default TopologyVisNetworkView;
