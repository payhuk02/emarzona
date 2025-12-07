/**
 * Digital File Preview Component
 * Date: 27 Janvier 2025
 * 
 * Composant pour prévisualiser les fichiers digitaux (images, vidéos, audio)
 * avant achat - Améliore l'UX et la confiance des clients
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Eye,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Lock,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DigitalFilePreviewProps {
  file: {
    id: string;
    name: string;
    file_url: string;
    file_type: string;
    file_size_mb: number;
    is_preview?: boolean;
    is_main?: boolean;
  };
  isLocked?: boolean;
  previewUrl?: string;
  className?: string;
}

/**
 * Format file size
 */
const formatSize = (mb: number): string => {
  if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
};

/**
 * Get file type category
 */
const getFileCategory = (fileType: string): 'image' | 'video' | 'audio' | 'document' | 'other' => {
  const type = fileType.toLowerCase();
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 'document';
  return 'other';
};

/**
 * Digital File Preview Component
 */
export const DigitalFilePreview = ({
  file,
  isLocked = false,
  previewUrl,
  className,
}: DigitalFilePreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const category = getFileCategory(file.file_type);
  const displayUrl = previewUrl || file.file_url;

  const handlePreview = () => {
    if (isLocked) return;
    setIsOpen(true);
    setIsLoading(true);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setVideoError(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setVideoError(true);
  };

  const toggleAudio = () => {
    setAudioPlaying(!audioPlaying);
  };

  // Preview content based on file type
  const renderPreviewContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    switch (category) {
      case 'image':
        if (imageError) {
          return (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <ImageIcon className="h-16 w-16 mb-4" />
              <p>Impossible de charger l'aperçu</p>
            </div>
          );
        }
        return (
          <div className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-muted">
            <img
              src={displayUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        );

      case 'video':
        if (videoError) {
          return (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <Video className="h-16 w-16 mb-4" />
              <p>Impossible de charger l'aperçu vidéo</p>
            </div>
          );
        }
        return (
          <div className="relative w-full">
            <video
              src={displayUrl}
              controls
              className="w-full max-h-[600px]"
              onLoadedData={handleVideoLoad}
              onError={handleVideoError}
            >
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-96 p-8">
            <div className="w-full max-w-md space-y-4">
              <div className="flex items-center justify-center mb-8">
                <div className="rounded-full bg-primary/10 p-8">
                  <Music className="h-16 w-16 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold">{file.name}</h3>
                <p className="text-sm text-muted-foreground">{formatSize(file.file_size_mb)}</p>
              </div>
              <div className="flex items-center gap-4 justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleAudio}
                  className="rounded-full"
                >
                  {audioPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
              </div>
              {audioPlaying && (
                <audio
                  src={displayUrl}
                  autoPlay
                  onEnded={() => setAudioPlaying(false)}
                  onTimeUpdate={(e) => {
                    const audio = e.currentTarget;
                    setAudioProgress((audio.currentTime / audio.duration) * 100);
                  }}
                />
              )}
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
            <FileText className="h-16 w-16 mb-4" />
            <p className="text-center">Aperçu non disponible pour ce type de document</p>
            <p className="text-sm mt-2">Téléchargez le fichier pour le consulter</p>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
            <FileText className="h-16 w-16 mb-4" />
            <p className="text-center">Aperçu non disponible</p>
            <p className="text-sm mt-2">Téléchargez le fichier pour le consulter</p>
          </div>
        );
    }
  };

  // Icon based on file category
  const getFileIcon = () => {
    switch (category) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'audio':
        return <Music className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <>
      <Card className={cn("group hover:shadow-md transition-shadow", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Preview thumbnail/icon */}
            <div className="relative flex-shrink-0">
              {category === 'image' && !isLocked ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={displayUrl}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  {isLocked ? (
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    getFileIcon()
                  )}
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{file.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {formatSize(file.file_size_mb)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {file.file_type}
                    </Badge>
                    {file.is_main && (
                      <Badge variant="default" className="text-xs">
                        Principal
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview button */}
            {!isLocked && (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreview}
                    className="flex-shrink-0"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {getFileIcon()}
                      <span className="truncate">{file.name}</span>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    {renderPreviewContent()}
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {isLocked && (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="flex-shrink-0"
              >
                <Lock className="h-4 w-4 mr-2" />
                Verrouillé
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

/**
 * Compact preview for file lists
 */
export const DigitalFilePreviewCompact = ({
  file,
  isLocked = false,
  previewUrl,
}: Omit<DigitalFilePreviewProps, 'className'>) => {
  const [isOpen, setIsOpen] = useState(false);
  const category = getFileCategory(file.file_type);
  const displayUrl = previewUrl || file.file_url;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLocked}
          className="h-8 w-8 p-0"
          aria-label={isLocked ? `Fichier ${file.name} verrouillé` : `Aperçu du fichier ${file.name}`}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{file.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {category === 'image' && (
            <img
              src={displayUrl}
              alt={file.name}
              className="max-w-full h-auto"
            />
          )}
          {category === 'video' && (
            <video src={displayUrl} controls className="w-full max-h-[600px]" />
          )}
          {category === 'audio' && (
            <div className="flex flex-col items-center justify-center h-64">
              <Music className="h-16 w-16 mb-4 text-muted-foreground" />
              <audio src={displayUrl} controls className="w-full" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

