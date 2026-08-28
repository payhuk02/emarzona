import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';

const DESKTOP_MQ = '(min-width: 768px)';

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
      <Icosahedron ref={meshRef} args={[1, 0]} scale={2.5}>
        <meshPhysicalMaterial
          color="#c9a227"
          metalness={0.85}
          roughness={0.15}
          clearcoat={0.9}
          clearcoatRoughness={0.15}
          emissive="#c9a227"
          emissiveIntensity={0.12}
        />
      </Icosahedron>

      <Icosahedron args={[1, 0]} scale={2.52}>
        <meshBasicMaterial color="#c9a227" wireframe transparent opacity={0.15} />
      </Icosahedron>
    </Float>
  );
}

function useDesktopWebGL() {
  const prefersReducedMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setEnabled(false);
      return;
    }

    const mq = window.matchMedia(DESKTOP_MQ);
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [prefersReducedMotion]);

  return enabled;
}

export function PremiumHero3DScene() {
  const enabled = useDesktopWebGL();

  if (!enabled) return null;

  return (
    <div
      className="absolute inset-0 w-full h-full z-[0] opacity-40 mix-blend-screen pointer-events-none"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            'webglcontextlost',
            event => {
              event.preventDefault();
            },
            false
          );
        }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#c9a227" />
        <directionalLight position={[-10, -10, -5]} intensity={0.8} color="#ffffff" />
        <pointLight position={[0, 2, 4]} intensity={1.1} color="#e4c76a" />
        <LuxuriousShape />
      </Canvas>
    </div>
  );
}

export default PremiumHero3DScene;
