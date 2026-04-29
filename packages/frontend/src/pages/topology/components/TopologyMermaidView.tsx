import { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, Button, Space, Spin, Empty, message } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
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

export default function TopologyMermaidView({ servers, connections, environment }: Props) {
  const [svg, setSvg] = useState('');
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const currentRender = useRef(0);

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

  const extraButtons = (
    <Space size={4}>
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
        style={{ overflow: 'auto', padding: 24, background: '#fff', borderRadius: 8, minHeight: 300 }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
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
