/**
 * FileMetadataEditor - Éditeur de métadonnées de fichiers
 * Date: 2025-01-27
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useFileMetadata,
  useUpdateFileMetadata,
  FileMetadata,
} from '@/hooks/digital/useAdvancedFileManagement';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Image, Video, Music, Code, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileMetadataEditorProps {
  fileId: string;
  fileType: string;
  fileName: string;
}

export const FileMetadataEditor = ({ fileId, fileType, fileName }: FileMetadataEditorProps) => {
  const { data: metadata, isLoading, error } = useFileMetadata(fileId);
  const updateMetadata = useUpdateFileMetadata();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<FileMetadata>>({});

  useEffect(() => {
    if (metadata) {
      setFormData(metadata);
    } else {
      // Initialiser avec des valeurs par défaut
      setFormData({});
    }
  }, [metadata]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMetadata.mutateAsync({
        fileId,
        data: formData,
      });
    } catch (error: any) {
      // L'erreur est déjà gérée par le hook
    }
  };

  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');
  const isAudio = fileType.startsWith('audio/');
  const isDocument = fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text');
  const isSoftware = fileType.includes('application') || fileType.includes('executable');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement des métadonnées. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Métadonnées - {fileName}
        </CardTitle>
        <CardDescription>
          Modifiez les métadonnées techniques du fichier
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Général</TabsTrigger>
              {isImage && <TabsTrigger value="image">Image</TabsTrigger>}
              {isVideo && <TabsTrigger value="video">Vidéo</TabsTrigger>}
              {isAudio && <TabsTrigger value="audio">Audio</TabsTrigger>}
              {isDocument && <TabsTrigger value="document">Document</TabsTrigger>}
              {isSoftware && <TabsTrigger value="software">Logiciel</TabsTrigger>}
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Input
                    id="language"
                    value={formData.language || ''}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    placeholder="fr, en, es..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codec">Codec</Label>
                  <Input
                    id="codec"
                    value={formData.codec || ''}
                    onChange={(e) => setFormData({ ...formData, codec: e.target.value })}
                    placeholder="H.264, MP3, PNG..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Auteur</Label>
                  <Input
                    id="author"
                    value={formData.author || ''}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Éditeur</Label>
                  <Input
                    id="publisher"
                    value={formData.publisher || ''}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="copyright">Copyright</Label>
                <Input
                  id="copyright"
                  value={formData.copyright || ''}
                  onChange={(e) => setFormData({ ...formData, copyright: e.target.value })}
                  placeholder="© 2025..."
                />
              </div>
            </TabsContent>

            {isImage && (
              <TabsContent value="image" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Largeur (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      min="0"
                      value={formData.width || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, width: parseInt(e.target.value) || undefined })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Hauteur (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="0"
                      value={formData.height || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, height: parseInt(e.target.value) || undefined })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format_version">Version du format</Label>
                  <Input
                    id="format_version"
                    value={formData.format_version || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, format_version: e.target.value })
                    }
                    placeholder="PNG 1.2, JPEG 2000..."
                  />
                </div>
              </TabsContent>
            )}

            {isVideo && (
              <TabsContent value="video" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Largeur (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      min="0"
                      value={formData.width || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, width: parseInt(e.target.value) || undefined })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Hauteur (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="0"
                      value={formData.height || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, height: parseInt(e.target.value) || undefined })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration_seconds">Durée (secondes)</Label>
                    <Input
                      id="duration_seconds"
                      type="number"
                      min="0"
                      value={formData.duration_seconds || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_seconds: parseInt(e.target.value) || undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bitrate">Bitrate (kbps)</Label>
                    <Input
                      id="bitrate"
                      type="number"
                      min="0"
                      value={formData.bitrate || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, bitrate: parseInt(e.target.value) || undefined })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codec">Codec vidéo</Label>
                  <Input
                    id="codec"
                    value={formData.codec || ''}
                    onChange={(e) => setFormData({ ...formData, codec: e.target.value })}
                    placeholder="H.264, H.265, VP9..."
                  />
                </div>
              </TabsContent>
            )}

            {isAudio && (
              <TabsContent value="audio" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration_seconds">Durée (secondes)</Label>
                    <Input
                      id="duration_seconds"
                      type="number"
                      min="0"
                      value={formData.duration_seconds || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_seconds: parseInt(e.target.value) || undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bitrate">Bitrate (kbps)</Label>
                    <Input
                      id="bitrate"
                      type="number"
                      min="0"
                      value={formData.bitrate || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, bitrate: parseInt(e.target.value) || undefined })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sample_rate">Sample Rate (Hz)</Label>
                    <Input
                      id="sample_rate"
                      type="number"
                      min="0"
                      value={formData.sample_rate || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sample_rate: parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="44100, 48000..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="channels">Canaux</Label>
                    <Select
                      value={formData.channels?.toString() || ''}
                      onValueChange={(value) =>
                        setFormData({ ...formData, channels: parseInt(value) || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Mono (1)</SelectItem>
                        <SelectItem value="2">Stéréo (2)</SelectItem>
                        <SelectItem value="5.1">5.1 Surround</SelectItem>
                        <SelectItem value="7.1">7.1 Surround</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codec">Codec audio</Label>
                  <Input
                    id="codec"
                    value={formData.codec || ''}
                    onChange={(e) => setFormData({ ...formData, codec: e.target.value })}
                    placeholder="MP3, AAC, FLAC, WAV..."
                  />
                </div>
              </TabsContent>
            )}

            {isDocument && (
              <TabsContent value="document" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="page_count">Nombre de pages</Label>
                    <Input
                      id="page_count"
                      type="number"
                      min="0"
                      value={formData.page_count || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          page_count: parseInt(e.target.value) || undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="word_count">Nombre de mots</Label>
                    <Input
                      id="word_count"
                      type="number"
                      min="0"
                      value={formData.word_count || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          word_count: parseInt(e.target.value) || undefined,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format_version">Version du format</Label>
                  <Input
                    id="format_version"
                    value={formData.format_version || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, format_version: e.target.value })
                    }
                    placeholder="PDF 1.7, DOCX..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={formData.isbn || ''}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="978-0-123456-78-9"
                  />
                </div>
              </TabsContent>
            )}

            {isSoftware && (
              <TabsContent value="software" className="space-y-4">
                <div className="space-y-2">
                  <Label>Plateformes supportées</Label>
                  <div className="flex flex-wrap gap-2">
                    {['windows', 'mac', 'linux', 'android', 'ios'].map((platform) => (
                      <Button
                        key={platform}
                        type="button"
                        variant={
                          formData.platform?.includes(platform) ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => {
                          const current = formData.platform || [];
                          setFormData({
                            ...formData,
                            platform: current.includes(platform)
                              ? current.filter((p) => p !== platform)
                              : [...current, platform],
                          });
                        }}
                      >
                        {platform}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Architectures supportées</Label>
                  <div className="flex flex-wrap gap-2">
                    {['x86', 'x64', 'arm', 'arm64'].map((arch) => (
                      <Button
                        key={arch}
                        type="button"
                        variant={
                          formData.architecture?.includes(arch) ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => {
                          const current = formData.architecture || [];
                          setFormData({
                            ...formData,
                            architecture: current.includes(arch)
                              ? current.filter((a) => a !== arch)
                              : [...current, arch],
                          });
                        }}
                      >
                        {arch}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={updateMetadata.isPending}>
              {updateMetadata.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les métadonnées
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

