import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import cytoscape, { Core, ElementsDefinition } from 'cytoscape';
// @ts-expect-error — no types shipped
import cytoscapeDagre from 'cytoscape-dagre';
import type { ServerNode, ConnectionEdge } from '../hooks/useTopology';

cytoscape.use(cytoscapeDagre);

export interface TopologyCytoscapeHandle {
  /** Re-run the current auto-layout, then fit-to-viewport. */
  autoArrange: () => void;
  /** Fit all nodes inside the current viewport (no relayout). */
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

const PURPOSE_COLOR: Record<string, string> = {
  APP_SERVER: '#1677ff',
  DB_SERVER: '#722ed1',
  PROXY: '#13c2c2',
  LOAD_BALANCER: '#fa8c16',
  CACHE: '#eb2f96',
  MESSAGE_QUEUE: '#52c41a',
  OTHER: '#8c8c8c',
};

interface Props {
  servers: ServerNode[];
  connections: ConnectionEdge[];
  onNodeClick?: (payload: { type: 'server' | 'app'; id: string; name: string }) => void;
  onEdgeClick?: (connection: ConnectionEdge) => void;
  layout?: 'dagre' | 'cose' | 'breadthfirst' | 'grid';
}

function buildLayoutOptions(
  layout: 'dagre' | 'cose' | 'breadthfirst' | 'grid',
  animated = true,
): any {
  switch (layout) {
    case 'dagre':
      return {
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 40,
        rankSep: 100,
        edgeSep: 10,
        fit: true,
        padding: 30,
        animate: animated,
        animationDuration: 400,
        spacingFactor: 0.8,
      };
    case 'cose':
      return {
        name: 'cose',
        animate: animated,
        animationDuration: 400,
        idealEdgeLength: 80,
        nodeOverlap: 20,
        padding: 30,
        fit: true,
        randomize: false,
        componentSpacing: 40,
        nodeRepulsion: 4000,
        gravity: 1,
      };
    case 'breadthfirst':
      return {
        name: 'breadthfirst',
        directed: true,
        padding: 30,
        spacingFactor: 1.3,
        fit: true,
        animate: animated,
        animationDuration: 400,
      };
    case 'grid':
      return { name: 'grid', padding: 30, fit: true, animate: animated, animationDuration: 400 };
  }
}

const TopologyCytoscapeView = forwardRef<TopologyCytoscapeHandle, Props>(function TopologyCytoscapeView(
  { servers, connections, onNodeClick, onEdgeClick, layout = 'dagre' },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  // Callback refs: updating these never triggers useEffect re-runs.
  // This prevents parent inline-function props from destroying/recreating cy on every render.
  const onNodeClickRef = useRef(onNodeClick);
  onNodeClickRef.current = onNodeClick;
  const onEdgeClickRef = useRef(onEdgeClick);
  onEdgeClickRef.current = onEdgeClick;

  // Holds the currently-running animated layout runner so we can stop it before destroy.
  const layoutRunnerRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    autoArrange: () => {
      const cy = cyRef.current;
      if (!cy) return;
      const runner = cy.layout(buildLayoutOptions(layoutRef.current, true));
      layoutRunnerRef.current = runner;
      runner.run();
      cy.one('layoutstop', () => {
        // Guard: only act if this is still the live instance
        if (cyRef.current === cy) {
          cy.fit(undefined, 40);
          cy.center();
        }
      });
    },
    fit: () => {
      const cy = cyRef.current;
      if (!cy) return;
      cy.fit(undefined, 40);
      cy.center();
    },
  }));

  const elements = useMemo<ElementsDefinition>(() => {
    const nodes: ElementsDefinition['nodes'] = [];
    const edges: ElementsDefinition['edges'] = [];

    servers.forEach((server) => {
      nodes.push({
        data: {
          id: `server-${server.id}`,
          label: `🖥 ${server.name}`,
          kind: 'server',
          color: PURPOSE_COLOR[server.purpose] ?? PURPOSE_COLOR.OTHER,
          _raw: { type: 'server', id: server.id, name: server.name },
        },
      });
      server.deployments.forEach((dep) => {
        const appId = `app-${dep.application.id}-${server.id}`;
        nodes.push({
          data: {
            id: appId,
            label: dep.application.name,
            kind: 'app',
            parent: `server-${server.id}`,
            color: '#1677ff',
            _raw: { type: 'app', id: dep.application.id, name: dep.application.name },
          },
        });
      });
    });

    connections.forEach((conn) => {
      const findAppNodeId = (appId: string) =>
        nodes.find((n) => n.data.id?.startsWith(`app-${appId}-`))?.data.id;
      const src = findAppNodeId(conn.sourceAppId);
      const tgt = findAppNodeId(conn.targetAppId);
      if (src && tgt) {
        const color = PROTOCOL_COLOR[conn.connectionType] ?? '#8c8c8c';
        edges.push({
          data: {
            id: `conn-${conn.id}`,
            source: src,
            target: tgt,
            label: conn.connectionType + (conn.targetPort ? `:${conn.targetPort.port_number}` : ''),
            color,
            _raw: conn,
          },
        });
      }
    });

    return { nodes, edges };
  }, [servers, connections]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Use synchronous (non-animated) layout for initialization.
    // Animated layouts run a requestAnimationFrame loop that keeps firing after cy.destroy(),
    // accessing the nulled-out _private object and throwing "Cannot read properties of null".
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      wheelSensitivity: 0.3,
      style: [
        {
          selector: 'node[kind="server"]',
          style: {
            'background-color': '#f5f7f9',
            'background-opacity': 1,
            'border-width': 2,
            'border-color': 'data(color)',
            'border-style': 'solid',
            shape: 'rectangle',
            label: 'data(label)',
            'font-size': 11,
            'font-weight': 700,
            color: '#1a1a1a',
            'text-valign': 'top',
            'text-halign': 'center',
            'text-margin-y': -6,
            padding: '12px',
          },
        },
        {
          selector: 'node[kind="app"]',
          style: {
            'background-color': '#fff',
            'background-opacity': 1,
            shape: 'round-rectangle',
            label: 'data(label)',
            'font-size': 10,
            color: '#1a1a1a',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '110px',
            width: 130,
            height: 36,
            'border-width': 2,
            'border-color': 'data(color)',
            'border-opacity': 0.8,
            'font-weight': 600,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': 9,
            'text-background-color': 'data(color)',
            'text-background-opacity': 1,
            'text-background-padding': '2px',
            color: '#fff',
            'text-rotation': 'autorotate',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#1677ff',
          },
        },
        {
          selector: 'edge:selected',
          style: {
            width: 4,
          },
        },
      ],
      layout: buildLayoutOptions(layout, false), // synchronous — no RAF loop
    });

    cyRef.current = cy;

    // Fit after synchronous layout completes
    cy.fit(undefined, 40);
    cy.center();

    cy.on('tap', 'node', (evt) => {
      const raw = evt.target.data('_raw');
      if (raw && onNodeClickRef.current) onNodeClickRef.current(raw);
    });
    cy.on('tap', 'edge', (evt) => {
      const raw = evt.target.data('_raw');
      if (raw && onEdgeClickRef.current) onEdgeClickRef.current(raw);
    });

    return () => {
      // Stop any animated layout runner before destroying to prevent its RAF callbacks
      // from firing after _private is nulled out by cy.destroy().
      if (layoutRunnerRef.current) {
        try { layoutRunnerRef.current.stop(); } catch (_) {}
        layoutRunnerRef.current = null;
      }
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, layout]); // onNodeClick/onEdgeClick intentionally omitted — accessed via refs

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#f0f2f5', minHeight: 400 }}
    />
  );
});

export default TopologyCytoscapeView;
