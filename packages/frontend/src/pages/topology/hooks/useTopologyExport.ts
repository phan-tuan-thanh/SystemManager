import { useCallback } from 'react';
import type { TopologyData } from './useTopology';

export function useTopologyExport(
  topology: TopologyData | undefined,
  environment: string | undefined,
  onError: (msg: string) => void,
  onSuccess: (msg: string) => void,
) {
  const exportAsJSON = useCallback(() => {
    if (!topology) return;
    const blob = new Blob([JSON.stringify(topology, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topology-${environment ?? 'all'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [topology, environment]);

  const exportAsMermaid = useCallback(() => {
    if (!topology) return;
    const lines = ['graph LR'];
    topology.servers.forEach((s) => lines.push(`  ${s.code}["${s.name}"]`));
    topology.connections.forEach((c) => {
      const lookup = topology.servers.flatMap((s) => s.deployments.map((d) => ({ sCode: s.code, appId: d.application.id })));
      const srcCode = lookup.find((x) => x.appId === c.sourceAppId)?.sCode ?? c.sourceAppId;
      const tgtCode = lookup.find((x) => x.appId === c.targetAppId)?.sCode ?? c.targetAppId;
      lines.push(`  ${srcCode} -->|${c.connectionType}| ${tgtCode}`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topology-${environment ?? 'all'}-${Date.now()}.mmd`;
    a.click();
    URL.revokeObjectURL(url);
    onSuccess('Mermaid diagram exported');
  }, [topology, environment, onSuccess]);

  const exportAsPNG = useCallback(() => {
    const svgEl = document.querySelector('.react-flow__renderer svg') as SVGElement;
    if (!svgEl) { onError('Cannot capture topology'); return; }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const { width, height } = svgEl.getBoundingClientRect();
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `topology-${environment ?? 'all'}-${Date.now()}.png`;
        a.click();
      }, 'image/png');
    };
    img.src = url;
  }, [environment, onError]);

  const exportAsSVG = useCallback(() => {
    const svgEl = document.querySelector('.react-flow__renderer svg') as SVGElement;
    if (!svgEl) { onError('Cannot capture topology'); return; }
    const serializer = new XMLSerializer();
    const blob = new Blob([serializer.serializeToString(svgEl)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topology-${environment ?? 'all'}-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    onSuccess('SVG exported');
  }, [environment, onError, onSuccess]);

  return { exportAsJSON, exportAsMermaid, exportAsPNG, exportAsSVG };
}
