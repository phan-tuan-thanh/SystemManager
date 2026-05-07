import type { FirewallRule } from '../types/firewall-rule';

/**
 * Sanitize a string to be a safe Mermaid node ID.
 * Only allows alphanumerics and underscore.
 */
function safeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Escape a string for use as a Mermaid node *label* inside double-quotes.
 * Removes characters that could break the parser even inside quotes.
 */
function safeLabel(raw: string): string {
  return raw
    .replace(/"/g, "'")    // swap double-quotes → single (can't nest in Mermaid "...")
    .replace(/[<>]/g, '')  // angle brackets break HTML-mode parsers
    .trim();
}

/**
 * Build a Mermaid edge token.
 * Always wraps the label in double-quotes so parentheses, slashes, etc. are safe.
 *
 * action=ALLOW, not pending  → solid arrow   -->|"label"|
 * action=ALLOW, pending      → dashed arrow  -.->|"label"|
 * action=DENY                → dashed arrow  -.->|"label"|
 */
function buildEdge(portLabel: string, action: string, status: string): string {
  const safePLabel = safeLabel(portLabel);
  if (action === 'ALLOW' && status !== 'PENDING_APPROVAL') {
    return `-->|"${safePLabel}"|`;
  }
  const suffix = action === 'DENY' ? 'DENY' : 'PENDING';
  return `-.->|"${safePLabel} (${suffix})"|`;
}

/**
 * Converts a FirewallRule[] into a Mermaid graph LR string with subgraphs for Zones.
 */
export function parseFirewallToMermaid(rules: FirewallRule[]): string {
  if (!rules || rules.length === 0) {
    return 'graph LR\n  empty["Không có dữ liệu Firewall Rule"]';
  }

  const nodeDefs = new Map<string, { label: string; style: string; zoneId: string; zoneName: string }>();
  const edgeLines: string[] = [];

  // Group nodes by zone
  const zones = new Map<string, { name: string; nodes: string[] }>();
  const ensureZone = (id: string, name: string) => {
    if (!zones.has(id)) zones.set(id, { name, nodes: [] });
    return zones.get(id)!;
  };

  rules.forEach((r) => {
    // ── Source ───────────────────────────────────────────────────
    let sourceId = '';
    const srcZone = r.source_zone;
    const srcZoneId = r.source_zone_id || 'no-zone';
    const srcZoneName = srcZone?.name || 'Unknown Zone';

    if (r.source_ip) {
      sourceId = `IP_${safeId(r.source_ip)}`;
      if (!nodeDefs.has(sourceId)) {
        nodeDefs.set(sourceId, {
          label: r.source_ip,
          style: 'fill:#fffbe6,stroke:#faad14,color:#d48806',
          zoneId: srcZoneId,
          zoneName: srcZoneName,
        });
        ensureZone(srcZoneId, srcZoneName).nodes.push(sourceId);
      }
    } else if (r.source_zone_id && srcZone) {
      sourceId = `ZONE_ANY_${safeId(r.source_zone_id)}`;
      if (!nodeDefs.has(sourceId)) {
        nodeDefs.set(sourceId, {
          label: `Any in ${srcZoneName}`,
          style: 'fill:#f0f5ff,stroke:#1d39c4,color:#1d39c4',
          zoneId: srcZoneId,
          zoneName: srcZoneName,
        });
        ensureZone(srcZoneId, srcZoneName).nodes.push(sourceId);
      }
    } else {
      sourceId = 'ANY_INTERNET';
      if (!nodeDefs.has(sourceId)) {
        nodeDefs.set(sourceId, {
          label: 'Internet',
          style: 'fill:#fff1f0,stroke:#ff4d4f,color:#cf1322',
          zoneId: 'external',
          zoneName: 'External',
        });
        ensureZone('external', 'External').nodes.push(sourceId);
      }
    }

    // ── Destination ──────────────────────────────────────────────
    const destId = `SERVER_${safeId(r.destination_server_id)}`;
    const destLabel = r.destination_server?.name ?? r.destination_server_id.slice(0, 8);
    const destZone = r.destination_zone;
    const destZoneId = r.destination_zone_id || 'no-zone-dest';
    const destZoneName = destZone?.name || 'No Zone';

    if (!nodeDefs.has(destId)) {
      nodeDefs.set(destId, {
        label: destLabel,
        style: 'fill:#e6f4ff,stroke:#1890ff,color:#0958d9',
        zoneId: destZoneId,
        zoneName: destZoneName,
      });
      ensureZone(destZoneId, destZoneName).nodes.push(destId);
    }

    // ── Edge ─────────────────────────────────────────────────────
    const portLabel = r.destination_port
      ? `${r.destination_port.protocol} ${r.destination_port.port_number}`
      : r.protocol || '?';

    const edge = buildEdge(portLabel, r.action, r.status);
    edgeLines.push(`  ${sourceId} ${edge} ${destId}`);
  });

  const lines: string[] = ['graph LR'];

  // Emit subgraphs (Zones)
  zones.forEach((z, id) => {
    lines.push(`  subgraph "${safeLabel(z.name)}"`);
    z.nodes.forEach((nodeId) => {
      const def = nodeDefs.get(nodeId);
      if (def) {
        lines.push(`    ${nodeId}["${safeLabel(def.label)}"]`);
      }
    });
    lines.push('  end');
  });

  // Emit edges
  lines.push(...edgeLines);

  // Emit styles
  nodeDefs.forEach((def, id) => {
    lines.push(`  style ${id} ${def.style}`);
  });

  return lines.join('\n');
}
