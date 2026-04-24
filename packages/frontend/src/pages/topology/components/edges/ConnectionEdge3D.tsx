import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

interface ConnectionEdge3DProps {
  start: [number, number, number];
  end: [number, number, number];
  protocol: string;
  highlighted?: boolean;
}

const protocolColors: Record<string, string> = {
  HTTP: '#1677ff',
  HTTPS: '#52c41a',
  TCP: '#fa8c16',
  GRPC: '#722ed1',
  AMQP: '#eb2f96',
  KAFKA: '#13c2c2',
  DATABASE: '#ff4d4f',
};

export default function ConnectionEdge3D({ start, end, protocol, highlighted }: ConnectionEdge3DProps) {
  const color = protocolColors[protocol] ?? '#8c8c8c';
  const activeColor = highlighted ? '#faad14' : color;

  const { points, midPoint } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = new THREE.Vector3().lerpVectors(s, e, 0.5);
    // Arc upward through mid
    mid.y += 1.2;
    const curve = new THREE.QuadraticBezierCurve3(s, mid, e);
    return { points: curve.getPoints(32), midPoint: mid };
  }, [start, end]);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineBasicMaterial
          color={activeColor}
          linewidth={highlighted ? 3 : 1.5}
          transparent
          opacity={highlighted ? 1.0 : 0.65}
        />
      </line>

      {/* Protocol label at midpoint */}
      <Text
        position={[midPoint.x, midPoint.y + 0.3, midPoint.z]}
        fontSize={0.18}
        color={activeColor}
        anchorX="center"
        anchorY="middle"
        backgroundColor="rgba(0,0,0,0.5)"
        padding={0.05}
      >
        {protocol}
      </Text>
    </group>
  );
}
