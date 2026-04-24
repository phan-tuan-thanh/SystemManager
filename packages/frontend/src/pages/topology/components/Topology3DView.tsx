import { useState, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import { Button, Space, Switch, Tooltip } from 'antd';
import { ExpandOutlined, CompressOutlined } from '@ant-design/icons';
import * as THREE from 'three';
import ServerNode3D from './nodes/ServerNode3D';
import AppNode3D from './nodes/AppNode3D';
import ConnectionEdge3D from './edges/ConnectionEdge3D';
import type { ServerNode, ConnectionEdge } from '../hooks/useTopology';

interface Topology3DViewProps {
  servers: ServerNode[];
  connections: ConnectionEdge[];
  onNodeSelect?: (node: { type: 'server' | 'app'; data: any } | null) => void;
}

// Layer Y positions
const LAYER_Y = { physical: 0, server: 5, app: 10 };
const LAYER_SPACING = { server: 4.5, app: 3.5 };

function computePositions(
  servers: ServerNode[],
  explodeView: boolean,
): {
  serverPositions: Map<string, [number, number, number]>;
  appPositions: Map<string, [number, number, number]>;
} {
  const serverPositions = new Map<string, [number, number, number]>();
  const appPositions = new Map<string, [number, number, number]>();

  const dcServers = servers.filter((s) => s.site === 'DC' || !s.site);
  const drServers = servers.filter((s) => s.site === 'DR');

  const placeServers = (list: ServerNode[], xOffset: number) => {
    list.forEach((server, i) => {
      const cols = Math.ceil(Math.sqrt(list.length));
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = xOffset + col * LAYER_SPACING.server - ((cols - 1) * LAYER_SPACING.server) / 2;
      const z = row * LAYER_SPACING.server - ((Math.ceil(list.length / cols) - 1) * LAYER_SPACING.server) / 2;
      serverPositions.set(server.id, [x, LAYER_Y.server, z]);

      // Place app nodes above each server in a small cluster
      server.deployments.forEach((dep, di) => {
        const appCols = Math.max(1, Math.ceil(Math.sqrt(server.deployments.length)));
        const ar = Math.floor(di / appCols);
        const ac = di % appCols;
        const ax = x + (ac - (appCols - 1) / 2) * 2.0;
        const az = z + (ar - (Math.ceil(server.deployments.length / appCols) - 1) / 2) * 2.0;
        appPositions.set(`${dep.application.id}-${server.id}`, [ax, LAYER_Y.app, az]);
      });
    });
  };

  if (explodeView) {
    const dcOffset = -Math.max(dcServers.length, 1) * LAYER_SPACING.server * 0.6;
    const drOffset = Math.max(dcServers.length, 1) * LAYER_SPACING.server * 0.6;
    placeServers(dcServers, dcOffset);
    placeServers(drServers, drOffset);
  } else {
    placeServers(servers, 0);
  }

  return { serverPositions, appPositions };
}

function Scene({
  servers,
  connections,
  explodeView,
  selectedId,
  highlightedAppId,
  onSelectServer,
  onSelectApp,
  onHoverApp,
}: {
  servers: ServerNode[];
  connections: ConnectionEdge[];
  explodeView: boolean;
  selectedId?: string;
  highlightedAppId?: string;
  onSelectServer: (id: string, data: any) => void;
  onSelectApp: (key: string, data: any) => void;
  onHoverApp: (appId: string | null) => void;
}) {
  const { serverPositions, appPositions } = useMemo(
    () => computePositions(servers, explodeView),
    [servers, explodeView],
  );

  // Find all connection edges that involve the highlighted app
  const highlightedConnections = useMemo(() => {
    if (!highlightedAppId) return new Set<string>();
    const set = new Set<string>();
    connections.forEach((c) => {
      if (c.sourceAppId === highlightedAppId || c.targetAppId === highlightedAppId) {
        set.add(c.id);
      }
    });
    return set;
  }, [highlightedAppId, connections]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={0.6} color="#1677ff" />
      <Stars radius={80} depth={40} count={2000} factor={3} saturation={0} fade />
      <Environment preset="city" />

      {/* Ground plane (Physical Layer Y=0) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LAYER_Y.physical - 0.5, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#0d1117" roughness={1} metalness={0} transparent opacity={0.8} />
      </mesh>

      {/* Layer labels */}
      <group>
        <LayerLabel y={LAYER_Y.server} label="Server Layer" />
        <LayerLabel y={LAYER_Y.app} label="Application Layer" />
      </group>

      {/* Servers */}
      {servers.map((server) => {
        const pos = serverPositions.get(server.id);
        if (!pos) return null;
        return (
          <ServerNode3D
            key={server.id}
            position={pos}
            name={server.name}
            code={server.code}
            status={server.status}
            environment={server.environment}
            site={server.site}
            deploymentCount={server.deployments.length}
            selected={selectedId === `server-${server.id}`}
            onClick={() => onSelectServer(`server-${server.id}`, server)}
          />
        );
      })}

      {/* App nodes */}
      {servers.flatMap((server) =>
        server.deployments.map((dep) => {
          const key = `${dep.application.id}-${server.id}`;
          const pos = appPositions.get(key);
          if (!pos) return null;
          const isHighlighted =
            highlightedAppId === dep.application.id ||
            connections.some(
              (c) =>
                highlightedConnections.has(c.id) &&
                (c.sourceAppId === dep.application.id || c.targetAppId === dep.application.id),
            );
          return (
            <AppNode3D
              key={key}
              position={pos}
              name={dep.application.name}
              groupName={dep.application.groupName}
              status={dep.status}
              applicationType={dep.application.application_type}
              selected={selectedId === `app-${key}`}
              highlighted={isHighlighted}
              onClick={() => onSelectApp(`app-${key}`, { ...dep.application, deploymentStatus: dep.status, environment: dep.environment, serverName: server.name })}
              onHover={(h) => onHoverApp(h ? dep.application.id : null)}
            />
          );
        }),
      )}

      {/* Connection edges between apps */}
      {connections.map((conn) => {
        // Find any app node for source / target (pick first occurrence)
        const srcEntry = [...appPositions.entries()].find(([k]) => k.startsWith(conn.sourceAppId));
        const tgtEntry = [...appPositions.entries()].find(([k]) => k.startsWith(conn.targetAppId));
        if (!srcEntry || !tgtEntry) return null;
        return (
          <ConnectionEdge3D
            key={conn.id}
            start={srcEntry[1]}
            end={tgtEntry[1]}
            protocol={conn.connectionType}
            highlighted={highlightedConnections.has(conn.id)}
          />
        );
      })}

      {/* Vertical lines from server to its apps */}
      {servers.flatMap((server) =>
        server.deployments.map((dep) => {
          const sPos = serverPositions.get(server.id);
          const aPos = appPositions.get(`${dep.application.id}-${server.id}`);
          if (!sPos || !aPos) return null;
          return (
            <VerticalLink key={`link-${dep.id}`} start={sPos} end={aPos} />
          );
        }),
      )}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={80}
      />
    </>
  );
}

function LayerLabel({ y, label }: { y: number; label: string }) {
  return (
    <group position={[-25, y, 0]}>
      <mesh>
        <boxGeometry args={[0.05, 0.05, 40]} />
        <meshBasicMaterial color="#333344" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function VerticalLink({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  return (
    <line geometry={geo}>
      <lineBasicMaterial color="#334455" transparent opacity={0.35} />
    </line>
  );
}

export default function Topology3DView({ servers, connections, onNodeSelect }: Topology3DViewProps) {
  const [explodeView, setExplodeView] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [highlightedAppId, setHighlightedAppId] = useState<string | null>(null);

  const handleSelectServer = useCallback((id: string, data: any) => {
    setSelectedId(id);
    onNodeSelect?.({ type: 'server', data });
  }, [onNodeSelect]);

  const handleSelectApp = useCallback((id: string, data: any) => {
    setSelectedId(id);
    onNodeSelect?.({ type: 'app', data });
  }, [onNodeSelect]);

  const handlePaneClick = useCallback(() => {
    setSelectedId(undefined);
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0d1117' }}>
      {/* Toolbar overlay */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
        <Space>
          <Tooltip title="Explode view — spread DC/DR clusters apart">
            <Button
              type={explodeView ? 'primary' : 'default'}
              icon={explodeView ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={() => setExplodeView((v) => !v)}
              size="small"
            >
              {explodeView ? 'Collapse' : 'Explode'}
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* Layer legend */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 10, color: '#aaa', fontSize: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <LegendItem color="#52c41a" label="Active / Running" />
          <LegendItem color="#ff4d4f" label="Inactive / Stopped" />
          <LegendItem color="#faad14" label="Maintenance" />
          <LegendItem color="#8c8c8c" label="Unknown" />
        </div>
        <div style={{ marginTop: 8, opacity: 0.5 }}>Y=5: Servers · Y=10: Apps · Drag to orbit</div>
      </div>

      <Canvas
        camera={{ position: [0, 18, 28], fov: 55, near: 0.1, far: 200 }}
        shadows
        onPointerMissed={handlePaneClick}
        gl={{ antialias: true }}
      >
        <Scene
          servers={servers}
          connections={connections}
          explodeView={explodeView}
          selectedId={selectedId}
          highlightedAppId={highlightedAppId ?? undefined}
          onSelectServer={handleSelectServer}
          onSelectApp={handleSelectApp}
          onHoverApp={setHighlightedAppId}
        />
      </Canvas>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
      <span>{label}</span>
    </div>
  );
}
