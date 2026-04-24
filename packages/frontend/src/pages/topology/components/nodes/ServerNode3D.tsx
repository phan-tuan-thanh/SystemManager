import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface ServerNode3DProps {
  position: [number, number, number];
  name: string;
  code: string;
  status: string;
  environment: string;
  site: string;
  deploymentCount?: number;
  selected?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

function statusColor(status: string): string {
  switch (status) {
    case 'ACTIVE': return '#52c41a';
    case 'INACTIVE': return '#ff4d4f';
    case 'MAINTENANCE': return '#faad14';
    default: return '#8c8c8c';
  }
}

export default function ServerNode3D({
  position,
  name,
  code,
  status,
  deploymentCount = 0,
  selected,
  highlighted,
  onClick,
  onHover,
}: ServerNode3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const target = selected || highlighted || hovered ? 1.08 : 1.0;
    const current = meshRef.current.scale.x;
    const next = THREE.MathUtils.lerp(current, target, delta * 6);
    meshRef.current.scale.setScalar(next);
  });

  const color = statusColor(status);
  const emissive = selected ? '#1677ff' : highlighted ? '#faad14' : '#000000';

  return (
    <group position={position}>
      <RoundedBox
        ref={meshRef}
        args={[2.2, 1.0, 1.4]}
        radius={0.08}
        smoothness={4}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); onHover?.(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); onHover?.(false); document.body.style.cursor = 'default'; }}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={selected ? 0.4 : highlighted ? 0.3 : 0}
          roughness={0.4}
          metalness={0.6}
        />
      </RoundedBox>

      {/* Status indicator dot */}
      <mesh position={[-0.8, 0.5, 0.71]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      {/* Server name */}
      <Text
        position={[0, 0, 0.72]}
        fontSize={0.22}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
        font={undefined}
      >
        {name.length > 14 ? name.slice(0, 13) + '…' : name}
      </Text>

      {/* Code + deployment count */}
      <Text
        position={[0, -0.22, 0.72]}
        fontSize={0.15}
        color="rgba(255,255,255,0.75)"
        anchorX="center"
        anchorY="middle"
      >
        {code} · {deploymentCount} app{deploymentCount !== 1 ? 's' : ''}
      </Text>
    </group>
  );
}
