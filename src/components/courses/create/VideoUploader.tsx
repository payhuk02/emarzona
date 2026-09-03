import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Youtube, Video, X, CheckCircle2, AlertCircle, Loader2, Cloud } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface VideoUploaderProps {
  onVideoUploaded: (videoData: {
    type: 'upload' | 'youtube' | 'vimeo' | 'google-drive';
    url: string;
    duration?: number;
    thumbnail?: string;
  }) => void;
  onCancel?: () => void;
  currentVideo?: {
    type: 'upload' | 'youtube' | 'vimeo' | 'google-drive';
    url: string;
  };
}

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export const VideoUploader = ({ onVideoUploaded, onCancel, currentVideo }: VideoUploaderProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadType, setUploadType] = useState<'upload' | 'youtube' | 'vimeo' | 'google-drive'>(
    currentVideo?.type || 'upload'
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState(
    currentVideo?.type === 'youtube' ? currentVideo.url : ''
  );
  const [vimeoUrl, setVimeoUrl] = useState(currentVideo?.type === 'vimeo' ? currentVideo.url : '');
  const [googleDriveUrl, setGoogleDriveUrl] = useState(
    currentVideo?.type === 'google-drive' ? currentVideo.url : ''
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(
    currentVideo?.type === 'upload' ? currentVideo.url : null
  );

  // Validation YouTube URL
  const validateYoutubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  // Validation Vimeo URL
  const validateVimeoUrl = (url: string): boolean => {
    const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
    return vimeoRegex.test(url);
  };

  // Validation Google Drive URL
  const validateGoogleDriveUrl = (url: string): boolean => {
    const googleDriveRegex = /^https:\/\/drive\.google\.com\/(file\/d\/|open\?id=).+/;
    return googleDriveRegex.test(url);
  };

  // Extraire l'ID Google Drive et convertir en URL embed
  const convertGoogleDriveUrl = (url: string): string => {
    // Format 1: https://drive.google.com/file/d/{FILE_ID}/view
    let match = url.match(/\/file\/d\/([^/]+)/);
    if (match) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }

    // Format 2: https://drive.google.com/open?id={FILE_ID}
    match = url.match(/[?&]id=([^&]+)/);
    if (match) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }

    return url;
  };

  // Extraire l'ID YouTube
  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Gérer la sélection de fichier
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Vérifier le type de fichier
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      setError('Format vidéo non supporté. Utilisez MP4, WebM, OGG ou MOV.');
      return;
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      setError(`Le fichier est trop volumineux. Maximum : ${MAX_FILE_SIZE / (1024 * 1024)} MB`);
      return;
    }

    setSelectedFile(file);
  };

  // Upload vers Supabase Storage
  const handleUploadToStorage = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Générer un nom de fichier unique
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `course-videos/${fileName}`;

      // Upload avec suivi de progression
      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: progress => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percent));
          },
        });

      if (uploadError) {
        throw uploadError;
      }

      // Récupérer l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from('videos').getPublicUrl(filePath);

      setUploadedUrl(publicUrl);

      // Obtenir la durée de la vidéo
      const duration = await getVideoDuration(selectedFile);

      toast({
        title: '✅ Vidéo uploadée !',
        description: 'Votre vidéo a été téléchargée avec succès.',
      });

      onVideoUploaded({
        type: 'upload',
        url: publicUrl,
        duration,
      });
    } catch (_error: any) {
      logger.error('Erreur upload', { error, fileName: selectedFile?.name });
      setError(error.message || "Erreur lors de l'upload de la vidéo");
      toast({
        title: "❌ Erreur d'upload",
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Obtenir la durée de la vidéo
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise(resolve => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      video.onerror = () => {
        resolve(0);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  // Gérer YouTube
  const handleYoutubeSubmit = () => {
    if (!validateYoutubeUrl(youtubeUrl)) {
      setError('URL YouTube invalide');
      return;
    }

    const videoId = extractYoutubeId(youtubeUrl);
    if (!videoId) {
      setError("Impossible d'extraire l'ID de la vidéo YouTube");
      return;
    }

    onVideoUploaded({
      type: 'youtube',
      url: youtubeUrl,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    });

    toast({
      title: '✅ Vidéo YouTube ajoutée',
      description: 'La vidéo YouTube a été liée avec succès.',
    });
  };

  // Gérer Vimeo
  const handleVimeoSubmit = () => {
    if (!validateVimeoUrl(vimeoUrl)) {
      setError('URL Vimeo invalide');
      return;
    }

    onVideoUploaded({
      type: 'vimeo',
      url: vimeoUrl,
    });

    toast({
      title: '✅ Vidéo Vimeo ajoutée',
      description: 'La vidéo Vimeo a été liée avec succès.',
    });
  };

  // Gérer Google Drive
  const handleGoogleDriveSubmit = () => {
    if (!validateGoogleDriveUrl(googleDriveUrl)) {
      setError('URL Google Drive invalide. Utilisez le lien de partage de la vidéo.');
      return;
    }

    const embedUrl = convertGoogleDriveUrl(googleDriveUrl);

    onVideoUploaded({
      type: 'google-drive',
      url: embedUrl,
    });

    toast({
      title: '✅ Vidéo Google Drive ajoutée',
      description: 'La vidéo Google Drive a été liée avec succès.',
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={uploadType} onValueChange={v => setUploadType(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="youtube" className="flex items-center gap-2">
            <Youtube className="w-4 h-4" />
            YouTube
          </TabsTrigger>
          <TabsTrigger value="vimeo" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Vimeo
          </TabsTrigger>
          <TabsTrigger value="google-drive" className="flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            Drive
          </TabsTrigger>
        </TabsList>

        {/* Upload direct */}
        <TabsContent value="upload" className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {!selectedFile && !uploadedUrl ? (
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">Cliquez pour sélectionner une vidéo</p>
                <p className="text-xs text-gray-500 mb-4">MP4, WebM, OGG ou MOV (max. 500 MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_VIDEO_TYPES.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Sélectionner une vidéo
                </Button>
              </div>
            ) : uploadedUrl ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Vidéo uploadée avec succès</span>
                </div>
                <video src={uploadedUrl} controls className="w-full max-h-64 rounded-lg" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadedUrl(null);
                    setSelectedFile(null);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Changer de vidéo
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                  </div>
                  <Badge variant="secondary">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </Badge>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Upload en cours...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleUploadToStorage}
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Upload en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Uploader
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedFile(null)}
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* YouTube */}
        <TabsContent value="youtube" className="space-y-4">
          <div className="space-y-2">
            <Label>URL de la vidéo YouTube</Label>
            <Input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={e => {
                setYoutubeUrl(e.target.value);
                setError(null);
              }}
            />
            <p className="text-xs text-gray-500">
              Exemple : https://www.youtube.com/watch?v=dQw4w9WgXcQ
            </p>
          </div>
          <Button
            type="button"
            onClick={handleYoutubeSubmit}
            disabled={!youtubeUrl}
            className="w-full"
          >
            <Youtube className="w-4 h-4 mr-2" />
            Ajouter la vidéo YouTube
          </Button>
        </TabsContent>

        {/* Vimeo */}
        <TabsContent value="vimeo" className="space-y-4">
          <div className="space-y-2">
            <Label>URL de la vidéo Vimeo</Label>
            <Input
              type="url"
              placeholder="https://vimeo.com/..."
              value={vimeoUrl}
              onChange={e => {
                setVimeoUrl(e.target.value);
                setError(null);
              }}
            />
            <p className="text-xs text-gray-500">Exemple : https://vimeo.com/123456789</p>
          </div>
          <Button type="button" onClick={handleVimeoSubmit} disabled={!vimeoUrl} className="w-full">
            <Video className="w-4 h-4 mr-2" />
            Ajouter la vidéo Vimeo
          </Button>
        </TabsContent>

        {/* Google Drive */}
        <TabsContent value="google-drive" className="space-y-4">
          <div className="space-y-2">
            <Label>Lien de partage Google Drive</Label>
            <Input
              type="url"
              placeholder="https://drive.google.com/file/d/..."
              value={googleDriveUrl}
              onChange={e => {
                setGoogleDriveUrl(e.target.value);
                setError(null);
              }}
            />
            <div className="text-xs text-gray-500 space-y-1">
              <p>📋 Comment obtenir le lien :</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Ouvrez votre vidéo sur Google Drive</li>
                <li>Cliquez sur "Partager" ou clic droit → "Obtenir le lien"</li>
                <li>Assurez-vous que "Toute personne disposant du lien" peut voir</li>
                <li>Copiez le lien et collez-le ici</li>
              </ol>
              <p className="mt-2">Exemple : https://drive.google.com/file/d/1abc.../view</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleGoogleDriveSubmit}
            disabled={!googleDriveUrl}
            className="w-full"
          >
            <Cloud className="w-4 h-4 mr-2" />
            Ajouter la vidéo Google Drive
          </Button>
        </TabsContent>
      </Tabs>

      {/* Erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Boutons d'action */}
      {onCancel && (
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      )}
    </div>
  );
};
