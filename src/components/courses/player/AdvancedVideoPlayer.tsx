/**
 * Lecteur Vidéo Avancé avec Qualité Adaptive et Contrôles Avancés
 * Date : 1 Février 2025
 *
 * Fonctionnalités :
 * - Qualité adaptive (auto, 360p, 480p, 720p, 1080p, 4K)
 * - Contrôles avancés (vitesse, sous-titres, pip, mini-player)
 * - Raccourcis clavier
 * - Statistiques de lecture
 * - Mode théâtre
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  PictureInPicture,
  AlertCircle,
} from 'lucide-react';
import { useUpdateVideoPosition, useLessonProgress } from '@/hooks/courses/useCourseProgress';
// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';
import { useVideoTracking, useWatchTime } from '@/hooks/courses/useVideoTracking';
import { getSessionId } from '@/hooks/courses/useCourseAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface VideoQuality {
  label: string;
  value: string;
  resolution?: string;
}

interface AdvancedVideoPlayerProps {
  videoType: 'upload' | 'youtube' | 'vimeo' | 'google-drive';
  videoUrl: string;
  title?: string;
  productId?: string;
  enrollmentId?: string;
  lessonId?: string;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onSeekTo?: (_seconds: number) => void;
  currentTime?: number;
  qualities?: VideoQuality[]; // Qualités disponibles
  subtitles?: Array<{ lang: string; url: string; label: string }>;
  className?: string;
}

export const AdvancedVideoPlayer = ({
  videoType,
  videoUrl,
  title,
  productId,
  enrollmentId,
  lessonId,
  onEnded,
  onTimeUpdate,
  onSeekTo: _onSeekTo,
  currentTime,
  qualities = [],
  subtitles = [],
  className,
}: AdvancedVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const { user } = useAuth();

  // États de lecture
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('none');
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);
  const [networkState, setNetworkState] = useState<number>(0);
  const [showSettings, setShowSettings] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks pour la progression
  const { data: progress } = useLessonProgress(enrollmentId, lessonId);
  const updatePosition = useUpdateVideoPosition();
  const videoTracking = useVideoTracking({
    productId: productId || '',
    lessonId,
    userId: user?.id,
    sessionId: getSessionId(),
    enabled: !!productId,
  });
  const watchTime = useWatchTime(enrollmentId, lessonId);

  // Qualités par défaut si non fournies
  const  defaultQualities: VideoQuality[] =
    qualities.length > 0
      ? qualities
      : [
          { label: 'Auto', value: 'auto' },
          { label: '1080p', value: '1080p', resolution: '1920x1080' },
          { label: '720p', value: '720p', resolution: '1280x720' },
          { label: '480p', value: '480p', resolution: '854x480' },
          { label: '360p', value: '360p', resolution: '640x360' },
        ];

  // Restaurer la position sauvegardée
  useEffect(() => {
    if (videoRef.current && progress?.last_position_seconds && videoType === 'upload') {
      if (progress.last_position_seconds > 5) {
        videoRef.current.currentTime = progress.last_position_seconds;
      }
    }
  }, [progress, videoType]);

  // Navigation externe vers un timestamp
  useEffect(() => {
    if (currentTime !== undefined && videoRef.current && videoType === 'upload') {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime, videoType]);

  // Sauvegarder la position toutes les 10 secondes
  useEffect(() => {
    if (!enrollmentId || !lessonId || videoType !== 'upload') return;

    saveIntervalRef.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const currentTime = videoRef.current.currentTime;
        const watchTime = Math.floor((Date.now() - startTimeRef.current) / 1000);

        updatePosition.mutate({
          enrollmentId,
          lessonId,
          position: Math.floor(currentTime),
          watchTime,
        });

        startTimeRef.current = Date.now();
      }
    }, 10000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [enrollmentId, lessonId, videoType, updatePosition]);

  // Gérer les événements vidéo
  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video
      .play()
      .then(() => {
        setIsPlaying(true);
        if (videoTracking) {
          videoTracking.handlePlay(video.currentTime, video.duration);
        }
        watchTime.startWatching();
      })
      .catch( err => {
        setError('Impossible de lire la vidéo');
        // ✅ PHASE 2: Remplacer console.error par logger
        logger.error('Error loading video', { error: err });
      });
  }, [videoTracking, watchTime]);

  const handlePause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    setIsPlaying(false);
    if (videoTracking) {
      videoTracking.handlePause(video.currentTime, video.duration);
    }
    watchTime.stopWatching();
  }, [videoTracking, watchTime]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentVideoTime(video.currentTime);
    setDuration(video.duration);
    setBuffered(video.buffered.length > 0 ? video.buffered.end(0) : 0);
    setNetworkState(video.networkState);

    if (onTimeUpdate) {
      onTimeUpdate(video.currentTime);
    }

    if (videoTracking) {
      videoTracking.handleProgress(video.currentTime, video.duration);
    }
  }, [onTimeUpdate, videoTracking]);

  const handleSeek= useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value[0];
    setCurrentVideoTime(value[0]);
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      // ✅ PHASE 2: Remplacer console.error par logger
      logger.error('Erreur fullscreen', { error: err });
    }
  }, [isFullscreen]);

  const handlePictureInPicture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;

    try {
      if (!isPictureInPicture) {
        await video.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
    } catch (err) {
      // ✅ PHASE 2: Remplacer console.error par logger
      logger.error('Erreur Picture-in-Picture', { error: err });
    }
  }, [isPictureInPicture]);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (isPlaying) {
            handlePause();
          } else {
            handlePlay();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange([Math.min(1, volume + 0.1)]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume - 0.1)]);
          break;
        case 'f':
          e.preventDefault();
          handleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setIsMuted(!isMuted);
          if (videoRef.current) {
            videoRef.current.muted = !isMuted;
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPlaying,
    handlePlay,
    handlePause,
    skip,
    volume,
    handleVolumeChange,
    isMuted,
    handleFullscreen,
  ]);

  // Gérer fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Gérer Picture-in-Picture
  useEffect(() => {
    const handlePiPChange = () => {
      setIsPictureInPicture(!!document.pictureInPictureElement);
    };

    document.addEventListener('enterpictureinpicture', handlePiPChange);
    document.addEventListener('leavepictureinpicture', handlePiPChange);
    return () => {
      document.removeEventListener('enterpictureinpicture', handlePiPChange);
      document.removeEventListener('leavepictureinpicture', handlePiPChange);
    };
  }, []);

  // Afficher/masquer les contrôles
  useEffect(() => {
    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, currentVideoTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentVideoTime / duration) * 100 : 0;
  const bufferedPercentage = duration > 0 ? (buffered / duration) * 100 : 0;

  if (videoType !== 'upload') {
    // Pour YouTube, Vimeo, etc., utiliser le player de base
    return null; // Ou wrapper avec iframe
  }

  return (
    <Card
      ref={containerRef}
      className={cn('overflow-hidden bg-black relative group', className)}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying) {
          setTimeout(() => setShowControls(false), 2000);
        }
      }}
    >
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <div className="absolute inset-0">
          {error ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              onEnded={() => {
                if (onEnded) onEnded();
              }}
              onError={() => setError('Erreur de lecture vidéo')}
              playsInline
            >
              <source src={videoUrl} type="video/mp4" />
              {subtitles.map(sub => (
                <track
                  key={sub.lang}
                  kind="subtitles"
                  srcLang={sub.lang}
                  src={sub.url}
                  label={sub.label}
                  default={selectedSubtitle === sub.lang}
                />
              ))}
            </video>
          )}

          {/* Contrôles */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300',
              showControls ? 'opacity-100' : 'opacity-0'
            )}
          >
            {/* Barre de progression */}
            <div className="px-4 pt-2 pb-1">
              <div
                className="relative h-1 bg-white/20 rounded-full cursor-pointer"
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  if (videoRef.current) {
                    videoRef.current.currentTime = percent * duration;
                  }
                }}
              >
                <div
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
                <div
                  className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                  style={{ width: `${bufferedPercentage}%` }}
                />
              </div>
            </div>

            {/* Contrôles principaux */}
            <div className="flex items-center gap-2 px-4 py-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={isPlaying ? handlePause : handlePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => skip(-10)}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => skip(10)}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                  }
                }}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>

              <div className="w-24">
                <Slider
                  value={[volume]}
                  onValueChange={value => handleVolumeChange(value)}
                  min={0}
                  max={1}
                  step={0.01}
                  className="cursor-pointer"
                />
              </div>

              <div className="text-white text-sm">
                {formatTime(currentVideoTime)} / {formatTime(duration)}
              </div>

              <div className="flex-1" />

              {/* Paramètres */}
              <Popover open={showSettings} onOpenChange={setShowSettings}>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-4">
                    {/* Vitesse de lecture */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Vitesse</label>
                      <Select
                        value={playbackRate.toString()}
                        onValueChange={value => handlePlaybackRateChange(parseFloat(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.25">0.25x</SelectItem>
                          <SelectItem value="0.5">0.5x</SelectItem>
                          <SelectItem value="0.75">0.75x</SelectItem>
                          <SelectItem value="1">1x (Normal)</SelectItem>
                          <SelectItem value="1.25">1.25x</SelectItem>
                          <SelectItem value="1.5">1.5x</SelectItem>
                          <SelectItem value="1.75">1.75x</SelectItem>
                          <SelectItem value="2">2x</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Qualité */}
                    {defaultQualities.length > 1 && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Qualité</label>
                        <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {defaultQualities.map(q => (
                              <SelectItem key={q.value} value={q.value}>
                                {q.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Sous-titres */}
                    {subtitles.length > 0 && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Sous-titres</label>
                        <Select value={selectedSubtitle} onValueChange={setSelectedSubtitle}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Désactivés</SelectItem>
                            {subtitles.map(sub => (
                              <SelectItem key={sub.lang} value={sub.lang}>
                                {sub.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {document.pictureInPictureEnabled && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handlePictureInPicture}
                  className="text-white hover:bg-white/20"
                >
                  <PictureInPicture className="h-4 w-4" />
                </Button>
              )}

              <Button
                size="icon"
                variant="ghost"
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Indicateur de chargement */}
          {networkState === 2 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white">Chargement...</div>
            </div>
          )}
        </div>
      </div>

      {/* Titre */}
      {title && (
        <div className="p-4 bg-gray-900 text-white">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-orange-500" />
            <h3 className="font-medium">{title}</h3>
          </div>
        </div>
      )}
    </Card>
  );
};






