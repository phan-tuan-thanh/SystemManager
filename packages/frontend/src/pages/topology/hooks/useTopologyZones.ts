import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/client';
import type { ApiResponse } from '../../../types/auth';
import type { NetworkZone, NetworkZoneType, ZoneIpEntry } from '../../../types/network-zone';
import type { ServerNode } from './useTopology';

// ─── Zone style by zone_type ───────────────────────────────────────

const ZONE_TYPE_STYLE: Record<NetworkZoneType | 'default', { color: string; borderColor: string; headerBg: string }> = {
  LOCAL:      { color: '#e6f4ff', borderColor: '#4096ff', headerBg: '#1677ff' },
  DMZ:        { color: '#fffbe6', borderColor: '#faad14', headerBg: '#fa8c16' },
  DB:         { color: '#f9f0ff', borderColor: '#9254de', headerBg: '#722ed1' },
  DEV:        { color: '#f6ffed', borderColor: '#73d13d', headerBg: '#52c41a' },
  UAT:        { color: '#e6f7ff', borderColor: '#69c0ff', headerBg: '#1890ff' },
  PROD:       { color: '#fff1f0', borderColor: '#ff7875', headerBg: '#ff4d4f' },
  INTERNET:   { color: '#f5f5f5', borderColor: '#bfbfbf', headerBg: '#8c8c8c' },
  MANAGEMENT: { color: '#e8f4f8', borderColor: '#26a0da', headerBg: '#1a6fa3' },
  STORAGE:    { color: '#fff3e0', borderColor: '#ffa726', headerBg: '#f57c00' },
  BACKUP:     { color: '#fce4ec', borderColor: '#f48fb1', headerBg: '#e91e63' },
  CUSTOM:     { color: '#f5f5f5', borderColor: '#9e9e9e', headerBg: '#616161' },
  default:    { color: '#f5f5f5', borderColor: '#bfbfbf', headerBg: '#8c8c8c' },
};

// ─── IP matching ───────────────────────────────────────────────────

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}

function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [network, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    return (ipToInt(ip) & mask) === (ipToInt(network) & mask);
  } catch {
    return false;
  }
}

function matchesEntry(ip: string, entry: ZoneIpEntry): boolean {
  try {
    const addr = entry.ip_address;
    if (entry.is_range) {
      if (addr.includes('/')) return isIpInCidr(ip, addr);
      if (addr.includes('-')) {
        const [start, end] = addr.split('-').map((s) => s.trim());
        return ipToInt(ip) >= ipToInt(start) && ipToInt(ip) <= ipToInt(end);
      }
    }
    return ip === addr;
  } catch {
    return false;
  }
}

function getServerIps(server: ServerNode): string[] {
  const ips: string[] = [];
  server.networkConfigs.forEach((nc) => {
    if (nc.private_ip) ips.push(nc.private_ip);
    if (nc.public_ip) ips.push(nc.public_ip);
  });
  return ips;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(200,200,200,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Types ─────────────────────────────────────────────────────────

export interface TopologyZone {
  id: string;
  name: string;
  color: string;
  borderColor: string;
  headerBg: string;
  order: number;
}

interface ZoneStorage {
  zoneOrder: Record<string, number>;
  serverZoneMap: Record<string, string>;
}

const STORAGE_KEY = 'topology.zones.v2';

function loadStorage(): ZoneStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ZoneStorage) : { zoneOrder: {}, serverZoneMap: {} };
  } catch {
    return { zoneOrder: {}, serverZoneMap: {} };
  }
}

function persist(config: ZoneStorage) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch { /* ignore */ }
}

// ─── Fetch NetworkZones with IP entries ───────────────────────────

export function useNetworkZonesWithIps(environment?: string) {
  return useQuery<NetworkZone[]>({
    queryKey: ['network-zones-with-ips', environment ?? 'all'],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '200' };
      if (environment) params.environment = environment;
      const { data } = await apiClient.get<ApiResponse<NetworkZone[]>>('/network-zones', { params });
      const zones: NetworkZone[] = data.data ?? [];

      const zonesWithIps = await Promise.all(
        zones.map(async (zone) => {
          try {
            const { data: ipRes } = await apiClient.get<ApiResponse<ZoneIpEntry[]>>(
              `/network-zones/${zone.id}/ips`,
            );
            return { ...zone, ip_entries: ipRes.data ?? [] };
          } catch {
            return { ...zone, ip_entries: [] };
          }
        }),
      );
      return zonesWithIps;
    },
    staleTime: 60_000,
  });
}

// ─── Main hook ────────────────────────────────────────────────────

export function useTopologyZones(servers: ServerNode[], networkZones: NetworkZone[]) {
  const [storage, setStorage] = useState<ZoneStorage>(loadStorage);

  // Map NetworkZone → TopologyZone, applying user-saved order and NetworkZone.color
  const zones = useMemo<TopologyZone[]>(() => {
    return networkZones.map((nz, idx) => {
      const style = (ZONE_TYPE_STYLE as Record<string, typeof ZONE_TYPE_STYLE['default']>)[nz.zone_type]
        ?? ZONE_TYPE_STYLE.default;
      const savedOrder = storage.zoneOrder[nz.id];
      const baseColor = nz.color ?? style.borderColor;
      return {
        id: nz.id,
        name: nz.name,
        color: nz.color ? hexToRgba(nz.color, 0.08) : style.color,
        borderColor: baseColor,
        headerBg: baseColor,
        order: savedOrder ?? idx,
      };
    });
  }, [networkZones, storage.zoneOrder]);

  // Auto-assign server to zone by matching IPs against ip_entries (sorted by current order)
  const autoAssignZone = useCallback(
    (server: ServerNode): string | null => {
      const serverIps = getServerIps(server);
      if (serverIps.length === 0) return null;

      const sortedZones = [...networkZones].sort((a, b) => {
        const oa = storage.zoneOrder[a.id] ?? 0;
        const ob = storage.zoneOrder[b.id] ?? 0;
        return oa - ob;
      });

      for (const nz of sortedZones) {
        const entries = nz.ip_entries ?? [];
        if (serverIps.some((ip) => entries.some((e) => matchesEntry(ip, e)))) return nz.id;
      }
      return null;
    },
    [networkZones, storage.zoneOrder],
  );

  const getServerZone = useCallback(
    (server: ServerNode): string | null =>
      storage.serverZoneMap[server.id] ?? autoAssignZone(server),
    [storage.serverZoneMap, autoAssignZone],
  );

  const serversByZone = useMemo(() => {
    const map = new Map<string, ServerNode[]>();
    zones.forEach((z) => map.set(z.id, []));

    const unmatched: ServerNode[] = [];
    servers.forEach((s) => {
      const zId = getServerZone(s);
      if (zId && map.has(zId)) {
        map.get(zId)!.push(s);
      } else {
        unmatched.push(s);
      }
    });

    // Unmatched servers fall into the first zone (by order) as fallback
    if (unmatched.length > 0 && zones.length > 0) {
      const firstId = [...zones].sort((a, b) => a.order - b.order)[0].id;
      map.set(firstId, [...(map.get(firstId) ?? []), ...unmatched]);
    }

    return map;
  }, [zones, servers, getServerZone]);

  const activeZones = useMemo(
    () =>
      [...zones]
        .filter((z) => (serversByZone.get(z.id)?.length ?? 0) > 0)
        .sort((a, b) => a.order - b.order),
    [zones, serversByZone],
  );

  const reorderZones = useCallback((orderedIds: string[]) => {
    setStorage((prev) => {
      const zoneOrder = { ...prev.zoneOrder };
      orderedIds.forEach((id, i) => { zoneOrder[id] = i; });
      const updated = { ...prev, zoneOrder };
      persist(updated);
      return updated;
    });
  }, []);

  const assignServer = useCallback((serverId: string, zoneId: string) => {
    setStorage((prev) => {
      const updated = { ...prev, serverZoneMap: { ...prev.serverZoneMap, [serverId]: zoneId } };
      persist(updated);
      return updated;
    });
  }, []);

  const resetZones = useCallback(() => {
    const empty = { zoneOrder: {}, serverZoneMap: {} };
    setStorage(empty);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  return { zones, activeZones, serversByZone, getServerZone, reorderZones, assignServer, resetZones };
}
