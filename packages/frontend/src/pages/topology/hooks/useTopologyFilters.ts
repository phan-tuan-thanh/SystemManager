import { useMemo } from 'react';
import { analyzeTopologyHealth } from '../components/ConnectionHealthDrawer';
import type { ServerNode, ConnectionEdge, TopologyData } from './useTopology';

interface Filters {
  environment?: string;
  nodeType: 'all' | 'server' | 'app';
  visibleServerIds: string[];
  visibleGroupNames: string[];
  visibleAppIds: string[];
}

interface FilteredData {
  servers: ServerNode[];
  connections: ConnectionEdge[];
  serversForEdgeResolution: ServerNode[];
  connectionsForEdgeResolution: ConnectionEdge[];
}

export function useTopologyFilters(topology: TopologyData | undefined, filters: Filters) {
  const filteredData = useMemo((): FilteredData => {
    if (!topology) return { servers: [], connections: [], serversForEdgeResolution: [], connectionsForEdgeResolution: [] };

    let servers = [...topology.servers];
    let connections = [...topology.connections];

    if (filters.environment) {
      servers = servers
        .filter((s) => s.environment === filters.environment)
        .map((s) => ({ ...s, deployments: s.deployments.filter((d) => d.environment === filters.environment) }));
      const validAppIds = new Set<string>();
      servers.forEach((s) => s.deployments.forEach((d) => validAppIds.add(d.application.id)));
      connections = connections.filter((c) => validAppIds.has(c.sourceAppId) && validAppIds.has(c.targetAppId));
    }

    const hasServerFilter = filters.visibleServerIds.length > 0;
    const hasGroupFilter = filters.visibleGroupNames.length > 0;
    const hasAppFilter = filters.visibleAppIds.length > 0;

    if (hasServerFilter) {
      servers = servers.filter((s) => filters.visibleServerIds.includes(s.id));
    }

    if (hasGroupFilter || hasAppFilter) {
      servers = servers.map((s) => {
        let deps = s.deployments;
        if (hasGroupFilter) deps = deps.filter((d) => filters.visibleGroupNames.includes(d.application.groupName ?? ''));
        if (hasAppFilter) deps = deps.filter((d) => filters.visibleAppIds.includes(d.application.id));
        return { ...s, deployments: deps };
      });
      servers = servers.filter((s) => s.deployments.length > 0);
    }

    if (hasServerFilter || hasGroupFilter || hasAppFilter) {
      const visibleAppIds = new Set<string>();
      servers.forEach((s) => s.deployments.forEach((d) => visibleAppIds.add(d.application.id)));
      connections = connections.filter((c) => visibleAppIds.has(c.sourceAppId) && visibleAppIds.has(c.targetAppId));
    }

    const serversForEdgeResolution = servers;
    const connectionsForEdgeResolution = connections;

    if (filters.nodeType === 'server') {
      servers = servers.map((s) => ({ ...s, deployments: [] }));
      connections = [];
    }

    return { servers, connections, serversForEdgeResolution, connectionsForEdgeResolution };
  }, [topology, filters.environment, filters.nodeType, filters.visibleServerIds, filters.visibleGroupNames, filters.visibleAppIds]);

  const dropdownOptions = useMemo(() => {
    let servers = topology?.servers ?? [];
    if (filters.environment) {
      servers = servers
        .filter((s) => s.environment === filters.environment)
        .map((s) => ({ ...s, deployments: s.deployments.filter((d) => d.environment === filters.environment) }));
    }
    const groupSet = new Set<string>();
    const appMap = new Map<string, string>();
    servers.forEach((s) => {
      s.deployments.forEach((d) => {
        if (d.application.groupName) groupSet.add(d.application.groupName);
        appMap.set(d.application.id, d.application.name);
      });
    });
    return {
      groupOptions: [...groupSet].sort().map((g) => ({ label: g, value: g })),
      serverOptions: servers.map((s) => {
        const net = s.networkConfigs[0];
        const ip = net?.private_ip || net?.public_ip || net?.domain || '';
        return { label: s.name, value: s.id, description: ip };
      }),
      appOptions: [...appMap.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, name]) => ({ label: name, value: id })),
    };
  }, [topology?.servers, filters.environment]);

  const cascadeMaps = useMemo(() => {
    const groups: Record<string, string[]> = {};
    const apps: Record<string, string[]> = {};
    (topology?.servers ?? []).forEach((s) => {
      groups[s.id] = s.deployments.map((d) => d.application.groupName).filter((g): g is string => Boolean(g));
      apps[s.id] = s.deployments.map((d) => d.application.id);
    });
    return { serverGroupsMap: groups, serverAppsMap: apps };
  }, [topology?.servers]);

  const healthIssueCount = useMemo(() => {
    if (!topology) return 0;
    const issues = analyzeTopologyHealth(topology.servers, topology.connections);
    return issues.filter((i) => i.severity === 'ERROR' || i.severity === 'WARNING').length;
  }, [topology]);

  return { filteredData, dropdownOptions, cascadeMaps, healthIssueCount };
}
