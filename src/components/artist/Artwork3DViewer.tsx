/**
 * Composant Visualiseur 3D pour Œuvres d'Artistes
 * Date: 1 Février 2025
 * 
 * Utilise react-three-fiber et drei pour afficher des modèles 3D
 */

import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useProgress } from '@react-three/drei';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RotateCcw, Maximize, Minimize, Settings, Eye } from 'lucide-react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface Artwork3DViewerProps {
  modelUrl: string;
  modelType: 'glb' | 'gltf' | 'obj' | 'fbx' | 'usd' | 'stl';
  thumbnailUrl?: string;
  autoRotate?: boolean;
  autoPlay?: boolean;
  showControls?: boolean;
  backgroundColor?: string;
  cameraPosition?: { x: number; y: number; z: number };
  cameraTarget?: { x: number; y: number; z: number };
  onView?: () => void;
  className?: string;
}

// Composant de chargement
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-white text-center">
        <div className="text-sm mb-2">Chargement du modèle 3D...</div>
        <div className="w-64 bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs mt-2">{Math.round(progress)}%</div>
      </div>
    </Html>
  );
}

// Composant pour charger et afficher le modèle GLTF/GLB
function Model({ url, type }: { url: string; type: string }) {
  let model: any = null;

  if (type === 'glb' || type === 'gltf') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    model = useGLTF(url);
  } else {
    // Pour d'autres formats, on utiliserait des loaders spécifiques
    // Pour l'instant, on affiche un message
    return (
      <Html center>
        <div className="text-white text-center">
          <p>Format {type} non supporté pour le moment</p>
          <p className="text-sm text-gray-400">Utilisez GLB ou GLTF</p>
        </div>
      </Html>
    );
  }

  return <primitive object={model.scene} />;
}

export const Artwork3DViewer = ({
  modelUrl,
  modelType,
  thumbnailUrl,
  autoRotate = true,
  autoPlay = false,
  showControls = true,
  backgroundColor = '#ffffff',
  cameraPosition = { x: 0, y: 0, z: 5 },
  cameraTarget = { x: 0, y: 0, z: 0 },
  onView,
  className,
}: Artwork3DViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showThumbnail, setShowThumbnail] = useState(true);

  useEffect(() => {
    if (onView) {
      onView();
    }
  }, []);

  const handleFullscreen = () => {
    const container = document.getElementById('3d-viewer-container');
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const handleResetCamera = () => {
    // Réinitialiser la caméra (sera géré par OrbitControls)
    window.location.reload(); // Solution simple, à améliorer
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-destructive mb-2">Erreur de chargement</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} id="3d-viewer-container">
      <CardContent className="p-0 relative">
        {/* Thumbnail pendant le chargement */}
        {showThumbnail && thumbnailUrl && (
          <div className="absolute inset-0 z-10 bg-black flex items-center justify-center">
            <img
              src={thumbnailUrl}
              alt="Prévisualisation"
              className="max-w-full max-h-full object-contain"
            />
            <Button
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
              onClick={() => setShowThumbnail(false)}
            >
              Charger le modèle 3D
            </Button>
          </div>
        )}

        {/* Viewer 3D */}
        {!showThumbnail && (
          <div className="relative w-full h-[600px] bg-black">
            <Canvas
              camera={{ position: [cameraPosition.x, cameraPosition.y, cameraPosition.z] }}
              gl={{ antialias: true, alpha: true }}
            >
              <Suspense fallback={<Loader />}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -5]} intensity={0.5} />
                
                {modelType === 'glb' || modelType === 'gltf' ? (
                  <Model url={modelUrl} type={modelType} />
                ) : (
                  <Html center>
                    <div className="text-white text-center">
                      <p>Format {modelType} non supporté</p>
                    </div>
                  </Html>
                )}

                {showControls && (
                  <OrbitControls
                    autoRotate={autoRotate}
                    autoRotateSpeed={1}
                    enableZoom={true}
                    enablePan={true}
                    target={[cameraTarget.x, cameraTarget.y, cameraTarget.z]}
                  />
                )}

                <Environment preset="sunset" />
              </Suspense>
            </Canvas>

            {/* Contrôles */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={handleResetCamera}
                className="bg-black/50 hover:bg-black/70 text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={handleFullscreen}
                className="bg-black/50 hover:bg-black/70 text-white"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>

            {/* Badge format */}
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-black/50 text-white">
                {modelType.toUpperCase()}
              </Badge>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Skeleton className="w-full h-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Précharger les modèles (optionnel, pour performance)
export const preload3DModel = (url: string) => {
  if (url.endsWith('.glb') || url.endsWith('.gltf')) {
    useGLTF.preload(url);
  }
};

