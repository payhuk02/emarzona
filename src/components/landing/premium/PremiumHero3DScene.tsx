import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, Environment, Float, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';

function LuxuriousShape() {
  const meshRef = useRef<THREE.Mesh>(null);
  const prefersReducedMotion = useReducedMotion();

  useFrame(state => {
    if (meshRef.current && !prefersReducedMotion) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float
      speed={prefersReducedMotion ? 0 : 2}
      rotationIntensity={prefersReducedMotion ? 0 : 1.5}
      floatIntensity={prefersReducedMotion ? 0 : 2}
    >
      {/* Core shape with glass material */}
      <Icosahedron ref={meshRef} args={[1, 0]} scale={2.5}>
        <meshPhysicalMaterial
          color="#c9a227"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={1.0}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          transmission={0.9} // Glass effect
          ior={1.5}
          thickness={0.5}
        />
      </Icosahedron>

      {/* Wireframe overlay for a tech aesthetic */}
      <Icosahedron args={[1, 0]} scale={2.52}>
        <meshBasicMaterial color="#c9a227" wireframe transparent opacity={0.15} />
      </Icosahedron>
    </Float>
  );
}

export function PremiumHero3DScene() {
  const [dpr, setDpr] = useState(1.5);

  return (
    <div
      className="absolute inset-0 w-full h-full z-[0] opacity-40 mix-blend-screen pointer-events-none"
      aria-hidden="true"
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={dpr}>
        <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#c9a227" />
        <directionalLight position={[-10, -10, -5]} intensity={1} color="#ffffff" />
        <Environment preset="city" />
        <LuxuriousShape />
      </Canvas>
    </div>
  );
}

export default PremiumHero3DScene;
