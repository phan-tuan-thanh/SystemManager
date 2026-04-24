import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface ChangeItem {
  id: string;
  resource_type: string;
  resource_id: string | null;
  action: string;
  old_value: any;
  new_value: any;
}

interface ConflictWarning {
  type: 'IP_CONFLICT' | 'PORT_CONFLICT' | 'CIRCULAR_DEP';
  severity: 'ERROR' | 'WARNING';
  message: string;
  affected_resources: string[];
}

@Injectable()
export class PreviewEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async compute(changeset: { id: string; environment: string | null; items: ChangeItem[] }) {
    const envFilter: any = changeset.environment
      ? { environment: changeset.environment }
      : {};

    const [servers, networkConfigs, applications, connections, deployments, ports] =
      await Promise.all([
        this.prisma.server.findMany({ where: { deleted_at: null, ...envFilter } }),
        this.prisma.networkConfig.findMany({
          where: { deleted_at: null, server: { deleted_at: null, ...envFilter } },
          include: { server: { select: { id: true, environment: true } } },
        }),
        this.prisma.application.findMany({ where: { deleted_at: null } }),
        this.prisma.appConnection.findMany({ where: { deleted_at: null, ...envFilter } }),
        this.prisma.appDeployment.findMany({ where: { deleted_at: null, ...envFilter } }),
        this.prisma.port.findMany({
          where: { deleted_at: null, deployment: { deleted_at: null, ...envFilter } },
          include: { deployment: { select: { id: true, server_id: true } } },
        }),
      ]);

    // Build mutable virtual copies
    let vServers: any[] = servers.map((s) => ({ ...s }));
    let vNetworkConfigs: any[] = networkConfigs.map((n) => ({ ...n }));
    let vApplications: any[] = applications.map((a) => ({ ...a }));
    let vConnections: any[] = connections.map((c) => ({ ...c }));
    let vDeployments: any[] = deployments.map((d) => ({ ...d }));
    let vPorts: any[] = ports.map((p) => ({ ...p }));

    const summary = { created: 0, updated: 0, deleted: 0 };

    for (const item of changeset.items) {
      switch (item.resource_type) {
        case 'SERVER':          this._applyToList(vServers, item, summary); break;
        case 'NETWORK_CONFIG':  this._applyToList(vNetworkConfigs, item, summary); break;
        case 'APPLICATION':     this._applyToList(vApplications, item, summary); break;
        case 'APP_CONNECTION':  this._applyToList(vConnections, item, summary); break;
        case 'APP_DEPLOYMENT':  this._applyToList(vDeployments, item, summary); break;
        case 'PORT':            this._applyToList(vPorts, item, summary); break;
      }
    }

    const conflicts: ConflictWarning[] = [
      ...this._detectIpConflicts(vNetworkConfigs),
      ...this._detectPortConflicts(vPorts),
      ...this._detectCircularDeps(vConnections),
    ];

    return {
      changeset_id: changeset.id,
      environment: changeset.environment,
      change_summary: summary,
      conflicts,
      has_fatal_conflicts: conflicts.some((c) => c.severity === 'ERROR'),
      virtual_topology: {
        servers: vServers.map((s) => ({ ...s, _change_status: s._change_status ?? 'UNCHANGED' })),
        network_configs: vNetworkConfigs.map((n) => ({ ...n, _change_status: n._change_status ?? 'UNCHANGED' })),
        applications: vApplications.map((a) => ({ ...a, _change_status: a._change_status ?? 'UNCHANGED' })),
        connections: vConnections.map((c) => ({ ...c, _change_status: c._change_status ?? 'UNCHANGED' })),
        deployments: vDeployments.map((d) => ({ ...d, _change_status: d._change_status ?? 'UNCHANGED' })),
        ports: vPorts.map((p) => ({ ...p, _change_status: p._change_status ?? 'UNCHANGED' })),
      },
    };
  }

  private _applyToList(list: any[], item: ChangeItem, summary: { created: number; updated: number; deleted: number }) {
    if (item.action === 'CREATE') {
      list.push({
        ...(item.new_value ?? {}),
        id: item.new_value?.id ?? `preview_new_${Date.now()}_${Math.random()}`,
        _change_status: 'NEW',
      });
      summary.created++;
    } else if (item.action === 'UPDATE') {
      const idx = list.findIndex((e) => e.id === item.resource_id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...(item.new_value ?? {}), _change_status: 'MODIFIED' };
      }
      summary.updated++;
    } else if (item.action === 'DELETE') {
      const idx = list.findIndex((e) => e.id === item.resource_id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], _change_status: 'DELETED', _deleted: true };
      }
      summary.deleted++;
    }
  }

  private _detectIpConflicts(networkConfigs: any[]): ConflictWarning[] {
    const conflicts: ConflictWarning[] = [];
    const ipMap = new Map<string, any[]>();

    for (const nc of networkConfigs.filter((n) => !n._deleted && n.private_ip)) {
      const env = nc.server?.environment ?? 'UNKNOWN';
      const key = `${env}:${nc.private_ip}`;
      if (!ipMap.has(key)) ipMap.set(key, []);
      ipMap.get(key)!.push(nc);
    }

    for (const [key, ncs] of ipMap) {
      if (ncs.length > 1) {
        const [env, ip] = key.split(':');
        conflicts.push({
          type: 'IP_CONFLICT',
          severity: 'ERROR',
          message: `IP conflict: ${ip} assigned to ${ncs.length} network configs in ${env}`,
          affected_resources: ncs.map((n) => n.id),
        });
      }
    }
    return conflicts;
  }

  private _detectPortConflicts(ports: any[]): ConflictWarning[] {
    const conflicts: ConflictWarning[] = [];
    const portMap = new Map<string, any[]>();

    for (const port of ports.filter((p) => !p._deleted)) {
      const serverId = port.deployment?.server_id;
      if (serverId) {
        const key = `${serverId}:${port.port_number}:${port.protocol}`;
        if (!portMap.has(key)) portMap.set(key, []);
        portMap.get(key)!.push(port);
      }
    }

    for (const [key, pts] of portMap) {
      if (pts.length > 1) {
        const parts = key.split(':');
        conflicts.push({
          type: 'PORT_CONFLICT',
          severity: 'ERROR',
          message: `Port conflict: ${parts[1]}/${parts[2]} used by ${pts.length} apps on server ${parts[0]}`,
          affected_resources: pts.map((p) => p.id),
        });
      }
    }
    return conflicts;
  }

  private _detectCircularDeps(connections: any[]): ConflictWarning[] {
    const graph = new Map<string, string[]>();
    for (const c of connections.filter((c) => !c._deleted)) {
      if (!graph.has(c.source_app_id)) graph.set(c.source_app_id, []);
      graph.get(c.source_app_id)!.push(c.target_app_id);
    }

    const conflicts: ConflictWarning[] = [];
    const visited = new Set<string>();

    const dfs = (node: string, path: string[], inPath: Set<string>) => {
      if (inPath.has(node)) {
        const cycleStart = path.indexOf(node);
        const cycle = [...path.slice(cycleStart), node];
        conflicts.push({
          type: 'CIRCULAR_DEP',
          severity: 'ERROR',
          message: `Circular dependency: ${cycle.join(' → ')}`,
          affected_resources: cycle,
        });
        return;
      }
      if (visited.has(node)) return;
      visited.add(node);
      inPath.add(node);
      path.push(node);
      for (const neighbor of graph.get(node) ?? []) {
        dfs(neighbor, path, inPath);
      }
      path.pop();
      inPath.delete(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) dfs(node, [], new Set());
    }

    return conflicts;
  }
}
