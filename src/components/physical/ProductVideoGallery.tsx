/**
 * Product Video Gallery Component
 * Date: 1 Février 2025
 * 
 * Composant pour afficher des vidéos produits intégrées
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ProductVideo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title?: string;
  duration?: number;
  provider?: 'youtube' | 'vimeo' | 'direct' | 'self-hosted';
}

interface ProductVideoGalleryProps {
  videos: ProductVideo[];
  productName: string;
  className?: string;
}

export const ProductVideoGallery = ({
  videos,
  productName,
  className,
}: ProductVideoGalleryProps) => {
  const [selectedVideo, setSelectedVideo] = useState<ProductVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (videos.length === 0) {
    return null;
  }

  const handleVideoClick = (video: ProductVideo) => {
    setSelectedVideo(video);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    }
  };

  // Rendre URL vidéo selon provider
  const getVideoUrl = (video: ProductVideo): string => {
    if (video.provider === 'youtube') {
      // Extraire ID YouTube de l'URL
      const youtubeId = video.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : video.url;
    }
    if (video.provider === 'vimeo') {
      // Extraire ID Vimeo
      const vimeoId = video.url.match(/vimeo\.com\/(\d+)/)?.[1];
      return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : video.url;
    }
    return video.url;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Grille de vidéos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="relative aspect-video bg-muted rounded-lg overflow-hidden group cursor-pointer"
            onClick={() => handleVideoClick(video)}
          >
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt={video.title || productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Play className="h-16 w-16 text-muted-foreground" />
              </div>
            )}

            {/* Overlay play */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform">
                <Play className="h-8 w-8 text-primary" fill="currentColor" />
              </div>
            </div>

            {/* Durée */}
            {video.duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {formatDuration(video.duration)}
              </div>
            )}

            {/* Titre */}
            {video.title && (
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs max-w-[80%] truncate">
                {video.title}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dialog vidéo */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedVideo && (
            <div className="relative aspect-video bg-black">
              {selectedVideo.provider === 'youtube' || selectedVideo.provider === 'vimeo' ? (
                <iframe
                  src={getVideoUrl(selectedVideo)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    src={selectedVideo.url}
                    className="w-full h-full"
                    controls
                    autoPlay={isPlaying}
                    muted={isMuted}
                  />
                  
                  {/* Contrôles personnalisés (optionnel) */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-lg px-4 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePlayPause}
                      className="text-white hover:text-white hover:bg-white/20"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMute}
                      className="text-white hover:text-white hover:bg-white/20"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFullscreen}
                      className="text-white hover:text-white hover:bg-white/20"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};







