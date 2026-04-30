import { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, Button, Space, Spin, Empty, Tooltip, message } from 'antd';
import { CopyOutlined, DownloadOutlined, ZoomInOutlined, ZoomOutOutlined, CompressOutlined } from '@ant-design/icons';
import mermaid from 'mermaid';
import type { ServerNode, ConnectionEdge } from '../hooks/useTopology';

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });

let renderCounter = 0;

function buildMermaidSource(servers: ServerNode[], connections: ConnectionEdge[]): string {
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

  if (usedIds.size === 0) return '';

  const safeId = (code: string) => code.replace(/[^a-zA-Z0-9_]/g, '_');

  const lines: string[] = ['graph LR'];

  usedIds.forEach((id) => {
    const app = appMap.get(id);
    if (app) lines.push(`  ${safeId(app.code)}["${app.name}"]`);
  });

  connections.forEach((c) => {
    const src = appMap.get(c.sourceAppId);
    const tgt = appMap.get(c.targetAppId);
    if (!src || !tgt) return;
    const label = c.targetPort
      ? `${c.connectionType}:${c.targetPort.port_number}`
      : c.connectionType;
    lines.push(`  ${safeId(src.code)} -->|"${label}"| ${safeId(tgt.code)}`);
  });

  return lines.join('\n');
}

interface Props {
  servers: ServerNode[];
  connections: ConnectionEdge[];
  environment?: string;
}

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 8;
const ZOOM_STEP = 0.15;

function clampZoom(z: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

export default function TopologyMermaidView({ servers, connections, environment }: Props) {
  const [svg, setSvg] = useState('');
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const currentRender = useRef(0);

  // ─── Zoom / pan state ────────────────────────────────────────────
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((z) => clampZoom(z + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => clampZoom(z - ZOOM_STEP));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    setZoom((prevZoom) => {
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = clampZoom(prevZoom * factor);
      setPan((prevPan) => ({
        x: cursorX - (cursorX - prevPan.x) * (newZoom / prevZoom),
        y: cursorY - (cursorY - prevPan.y) * (newZoom / prevZoom),
      }));
      return newZoom;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragging.current = true;
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, panX: pan.x, panY: pan.y };
    e.currentTarget.style.cursor = 'grabbing';
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.mouseX),
      y: dragStart.current.panY + (e.clientY - dragStart.current.mouseY),
    });
  }, []);

  const stopDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    dragging.current = false;
    e.currentTarget.style.cursor = 'grab';
  }, []);

  // Reset view whenever SVG changes (new data loaded)
  useEffect(() => { resetView(); }, [svg, resetView]);

  const source = buildMermaidSource(servers, connections);

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
      <Tooltip title="Zoom out (scroll ↓)">
        <Button size="small" icon={<ZoomOutOutlined />} onClick={zoomOut} disabled={!svg} />
      </Tooltip>
      <span style={{ fontSize: 12, color: '#595959', minWidth: 38, textAlign: 'center', display: 'inline-block' }}>
        {zoomLabel}
      </span>
      <Tooltip title="Zoom in (scroll ↑)">
        <Button size="small" icon={<ZoomInOutlined />} onClick={zoomIn} disabled={!svg} />
      </Tooltip>
      <Tooltip title="Fit / Reset">
        <Button size="small" icon={<CompressOutlined />} onClick={resetView} disabled={!svg} />
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
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        style={{
          overflow: 'hidden',
          background: '#fff',
          borderRadius: 8,
          minHeight: 300,
          cursor: 'grab',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            padding: 24,
            display: 'inline-block',
            willChange: 'transform',
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
