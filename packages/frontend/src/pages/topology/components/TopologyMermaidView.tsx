import { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, Button, Space, Spin, Empty, Tooltip, message } from 'antd';
import { CopyOutlined, DownloadOutlined, ZoomInOutlined, ZoomOutOutlined, CompressOutlined } from '@ant-design/icons';
import mermaid from 'mermaid';
import type { ServerNode, ConnectionEdge, ImpliedConnectionEdge } from '../hooks/useTopology';

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });

let renderCounter = 0;

const FW_ACTION_COLOR = { ALLOW: '#389e0d', DENY: '#cf1322', EXPIRED: '#8c8c8c' };

function isImpliedExpired(ic: ImpliedConnectionEdge): boolean {
  return !ic.neverExpires && !!ic.expiresAt && new Date(ic.expiresAt) < new Date();
}

function buildMermaidSource(
  servers: ServerNode[],
  connections: ConnectionEdge[],
  impliedConnections: ImpliedConnectionEdge[] = [],
  showImplied = true,
  nodeType: 'all' | 'server' | 'app' = 'all',
): string {
  const safeId = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, '_');

  if (nodeType === 'server') {
    // Build app→server lookup then emit server-to-server edges
    const appToServer = new Map<string, ServerNode>();
    servers.forEach((s) =>
      s.deployments.forEach((d) => appToServer.set(d.application.id, s)),
    );
    const serverById = new Map(servers.map((s) => [s.id, s]));

    const usedServerIds = new Set<string>();
    const edgeLines: string[] = [];
    const linkStyles: string[] = [];
    let edgeIndex = 0;

    // Real AppConnection edges (default styling)
    const addedPairs = new Set<string>();
    connections.forEach((c) => {
      const src = appToServer.get(c.sourceAppId);
      const tgt = appToServer.get(c.targetAppId);
      if (!src || !tgt || src.id === tgt.id) return;
      const pairKey = [src.id, tgt.id].sort().join('||');
      if (addedPairs.has(pairKey)) return;
      addedPairs.add(pairKey);
      usedServerIds.add(src.id);
      usedServerIds.add(tgt.id);
      const label = c.targetPort
        ? `${c.connectionType}:${c.targetPort.port_number}`
        : c.connectionType;
      edgeLines.push(`  ${safeId(src.code)} -->|"${label}"| ${safeId(tgt.code)}`);
      edgeIndex++;
    });

    // Implied firewall edges (color by action, gray+dotted when expired)
    if (showImplied) {
      const addedImplied = new Set<string>();
      impliedConnections.forEach((ic) => {
        const action = ic.action ?? 'ALLOW';
        const srcId = ic.sourceServerId ?? appToServer.get(ic.sourceAppId)?.id;
        const tgtId = ic.targetServerId ?? appToServer.get(ic.targetAppId)?.id;
        if (!srcId || !tgtId || srcId === tgtId) return;
        const src = serverById.get(srcId);
        const tgt = serverById.get(tgtId);
        if (!src || !tgt) return;
        const pairKey = `${action}::${srcId}::${tgtId}`;
        if (addedImplied.has(pairKey)) return;
        addedImplied.add(pairKey);
        usedServerIds.add(srcId);
        usedServerIds.add(tgtId);
        const expired = isImpliedExpired(ic);
        const portNum = ic.targetPort?.portNumber;
        const label = expired
          ? `EXPIRED${portNum ? ` :${portNum}` : ''}`
          : `${action}${portNum ? ` :${portNum}` : ''}`;
        const color = expired ? FW_ACTION_COLOR.EXPIRED : FW_ACTION_COLOR[action] ?? FW_ACTION_COLOR.ALLOW;
        const dashed = expired || action === 'DENY';
        edgeLines.push(`  ${safeId(src.code)} -->|"${label}"| ${safeId(tgt.code)}`);
        linkStyles.push(`  linkStyle ${edgeIndex} stroke:${color},stroke-width:2px${dashed ? ',stroke-dasharray:5 5' : ''};`);
        edgeIndex++;
      });
    }

    if (usedServerIds.size === 0) return '';

    const lines: string[] = ['graph LR'];
    servers
      .filter((s) => usedServerIds.has(s.id))
      .forEach((s) => lines.push(`  ${safeId(s.code)}["🖥 ${s.name}"]`));
    lines.push(...edgeLines, ...linkStyles);
    return lines.join('\n');
  }

  // App / All mode
  const appMap = new Map<string, { code: string; name: string }>();
  servers.forEach((s) =>
    s.deployments.forEach((d) => {
      appMap.set(d.application.id, {
        code: d.application.code,
        name: d.application.name,
      });
    }),
  );

  const usedIds = new Set<string>();
  connections.forEach((c) => {
    usedIds.add(c.sourceAppId);
    usedIds.add(c.targetAppId);
  });

  // Resolve implied edges that map to known app pairs (backend leaves app ids
  // empty for server-only rules — those have no app node to attach to here).
  const impliedToDraw: ImpliedConnectionEdge[] = [];
  if (showImplied) {
    const addedImplied = new Set<string>();
    impliedConnections.forEach((ic) => {
      if (!ic.sourceAppId || !ic.targetAppId || ic.sourceAppId === ic.targetAppId) return;
      if (!appMap.has(ic.sourceAppId) || !appMap.has(ic.targetAppId)) return;
      const action = ic.action ?? 'ALLOW';
      const pairKey = `${action}::${ic.sourceAppId}::${ic.targetAppId}`;
      if (addedImplied.has(pairKey)) return;
      addedImplied.add(pairKey);
      impliedToDraw.push(ic);
      usedIds.add(ic.sourceAppId);
      usedIds.add(ic.targetAppId);
    });
  }

  if (usedIds.size === 0) return '';

  const lines: string[] = ['graph LR'];

  usedIds.forEach((id) => {
    const app = appMap.get(id);
    if (app) lines.push(`  ${safeId(app.code)}["${app.name}"]`);
  });

  const edgeLines: string[] = [];
  const linkStyles: string[] = [];
  let edgeIndex = 0;

  connections.forEach((c) => {
    const src = appMap.get(c.sourceAppId);
    const tgt = appMap.get(c.targetAppId);
    if (!src || !tgt) return;
    const label = c.targetPort
      ? `${c.connectionType}:${c.targetPort.port_number}`
      : c.connectionType;
    edgeLines.push(`  ${safeId(src.code)} -->|"${label}"| ${safeId(tgt.code)}`);
    edgeIndex++;
  });

  impliedToDraw.forEach((ic) => {
    const src = appMap.get(ic.sourceAppId);
    const tgt = appMap.get(ic.targetAppId);
    if (!src || !tgt) return;
    const action = ic.action ?? 'ALLOW';
    const expired = isImpliedExpired(ic);
    const portNum = ic.targetPort?.portNumber;
    const label = expired
      ? `EXPIRED${portNum ? ` :${portNum}` : ''}`
      : `${action}${portNum ? ` :${portNum}` : ''}`;
    const color = expired ? FW_ACTION_COLOR.EXPIRED : FW_ACTION_COLOR[action] ?? FW_ACTION_COLOR.ALLOW;
    const dashed = expired || action === 'DENY';
    edgeLines.push(`  ${safeId(src.code)} -->|"${label}"| ${safeId(tgt.code)}`);
    linkStyles.push(`  linkStyle ${edgeIndex} stroke:${color},stroke-width:2px${dashed ? ',stroke-dasharray:5 5' : ''};`);
    edgeIndex++;
  });

  lines.push(...edgeLines, ...linkStyles);
  return lines.join('\n');
}

interface Props {
  servers: ServerNode[];
  connections: ConnectionEdge[];
  impliedConnections?: ImpliedConnectionEdge[];
  showImplied?: boolean;
  nodeType?: 'all' | 'server' | 'app';
  environment?: string;
}

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

function clampZoom(z: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

export default function TopologyMermaidView({ servers, connections, impliedConnections = [], showImplied = true, nodeType = 'all', environment }: Props) {
  const [svg, setSvg] = useState('');
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const currentRender = useRef(0);

  const [zoom, setZoom] = useState(1);

  const resetView = useCallback(() => setZoom(1), []);
  const zoomIn  = useCallback(() => setZoom((z) => clampZoom(z + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom((z) => clampZoom(z - ZOOM_STEP)), []);

  // Reset zoom whenever the diagram changes
  useEffect(() => { setZoom(1); }, [svg]);

  const source = buildMermaidSource(servers, connections, impliedConnections, showImplied, nodeType);

  useEffect(() => {
    if (!source) {
      setSvg('');
      setError('');
      return;
    }
    const renderId = ++renderCounter;
    currentRender.current = renderId;
    setRendering(true);
    setError('');

    mermaid
      .render(`mermaid-topology-${renderId}`, source)
      .then(({ svg: rendered }) => {
        if (currentRender.current !== renderId) return;
        setSvg(rendered);
      })
      .catch((err) => {
        if (currentRender.current !== renderId) return;
        setError(String(err?.message ?? err));
        setSvg('');
      })
      .finally(() => {
        if (currentRender.current === renderId) setRendering(false);
      });
  }, [source]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(source).then(() => message.success('Đã sao chép source'));
  }, [source]);

  const handleDownload = useCallback(() => {
    if (!source) return;
    const blob = new Blob([source], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `topology-${environment ?? 'all'}-${Date.now()}.mmd`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [source, environment]);

  const zoomLabel = `${Math.round(zoom * 100)}%`;

  const extraButtons = (
    <Space size={4}>
      <Tooltip title="Thu nhỏ">
        <Button size="small" icon={<ZoomOutOutlined />} onClick={zoomOut} disabled={!svg || zoom <= ZOOM_MIN} />
      </Tooltip>
      <span style={{ fontSize: 12, color: '#595959', minWidth: 38, textAlign: 'center', display: 'inline-block' }}>
        {zoomLabel}
      </span>
      <Tooltip title="Phóng to">
        <Button size="small" icon={<ZoomInOutlined />} onClick={zoomIn} disabled={!svg || zoom >= ZOOM_MAX} />
      </Tooltip>
      <Tooltip title="Về kích thước gốc (100%)">
        <Button size="small" icon={<CompressOutlined />} onClick={resetView} disabled={!svg || zoom === 1} />
      </Tooltip>
      <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!source}>
        Copy
      </Button>
      <Button size="small" icon={<DownloadOutlined />} onClick={handleDownload} disabled={!source}>
        Tải .mmd
      </Button>
    </Space>
  );

  const previewContent = () => {
    if (rendering) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
          <Spin tip="Đang render sơ đồ..." />
        </div>
      );
    }
    if (error) {
      return (
        <Empty
          description={<span style={{ color: '#ff4d4f' }}>Lỗi render: {error}</span>}
          style={{ padding: 40 }}
        />
      );
    }
    if (!svg) {
      return <Empty description="Không có dữ liệu kết nối để hiển thị" style={{ padding: 40 }} />;
    }

    return (
      // Outer: scroll container — shows full diagram by default, scrolls when zoomed in
      <div style={{ overflow: 'auto', background: '#fff', borderRadius: 8 }}>
        {/* CSS zoom property is layout-aware: parent scroll area grows with zoom level */}
        <div
          style={{
            zoom: zoom,
            padding: 24,
            display: 'inline-block',
            minWidth: '100%',
            boxSizing: 'border-box',
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    );
  };

  return (
    <Tabs
      defaultActiveKey="preview"
      tabBarExtraContent={extraButtons}
      style={{ height: '100%' }}
      items={[
        {
          key: 'preview',
          label: 'Preview',
          children: previewContent(),
        },
        {
          key: 'source',
          label: 'Source',
          children: (
            <pre
              style={{
                background: '#1e1e1e',
                color: '#d4d4d4',
                padding: 16,
                borderRadius: 8,
                overflow: 'auto',
                fontSize: 13,
                lineHeight: 1.6,
                minHeight: 300,
                margin: 0,
                fontFamily: 'monospace',
              }}
            >
              {source || '(không có dữ liệu)'}
            </pre>
          ),
        },
      ]}
    />
  );
}
