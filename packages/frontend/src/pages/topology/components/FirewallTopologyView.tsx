import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Space, Tag, Empty, Spin, Card, Button, Tooltip, Badge, Dropdown, Typography,
} from 'antd';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import {
  ReloadOutlined, FullscreenOutlined, FullscreenExitOutlined,
  DownloadOutlined, CompressOutlined, ZoomInOutlined, ZoomOutOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import type { FirewallAction, FirewallRuleStatus, FirewallRule } from '../../../types/firewall-rule';
import { useFirewallRuleList } from '../../firewall-rule/hooks/useFirewallRules';
import { parseFirewallToMermaid } from '../../../utils/firewall-mermaid-parser';
import MermaidExportModal from './MermaidExportModal';
import FirewallFilterPanel, { type FirewallFilterState, DEFAULT_PHYSICS } from './FirewallFilterPanel';

// ── Mermaid inline render ─────────────────────────────────────────────
import mermaid from 'mermaid';
mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
let mermaidSeq = 0;

const { Text } = Typography;

const ACTION_COLOR: Record<string, string> = { ALLOW: '#52c41a', DENY: '#ff4d4f' };
const ZONE_DEFAULT_COLOR = '#1890ff';

// ── Graph builder ────────────────────────────────────────────────────
function buildVisGraph(rules: FirewallRule[], edgeStyle: 'smooth' | 'straight') {
  const rawNodes: any[] = [];
  const rawEdges: any[] = [];
  const addedNodes = new Set<string>();

  const ensureNode = (id: string, node: any) => {
    if (!addedNodes.has(id)) {
      rawNodes.push({ id, ...node });
      addedNodes.add(id);
    }
  };

  rules.forEach((r) => {
    let sourceId = '';
    const srcZoneId = r.source_zone_id;
    const srcZone = r.source_zone;

    // 1. Determine Source Node
    // Instead of creating fake nodes for IPs or "Any", we connect directly from the Source Zone's Anchor!
    if (srcZoneId) {
      sourceId = `gravity-center-${srcZoneId}`;
    } else {
      // Truly unknown source (Internet)
      sourceId = 'any-internet';
      ensureNode(sourceId, {
        label: 'Internet',
        shape: 'cloud',
        color: { background: '#fff1f0', border: '#ff4d4f' },
        font: { color: '#cf1322', size: 11, bold: true },
        title: 'Nguồn ngoài hệ thống (Internet)',
        zoneId: 'external',
        zoneName: 'External',
        zoneColor: '#ff4d4f',
        mass: 50, // Heavy like an anchor
      });
    }

    // 2. Determine Destination Node (Server)
    const destId = `server-${r.destination_server_id}`;
    const name = r.destination_server?.name ?? r.destination_server_id.slice(0, 8);
    const code = r.destination_server?.code ?? '';
    const destZoneId = r.destination_zone_id;
    const destZone = r.destination_zone;

    ensureNode(destId, {
      label: name,
      shape: 'box',
      color: { background: '#e6f4ff', border: '#1890ff' },
      font: { color: '#0958d9', bold: true, size: 12 },
      margin: 8,
      title: `Server: ${name}${code ? ` (${code})` : ''}${destZone ? `\nZone: ${destZone.name}` : ''}`,
      zoneId: destZoneId || 'no-zone',
      zoneName: destZone?.name || 'No Zone',
      zoneColor: destZone?.color || '#8c8c8c',
    });

    // 3. Create Edge (Firewall Rule)
    const portLabel = r.destination_port
      ? `${r.destination_port.protocol} ${r.destination_port.port_number}` : r.protocol || '?';
    const edgeColor = ACTION_COLOR[r.action] ?? '#8c8c8c';
    
    // Include source IP in the edge label if it exists
    const edgeLabel = r.source_ip 
      ? `[${r.source_ip}] ${portLabel} (${r.action})` 
      : `${portLabel} (${r.action})`;

    rawEdges.push({
      id: r.id,
      from: sourceId,
      to: destId,
      label: edgeLabel,
      color: { color: edgeColor, highlight: edgeColor, hover: edgeColor },
      font: { color: '#333', align: 'middle', size: 10, background: 'rgba(255,255,255,0.7)', strokeWidth: 0 },
      dashes: r.status === 'PENDING_APPROVAL',
      arrows: { to: { enabled: true, scaleFactor: 0.6 } },
      smooth: edgeStyle === 'smooth'
        ? { enabled: true, type: 'continuous', roundness: 0.3 }
        : { enabled: false },
      width: r.action === 'DENY' ? 1 : 2,
      physics: true, // Allow rules to influence placement naturally
      title: `Rule: ${r.name}\nSource IP: ${r.source_ip || 'Any'}\nAction: ${r.action}\nStatus: ${r.status}${r.notes ? `\nNotes: ${r.notes}` : ''}`,
    });
  });

  // 4. Create Gravity Centers for ALL Zones mentioned in rules
  const zoneInfo = new Map<string, { name: string, color: string, nodes: string[] }>();
  
  // Extract all zones from rules (both source and destination)
  rules.forEach(r => {
    if (r.source_zone_id && r.source_zone) {
      if (!zoneInfo.has(r.source_zone_id)) {
        zoneInfo.set(r.source_zone_id, { name: r.source_zone.name, color: r.source_zone.color || '#1890ff', nodes: [] });
      }
    }
    if (r.destination_zone_id && r.destination_zone) {
      if (!zoneInfo.has(r.destination_zone_id)) {
        zoneInfo.set(r.destination_zone_id, { name: r.destination_zone.name, color: r.destination_zone.color || '#8c8c8c', nodes: [] });
      }
    }
  });

  // Assign nodes to their zones
  rawNodes.forEach(node => {
    if (node.zoneId && node.zoneId !== 'no-zone' && node.zoneId !== 'external' && zoneInfo.has(node.zoneId)) {
      zoneInfo.get(node.zoneId)!.nodes.push(node.id);
    }
  });

  const centerIds: string[] = [];
  const totalZones = zoneInfo.size;
  let zoneIndex = 0;
  const radius = totalZones > 1 ? 400 : 0; 

  zoneInfo.forEach((info, zoneId) => {
    const centerId = `gravity-center-${zoneId}`;
    centerIds.push(centerId);
    
    // Calculate initial position
    const angle = (2 * Math.PI * zoneIndex) / totalZones;
    const baseX = Math.cos(angle) * radius;
    const baseY = Math.sin(angle) * radius;
    zoneIndex++;
    
    // Create a VISIBLE anchor node that acts as the Zone Title
    rawNodes.push({
      id: centerId,
      label: info.name.toUpperCase(),
      shape: 'text',
      font: { color: info.color, bold: true, size: 14, background: 'transparent', vadjust: -55 },
      mass: 10, 
      hidden: false, 
      x: baseX,
      y: baseY,
      title: `Kéo tên Zone này để di chuyển cả nhóm`,
      zoneId: zoneId,
      zoneName: info.name,
      zoneColor: info.color,
    });
    
    // Pull all nodes in this zone to the center
    info.nodes.forEach(nId => {
      rawEdges.push({
        from: nId,
        to: centerId,
        hidden: false,
        color: { color: 'transparent', highlight: 'transparent', hover: 'transparent' },
        width: 0,
        arrows: { to: { enabled: false } },
        physics: true,
        length: 100, // Distance between server and zone title
        springConstant: 0.1, // Stiff spring for better "dragging" feel
      });
    });
  });

  return { nodes: rawNodes, edges: rawEdges };
}

// ── Mermaid view sub-component ───────────────────────────────────────
function FirewallMermaidView({ rules, environment }: { rules: FirewallRule[]; environment?: string }) {
  const [svg, setSvg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const source = useMemo(() => parseFirewallToMermaid(rules), [rules]);
  const seqRef = useRef(0);

  useEffect(() => {
    if (!source) { setSvg(''); setError(''); return; }
    const id = ++mermaidSeq;
    seqRef.current = id;
    setLoading(true); setError('');
    mermaid.render(`fw-mermaid-${id}`, source)
      .then(({ svg: rendered }) => { if (seqRef.current === id) { setSvg(rendered); setZoom(1); } })
      .catch((e) => { if (seqRef.current === id) { setError(String(e?.message ?? e)); setSvg(''); } })
      .finally(() => { if (seqRef.current === id) setLoading(false); });
  }, [source]);

  const handleCopy = () => navigator.clipboard.writeText(source);
  const handleDownload = () => {
    const blob = new Blob([source], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `firewall-topology-${environment ?? 'all'}-${Date.now()}.mmd`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spin tip="Đang render Mermaid..." /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '8px 0', flexWrap: 'wrap' }}>
        <Button size="small" icon={<ZoomOutOutlined />} onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} disabled={!svg} />
        <span style={{ lineHeight: '24px', fontSize: 12 }}>{Math.round(zoom * 100)}%</span>
        <Button size="small" icon={<ZoomInOutlined />} onClick={() => setZoom((z) => Math.min(4, z + 0.25))} disabled={!svg} />
        <Button size="small" icon={<CompressOutlined />} onClick={() => setZoom(1)} disabled={!svg || zoom === 1} />
        <Button size="small" icon={<CodeOutlined />} onClick={handleCopy} disabled={!source}>Copy</Button>
        <Button size="small" icon={<DownloadOutlined />} onClick={handleDownload} disabled={!source}>Tải .mmd</Button>
      </div>
      {error && <Empty description={<span style={{ color: '#ff4d4f' }}>Lỗi: {error}</span>} />}
      {!svg && !error && <Empty description="Không có dữ liệu để render" />}
      {svg && (
        <div style={{ overflow: 'auto', background: '#fff', borderRadius: 8 }}>
          <div style={{ zoom, padding: 24, display: 'inline-block', minWidth: '100%', boxSizing: 'border-box' }}
            dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function FirewallTopologyView() {
  const [filters, setFilters] = useState<FirewallFilterState>(() => {
    const defaults: FirewallFilterState = {
      renderEngine: 'visnetwork',
      layout: 'hierarchical',
      layoutDirection: 'LR',
      edgeStyle: 'smooth',
      showMiniMap: true,
      status: 'ACTIVE',
      physics: DEFAULT_PHYSICS,
      visibleSourceZoneIds: [],
      visibleDestServerIds: [],
    };
    try {
      const saved = localStorage.getItem('fw.topology.filters');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults so new fields (e.g. physics) are never undefined
        // even when loaded from an older localStorage snapshot.
        return {
          ...defaults,
          ...parsed,
          physics: { ...DEFAULT_PHYSICS, ...(parsed.physics ?? {}) },
        };
      }
    } catch { /* ignore */ }
    return defaults;
  });

  const handleFiltersChange = (f: FirewallFilterState) => {
    setFilters(f);
    try { localStorage.setItem('fw.topology.filters', JSON.stringify(f)); } catch { /* ignore */ }
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mermaidModalOpen, setMermaidModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  // Fullscreen
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) wrapperRef.current.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  // Data
  const { data: rulesData, isLoading, refetch } = useFirewallRuleList({
    environment: filters.environment as any,
    action: filters.action as FirewallAction | undefined,
    status: filters.status as FirewallRuleStatus | undefined || undefined,
    limit: 500,
    page: 1,
  });

  const allRules = rulesData?.items ?? [];

  // Source zone & dest server options for filter panel
  const { sourceZoneOptions, destServerOptions } = useMemo(() => {
    const zoneMap = new Map<string, string>();
    const serverMap = new Map<string, string>();
    allRules.forEach((r) => {
      if (r.source_zone_id && r.source_zone) zoneMap.set(r.source_zone_id, r.source_zone.name);
      if (r.destination_server_id && r.destination_server)
        serverMap.set(r.destination_server_id, r.destination_server.name);
    });
    return {
      sourceZoneOptions: [...zoneMap.entries()].map(([value, label]) => ({ value, label })),
      destServerOptions: [...serverMap.entries()].map(([value, label]) => ({ value, label })),
    };
  }, [allRules]);

  // Apply node visibility filters
  const rules = useMemo(() => {
    let result = allRules;
    const { visibleSourceZoneIds, visibleDestServerIds } = filters;
    if (visibleSourceZoneIds.length > 0) {
      result = result.filter((r) => r.source_zone_id && visibleSourceZoneIds.includes(r.source_zone_id));
    }
    if (visibleDestServerIds.length > 0) {
      result = result.filter((r) => visibleDestServerIds.includes(r.destination_server_id));
    }
    return result;
  }, [allRules, filters.visibleSourceZoneIds, filters.visibleDestServerIds]);

  const mermaidCode = useMemo(() => parseFirewallToMermaid(rules), [rules]);
  const { nodes, edges } = useMemo(() => buildVisGraph(rules, filters.edgeStyle), [rules, filters.edgeStyle]);

  // Stats
  const allowCount = rules.filter((r) => r.action === 'ALLOW').length;
  const denyCount = rules.filter((r) => r.action === 'DENY').length;
  const pendingCount = rules.filter((r) => r.status === 'PENDING_APPROVAL').length;

  // ── Build reactive physics options from user config ─────────────────
  // vis-network rejects keys with undefined values — use conditional spread
  // to only include the active solver's config block.
  const buildReactivePhysics = useCallback((cfg = filters.physics) => {
    const base = {
      enabled: true,
      solver: cfg.solver,
      stabilization: { enabled: false },
    };
    if (cfg.solver === 'barnesHut') {
      return {
        ...base,
        barnesHut: {
          gravitationalConstant: cfg.gravitationalConstant,
          centralGravity: cfg.centralGravity,
          springLength: cfg.springLength,
          springConstant: cfg.springConstant,
          damping: cfg.damping,
          avoidOverlap: 1,
        },
      };
    }
    if (cfg.solver === 'forceAtlas2Based') {
      return {
        ...base,
        forceAtlas2Based: {
          gravitationalConstant: cfg.gravitationalConstant,
          centralGravity: cfg.centralGravity,
          springLength: cfg.springLength,
          springConstant: cfg.springConstant,
          damping: cfg.damping,
        },
      };
    }
    // repulsion
    return {
      ...base,
      repulsion: {
        centralGravity: cfg.centralGravity,
        springLength: cfg.springLength,
        springConstant: cfg.springConstant,
        damping: cfg.damping,
        nodeDistance: cfg.springLength * 1.5,
      },
    };
  }, [filters.physics]);

  // Vis-network init
  useEffect(() => {
    if (filters.renderEngine !== 'visnetwork') return;
    const container = containerRef.current;
    if (!container) return;
    networkRef.current?.destroy();
    networkRef.current = null;
    if (nodes.length === 0) return;

    const nodesDS = new DataSet(nodes);
    const edgesDS = new DataSet(edges);

    const isHier = filters.layout === 'hierarchical';
    const reactivePhysics = buildReactivePhysics();

    const network = new Network(
      container,
      { nodes: nodesDS, edges: edgesDS } as any,
      {
        autoResize: true,
        layout: isHier ? {
          hierarchical: {
            enabled: true,
            direction: filters.layoutDirection,
            sortMethod: 'directed',
            levelSeparation: 260,
            nodeSpacing: 160,
            treeSpacing: 200,
          },
        } : { hierarchical: { enabled: false } },
        physics: isHier ? { enabled: false } : reactivePhysics,
        interaction: { hover: true, tooltipDelay: 150, dragNodes: true, dragView: true, zoomView: true },
        edges: { smooth: { enabled: true, type: 'continuous', roundness: 0.3 } },
        nodes: { shadow: { enabled: true, color: 'rgba(0,0,0,0.1)', x: 2, y: 2, size: 6 } },
      },
    );
    networkRef.current = network;

    // ── Zone Drawing Logic ──────────────────────────────────────────
    // Draws a background rectangle behind nodes of the same zone.
    const drawZones = (ctx: CanvasRenderingContext2D) => {
      const nodeIds = nodesDS.getIds();
      const positions = network.getPositions(nodeIds);
      const zoneMap = new Map<string, { minX: number; minY: number; maxX: number; maxY: number; color: string; name: string }>();

      nodeIds.forEach((id) => {
        const node = nodesDS.get(id) as any;
        if (!node || !node.zoneId) return;
        const pos = positions[id];
        if (!pos) return;

        const zoneId = node.zoneId;
        const current = zoneMap.get(zoneId) || {
          minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity,
          color: node.zoneColor || '#8c8c8c',
          name: node.zoneName || 'Zone',
        };

        // Node dimensions (approx) + ample padding
        current.minX = Math.min(current.minX, pos.x - 60);
        current.minY = Math.min(current.minY, pos.y - 60);
        current.maxX = Math.max(current.maxX, pos.x + 60);
        current.maxY = Math.max(current.maxY, pos.y + 60);
        zoneMap.set(zoneId, current);
      });

      zoneMap.forEach((z, id) => {
        if (z.minX === Infinity) return;

        const width = z.maxX - z.minX + 20;
        const height = z.maxY - z.minY + 40;
        const x = z.minX - 10;
        const y = z.minY - 30;

        // Draw background
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = z.color;
        ctx.lineWidth = 1;
        ctx.fillStyle = `${z.color}11`; // Very light alpha
        
        // Rounded rect
        const r = 10;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      });
    };

    network.on('beforeDrawing', (ctx) => {
      drawZones(ctx);
    });

    network.once('afterDrawing', () => {
      if (isHier) {
        network.setOptions({ layout: { hierarchical: { enabled: false } } });
        network.setOptions({ physics: reactivePhysics });
      }
      // Force a resize check in case flexbox settled late
      network.setSize('100%', '100%');
      network.redraw();
      network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    });

    if (!isHier) {
      network.once('stabilizationIterationsDone', () => {
        network.setOptions({ physics: { enabled: false } });
        network.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
        network.redraw();
      });
    }

    // Drag events
    let dragEndTimer: ReturnType<typeof setTimeout>;
    network.on('dragStart', (params) => {
      // Only enable physics if they are dragging an actual node (like the Zone Anchor)
      // If params.nodes is empty, they are just panning the canvas.
      if (params.nodes && params.nodes.length > 0) {
        clearTimeout(dragEndTimer);
        network.setOptions({ physics: { enabled: true } });
      }
    });
    network.on('dragEnd', (params) => {
      if (params.nodes && params.nodes.length > 0) {
        const ms = filters.physics.dragSettleMs;
        dragEndTimer = setTimeout(() => {
          network.setOptions({ physics: { enabled: false } });
        }, ms);
      }
    });

    return () => {
      clearTimeout(dragEndTimer);
      network.destroy();
      networkRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, filters.renderEngine, filters.layout, filters.layoutDirection]);

  // ── Apply physics config changes WITHOUT reiniting network ────────────
  // When user tweaks physics options, apply directly to running network instance.
  // This runs SEPARATELY from the init effect so it doesn't destroy/recreate.
  useEffect(() => {
    const n = networkRef.current;
    if (!n) return;
    // Only apply if network is already up (not during init)
    const physicsOptions = buildReactivePhysics(filters.physics);
    // Don't enable physics here — just update the config.
    // Physics will be enabled on next dragStart.
    n.setOptions({
      physics: { ...physicsOptions, enabled: false },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.physics]);

  // Toolbar actions
  const handleFitView = useCallback(() => {
    networkRef.current?.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
  }, []);
  const handleZoomIn = useCallback(() => {
    const n = networkRef.current; if (!n) return;
    n.moveTo({ scale: n.getScale() * 1.3, animation: { duration: 200, easingFunction: 'easeInOutQuad' } });
  }, []);
  const handleZoomOut = useCallback(() => {
    const n = networkRef.current; if (!n) return;
    n.moveTo({ scale: n.getScale() * 0.77, animation: { duration: 200, easingFunction: 'easeInOutQuad' } });
  }, []);
  const handleAutoArrange = useCallback(() => {
    const n = networkRef.current; if (!n) return;
    if (filters.layout === 'force') { n.setOptions({ physics: { enabled: true } }); n.stabilize(200); }
    setTimeout(() => n.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } }), 50);
  }, [filters.layout]);

  const exportAsPNG = useCallback(() => {
    const canvas = containerRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `firewall-topology-${filters.environment ?? 'all'}-${Date.now()}.png`;
    a.click();
  }, [filters.environment]);

  const exportAsJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify({ rules }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `firewall-rules-${filters.environment ?? 'all'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [rules, filters.environment]);

  const hasData = nodes.length > 0 || rules.length > 0;
  const isVis = filters.renderEngine === 'visnetwork';

  return (
    <div ref={wrapperRef} style={{
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      height: isFullscreen ? '100vh' : 'calc(100vh - 160px)', // Fill available viewport
      minHeight: '600px',
      overflow: 'hidden',
    }}>
      {/* ── Filter panel ─────────────────────────────────────────── */}
      <FirewallFilterPanel
        filters={filters}
        onChange={handleFiltersChange}
        onAutoArrange={isVis ? handleAutoArrange : undefined}
        sourceZoneOptions={sourceZoneOptions}
        destServerOptions={destServerOptions}
      />

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div style={{
        padding: '6px 16px',
        background: '#f5f5f5',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        {/* Stats */}
        <Space size={4}>
          <Tag style={{ margin: 0 }}>{rules.length} rules</Tag>
          {allowCount > 0 && <Tag color="success" style={{ margin: 0 }}>✓ {allowCount}</Tag>}
          {denyCount > 0 && <Tag color="error" style={{ margin: 0 }}>✗ {denyCount}</Tag>}
          {pendingCount > 0 && (
            <Badge count={pendingCount} size="small">
              <Tag color="warning" style={{ margin: 0 }}>PENDING</Tag>
            </Badge>
          )}
        </Space>

        <div style={{ flex: 1 }} />

        {/* Zoom controls (vis only) */}
        {isVis && (
          <Space.Compact>
            <Tooltip title="Zoom in"><Button size="small" icon={<ZoomInOutlined />} onClick={handleZoomIn} disabled={!hasData} /></Tooltip>
            <Tooltip title="Fit view"><Button size="small" icon={<CompressOutlined />} onClick={handleFitView} disabled={!hasData} /></Tooltip>
            <Tooltip title="Zoom out"><Button size="small" icon={<ZoomOutOutlined />} onClick={handleZoomOut} disabled={!hasData} /></Tooltip>
          </Space.Compact>
        )}

        <Tooltip title="Làm mới">
          <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading} />
        </Tooltip>

        <Dropdown
          disabled={!hasData}
          menu={{
            items: [
              { key: 'mermaid', label: 'Export Mermaid', icon: <CodeOutlined />, onClick: () => setMermaidModalOpen(true) },
              ...(isVis ? [{ key: 'png', label: 'Xuất PNG', icon: <DownloadOutlined />, onClick: exportAsPNG }] : []),
              { key: 'json', label: 'Xuất JSON', icon: <DownloadOutlined />, onClick: exportAsJSON },
            ],
          }}
        >
          <Button size="small" icon={<DownloadOutlined />}>Xuất file</Button>
        </Dropdown>

        <Tooltip title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>
          <Button size="small"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          />
        </Tooltip>
      </div>

      {/* ── Legend (Moved to Top) ─────────────────────────────────── */}
      {isVis && !isLoading && nodes.length > 0 && (
        <div style={{ padding: '8px 16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <Space wrap size={[24, 8]} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 24, height: 14, border: '1px dashed #8c8c8c', background: 'rgba(0,0,0,0.05)', borderRadius: 2 }} />
              <Text style={{ fontSize: 12 }}>Vùng Zone (Container)</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fffbe6', border: '1px solid #faad14' }} />
              <Text style={{ fontSize: 12 }}>IP nguồn</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 12, background: '#f0f5ff', border: '1px solid #1d39c4', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }} />
              <Text style={{ fontSize: 12 }}>Đại diện Zone (Any)</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 12, background: '#e6f4ff', border: '1px solid #1890ff', borderRadius: 2 }} />
              <Text style={{ fontSize: 12 }}>Server đích</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={{ color: ACTION_COLOR.ALLOW, fontSize: 12, fontWeight: 600 }}>──── ALLOW</Text>
              <Text style={{ color: ACTION_COLOR.DENY, fontSize: 12, fontWeight: 600, opacity: 0.7 }}>── DENY</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>- - - PENDING</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic', marginLeft: 'auto' }}>
              💡 Hover cạnh để xem chi tiết Rule. Click node để tập trung.
            </Text>
          </Space>
        </div>
      )}

      {/* ── Canvas area ─────────────────────────────────────────── */}
      {isLoading && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin spinning size="large">
            <div style={{ padding: 40, color: '#8c8c8c', fontSize: 13 }}>Đang tải firewall rules...</div>
          </Spin>
        </div>
      )}

      {!isLoading && isVis && (
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            ref={containerRef}
            style={{ 
              width: '100%', 
              height: '100%', 
              background: '#f5f7fa', 
              display: nodes.length === 0 ? 'none' : 'block',
              flex: 1 
            }}
          />
          {nodes.length === 0 && (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Empty description="Không có rule nào. Thử thay đổi bộ lọc." />
            </div>
          )}
        </div>
      )}

      {!isLoading && !isVis && (
        <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
          <FirewallMermaidView rules={rules} environment={filters.environment} />
        </div>
      )}

      <MermaidExportModal
        open={mermaidModalOpen}
        onCancel={() => setMermaidModalOpen(false)}
        mermaidCode={mermaidCode}
      />
    </div>
  );
}
