/**
 * Video Player with Notes Panel Component
 * Intégration complète du lecteur vidéo avec panneau de notes synchronisé
 */

import { useState, useCallback } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { NotesPanel } from '@/components/courses/notes';

interface VideoPlayerWithNotesProps {
  videoType: 'upload' | 'youtube' | 'vimeo' | 'google-drive';
  videoUrl: string;
  title?: string;
  productId?: string;
  enrollmentId?: string;
  lessonId?: string;
  courseId?: string;
  isEnrolled: boolean;
}

export const VideoPlayerWithNotes = ({
  videoType,
  videoUrl,
  title,
  productId,
  enrollmentId,
  lessonId,
  courseId,
  isEnrolled,
}: VideoPlayerWithNotesProps) => {
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [seekToTime, setSeekToTime] = useState<number | undefined>(undefined);

  // Callback pour mettre à jour le temps actuel depuis VideoPlayer
  const handleTimeUpdate = useCallback((currentTime: number) => {
    setCurrentTimeSeconds(Math.floor(currentTime));
  }, []);

  // Callback pour naviguer vers un timestamp depuis NotesPanel
  const handleTimestampClick = useCallback((seconds: number) => {
    setSeekToTime(seconds);
    // Reset après utilisation
    setTimeout(() => setSeekToTime(undefined), 100);
  }, []);

  // Reset seekToTime après utilisation
  const handleSeekComplete = useCallback(() => {
    setSeekToTime(undefined);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video Player - 2/3 width */}
        <div className="lg:col-span-2">
          <VideoPlayer
            videoType={videoType}
            videoUrl={videoUrl}
            title={title}
            productId={productId}
            enrollmentId={enrollmentId}
            lessonId={lessonId}
            onTimeUpdate={handleTimeUpdate}
            currentTime={seekToTime}
          />
        </div>
        
        {/* Notes Panel - 1/3 width (si inscrit) */}
        {isEnrolled && enrollmentId && (
          <div className="lg:col-span-1">
            <NotesPanel
              enrollmentId={enrollmentId}
              lessonId={lessonId || ''}
              courseId={courseId || ''}
              currentTimeSeconds={currentTimeSeconds}
              onTimestampClick={handleTimestampClick}
              className="h-full max-h-[600px]"
            />
          </div>
        )}
      </div>
    </div>
  );
};

