/**
 * Native Streaming Player Component
 * Date: 30 Janvier 2025
 * 
 * Composant pour le streaming natif (WebRTC, HLS, RTMP)
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Users,
  MessageSquare,
  Share2,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Type pour HLS.js (bibliothèque externe)
interface HlsInstance {
  loadSource: (url: string) => void;
  attachMedia: (media: HTMLVideoElement) => void;
  on: (event: string, callback: () => void) => void;
  destroy: () => void;
}

interface HlsConstructor {
  new (): HlsInstance;
  Events: {
    MANIFEST_PARSED: string;
    ERROR: string;
  };
}

interface WindowWithHls extends Window {
  Hls?: HlsConstructor;
}

interface NativeStreamingPlayerProps {
  streamingUrl?: string;
  streamingProvider?: 'webrtc' | 'hls' | 'rtmp' | 'mux' | 'agora' | 'custom';
  streamingKey?: string;
  streamingHlsUrl?: string;
  streamingPlaybackUrl?: string;
  title?: string;
  description?: string;
  isLive?: boolean;
  currentViewers?: number;
  maxViewers?: number;
  allowChat?: boolean;
  allowShare?: boolean;
  className?: string;
}

export const NativeStreamingPlayer = ({
  streamingUrl,
  streamingProvider = 'hls',
  streamingKey,
  streamingHlsUrl,
  streamingPlaybackUrl,
  title,
  description,
  isLive = false,
  currentViewers = 0,
  maxViewers,
  allowChat = true,
  allowShare = true,
  className,
}: NativeStreamingPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Configurer la source vidéo selon le provider
    if (streamingProvider === 'hls' && streamingHlsUrl) {
      // Utiliser HLS.js pour HLS
      const windowWithHls = window as WindowWithHls;
      if (typeof window !== 'undefined' && windowWithHls.Hls) {
        const Hls = windowWithHls.Hls;
        const hls = new Hls();
        hls.loadSource(streamingHlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play();
        });
      } else {
        // Fallback pour navigateurs supportant HLS nativement
        video.src = streamingHlsUrl;
      }
    } else if (streamingProvider === 'webrtc' && streamingUrl) {
      // WebRTC nécessite une configuration plus complexe
      // Pour l'instant, on utilise une URL simple
      video.src = streamingUrl;
    } else if (streamingPlaybackUrl) {
      video.src = streamingPlaybackUrl;
    } else if (streamingUrl) {
      video.src = streamingUrl;
    }

    // Gérer le fullscreen
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [streamingUrl, streamingProvider, streamingHlsUrl, streamingPlaybackUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title || 'Live Stream',
        text: description,
        url: window.location.href,
      });
    } else {
      // Fallback: copier dans le presse-papier
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {title || 'Live Stream'}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
            )}
            {currentViewers > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {currentViewers}
                {maxViewers && ` / ${maxViewers}`}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            controls={false}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Contrôles personnalisés */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={togglePlay}
                aria-label={isPlaying ? "Mettre en pause" : "Lire"}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <div className="flex items-center gap-2 flex-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Activer le son" : "Couper le son"}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24"
                />
              </div>

              <div className="flex items-center gap-2">
                {allowChat && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {}}
                    aria-label="Ouvrir le chat"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                )}
                {allowShare && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleShare}
                    aria-label="Partager le stream"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleFullscreen}
                  aria-label="Plein écran"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};







