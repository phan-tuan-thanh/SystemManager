import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface AppNode3DProps {
  position: [number, number, number];
  name: string;
  groupName?: string;
  status: string;
  applicationType?: string;
  selected?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

function statusColor(status: string): string {
  switch (status) {
    case 'RUNNING': return '#52c41a';
    case 'STOPPED': return '#ff4d4f';
    case 'DEPLOYING': return '#1677ff';
    case 'FAILED': return '#ff4d4f';
    default: return '#8c8c8c';
  }
}

export default function AppNode3D({
  position,
  name,
  groupName,
  status,
  selected,
  highlighted,
  onClick,
  onHover,
}: AppNode3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const target = selected || highlighted || hovered ? 1.12 : 1.0;
    const current = meshRef.current.scale.x;
    const next = THREE.MathUtils.lerp(current, target, delta * 6);
    meshRef.current.scale.setScalar(next);
    // Gentle float animation
    meshRef.current.position.y = Math.sin(Date.now() * 0.001 + position[0]) * 0.05;
  });

  const color = statusColor(status);
  const emissive = selected ? '#1677ff' : highlighted ? '#faad14' : '#000000';

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[0.7, 24, 24]}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); onHover?.(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); onHover?.(false); document.body.style.cursor = 'default'; }}
        castShadow
      >
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={selected ? 0.5 : highlighted ? 0.35 : 0}
          roughness={0.3}
          metalness={0.4}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* App name below sphere */}
      <Text
        position={[0, -1.0, 0]}
        fontSize={0.2}
        color="#e8e8e8"
        anchorX="center"
        anchorY="top"
        maxWidth={2.4}
      >
        {name.length > 16 ? name.slice(0, 15) + '…' : name}
      </Text>

      {groupName && (
        <Text
          position={[0, -1.3, 0]}
          fontSize={0.14}
          color="rgba(200,200,200,0.6)"
          anchorX="center"
          anchorY="top"
        >
          {groupName}
        </Text>
      )}
    </group>
  );
}
