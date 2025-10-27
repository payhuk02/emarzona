/**
 * Lecteur vidéo universel pour les cours
 * Support : Upload (Supabase), YouTube, Vimeo, Google Drive
 * Date : 27 octobre 2025
 * Mis à jour : Phase 5 - Sauvegarde automatique de position
 */

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Play } from 'lucide-react';
import { useUpdateVideoPosition, useLessonProgress } from '@/hooks/courses/useCourseProgress';

interface VideoPlayerProps {
  videoType: 'upload' | 'youtube' | 'vimeo' | 'google-drive';
  videoUrl: string;
  title?: string;
  enrollmentId?: string;
  lessonId?: string;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export const VideoPlayer = ({ 
  videoType, 
  videoUrl, 
  title,
  enrollmentId,
  lessonId,
  onEnded,
  onTimeUpdate 
}: VideoPlayerProps) => {
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  
  // Hooks pour la progression
  const { data: progress } = useLessonProgress(enrollmentId, lessonId);
  const updatePosition = useUpdateVideoPosition();

  // Restaurer la position sauvegardée au chargement
  useEffect(() => {
    if (videoRef.current && progress?.last_position_seconds && videoType === 'upload') {
      // Restaurer uniquement si ce n'est pas la première lecture
      if (progress.last_position_seconds > 5) {
        videoRef.current.currentTime = progress.last_position_seconds;
      }
    }
  }, [progress, videoType]);

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

        // Réinitialiser le chronomètre
        startTimeRef.current = Date.now();
      }
    }, 10000); // Toutes les 10 secondes

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [enrollmentId, lessonId, videoType, updatePosition]);

  // Extraire l'ID YouTube
  const getYoutubeEmbedUrl = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    
    if (!videoId) {
      setError('URL YouTube invalide');
      return '';
    }
    
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  };

  // Extraire l'ID Vimeo
  const getVimeoEmbedUrl = (url: string): string => {
    const regExp = /vimeo\.com\/(\d+)/;
    const match = url.match(regExp);
    const videoId = match ? match[1] : null;
    
    if (!videoId) {
      setError('URL Vimeo invalide');
      return '';
    }
    
    return `https://player.vimeo.com/video/${videoId}`;
  };

  // Gérer les événements vidéo HTML5
  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (onTimeUpdate) {
      onTimeUpdate(e.currentTarget.currentTime);
    }
  };

  const handleVideoEnded = () => {
    // Sauvegarder une dernière fois avant de terminer
    if (enrollmentId && lessonId && videoRef.current) {
      const watchTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      updatePosition.mutate({
        enrollmentId,
        lessonId,
        position: Math.floor(videoRef.current.duration),
        watchTime,
      });
    }

    if (onEnded) {
      onEnded();
    }
  };

  return (
    <Card className="overflow-hidden bg-black">
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}> {/* Ratio 16:9 */}
        <div className="absolute inset-0">
          {error ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Upload direct (Supabase Storage) */}
              {videoType === 'upload' && (
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  controlsList="nodownload"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={handleVideoEnded}
                  poster="/placeholder-video.jpg"
                >
                  <source src={videoUrl} type="video/mp4" />
                  <source src={videoUrl} type="video/webm" />
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
              )}

              {/* YouTube */}
              {videoType === 'youtube' && (
                <iframe
                  className="w-full h-full"
                  src={getYoutubeEmbedUrl(videoUrl)}
                  title={title || 'Vidéo YouTube'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}

              {/* Vimeo */}
              {videoType === 'vimeo' && (
                <iframe
                  className="w-full h-full"
                  src={getVimeoEmbedUrl(videoUrl)}
                  title={title || 'Vidéo Vimeo'}
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              )}

              {/* Google Drive */}
              {videoType === 'google-drive' && (
                <iframe
                  className="w-full h-full"
                  src={videoUrl}
                  title={title || 'Vidéo Google Drive'}
                  frameBorder="0"
                  allow="autoplay"
                  allowFullScreen
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Info vidéo */}
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

