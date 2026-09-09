import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, Float } from '@react-three/drei';
import * as THREE from 'three';

const DESKTOP_MQ = '(min-width: 768px)';

function LuxuriousShape({ reducedMotion }: { reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(state => {
    if (meshRef.current && !reducedMotion) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.12;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.16;
    }
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 1.2}
      rotationIntensity={reducedMotion ? 0 : 0.8}
      floatIntensity={reducedMotion ? 0 : 1.2}
    >
      <Icosahedron ref={meshRef} args={[1, 0]} scale={2.5}>
        <meshStandardMaterial
          color="#c9a227"
          metalness={0.75}
          roughness={0.25}
          emissive="#c9a227"
          emissiveIntensity={0.1}
        />
      </Icosahedron>

      <Icosahedron args={[1, 0]} scale={2.52}>
        <meshBasicMaterial color="#c9a227" wireframe transparent opacity={0.12} />
      </Icosahedron>
    </Float>
  );
}

function useDesktopWebGL() {
  const [enabled, setEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqDesktop = window.matchMedia(DESKTOP_MQ);

    const update = () => {
      setReducedMotion(mqMotion.matches);
      setEnabled(mqDesktop.matches && !mqMotion.matches);
    };
    update();
    mqMotion.addEventListener('change', update);
    mqDesktop.addEventListener('change', update);
    return () => {
      mqMotion.removeEventListener('change', update);
      mqDesktop.removeEventListener('change', update);
    };
  }, []);

  return { enabled, reducedMotion };
}

export function PremiumHero3DScene() {
  const { enabled, reducedMotion } = useDesktopWebGL();

  if (!enabled) return null;

  return (
    <div
      className="absolute inset-0 w-full h-full z-[0] opacity-40 mix-blend-screen pointer-events-none"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={1}
        gl={{ antialias: false, powerPreference: 'low-power', alpha: true }}
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
        <directionalLight position={[10, 10, 5]} intensity={1.6} color="#c9a227" />
        <directionalLight position={[-10, -10, -5]} intensity={0.6} color="#ffffff" />
        <LuxuriousShape reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}

export default PremiumHero3DScene;
