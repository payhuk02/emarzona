import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  Settings,
  Clock,
  Shield,
  Users,
  File,
  Folder,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  Info,
  Calendar,
  Lock,
  Unlock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProductFilesTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  storeId: string;
}

interface FileItem {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
  downloadCount?: number;
  isProtected?: boolean;
  expiryDate?: Date;
  downloadLimit?: number;
}

export const ProductFilesTab = ({ formData, updateFormData, storeId }: ProductFilesTabProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `stores/${storeId}/products/${fileName}`;

    const { data, error } = await supabase.storage
      .from('product-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('product-files')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedFiles: FileItem[] = [];
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const url = await uploadFile(file);
        
        setUploadProgress(((i + 1) / fileArray.length) * 100);
        
        const fileItem: FileItem = {
          id: `${Date.now()}-${i}`,
          name: file.name,
          url,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
          downloadCount: 0,
          isProtected: false,
          downloadLimit: null,
          expiryDate: null
        };
        
        uploadedFiles.push(fileItem);
      }

      const currentFiles = formData.downloadable_files || [];
      updateFormData("downloadable_files", [...currentFiles, ...uploadedFiles]);

      toast({
        title: "Succès",
        description: `${fileArray.length} fichier(s) téléchargé(s) avec succès.`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erreur de téléchargement",
        description: error.message || "Une erreur est survenue lors du téléchargement.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index: number) => {
    const files = [...(formData.downloadable_files || [])];
    files.splice(index, 1);
    updateFormData("downloadable_files", files);
  };

  const updateFileSettings = (index: number, settings: Partial<FileItem>) => {
    const files = [...(formData.downloadable_files || [])];
    files[index] = { ...files[index], ...settings };
    updateFormData("downloadable_files", files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    if (type.includes('text')) return '📝';
    return '📁';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold">Fichiers et Téléchargements</h2>
        <p className="text-gray-600">Gérez les fichiers téléchargeables de votre produit</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration des fichiers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Zone de téléchargement */}
          <Card 
            className={cn(
              "border-2 border-dashed transition-colors",
              dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
            )}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFileSelect(e.dataTransfer.files);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
          >
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-gray-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Téléchargez vos fichiers</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        handleFileSelect(files);
                      };
                      input.click();
                    }}
                    disabled={uploading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Téléchargement..." : "Sélectionner des fichiers"}
                  </Button>
                </div>

                <div className="text-xs text-gray-500">
                  <p>Formats supportés: PDF, DOC, ZIP, images, vidéos, audio</p>
                  <p>Taille maximale: 100MB par fichier</p>
                </div>
              </div>

              {/* Barre de progression */}
              {uploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center mt-2">
                    Téléchargement en cours... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Liste des fichiers */}
          {(formData.downloadable_files || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Fichiers téléchargeables
                </CardTitle>
                <CardDescription>
                  {(formData.downloadable_files || []).length} fichier(s) configuré(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(formData.downloadable_files || []).map((file: FileItem, index: number) => (
                    <Card key={file.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl">{getFileIcon(file.type)}</div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium truncate">{file.name}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {formatFileSize(file.size)}
                              </Badge>
                              {file.isProtected && (
                                <Badge variant="destructive" className="text-xs">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Protégé
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <Label className="text-xs">Limite de téléchargements</Label>
                                <Input
                                  type="number"
                                  value={file.downloadLimit || ""}
                                  onChange={(e) => updateFileSettings(index, { 
                                    downloadLimit: e.target.value ? parseInt(e.target.value) : null 
                                  })}
                                  placeholder="Illimité"
                                  className="h-8"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs">Date d'expiration</Label>
                                <Input
                                  type="date"
                                  value={file.expiryDate ? file.expiryDate.toISOString().split('T')[0] : ""}
                                  onChange={(e) => updateFileSettings(index, { 
                                    expiryDate: e.target.value ? new Date(e.target.value) : null 
                                  })}
                                  className="h-8"
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-3">
                              <Switch
                                checked={file.isProtected || false}
                                onCheckedChange={(checked) => updateFileSettings(index, { isProtected: checked })}
                              />
                              <Label className="text-sm">Protéger ce fichier</Label>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Configuration générale */}
        <div className="space-y-6">
          {/* Paramètres d'accès */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres d'accès
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file_access_type">Type d'accès</Label>
                <Select 
                  value={formData.file_access_type || "immediate"} 
                  onValueChange={(value) => updateFormData("file_access_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immédiat</SelectItem>
                    <SelectItem value="email">Par email</SelectItem>
                    <SelectItem value="manual">Manuel</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Comment les clients accèdent aux fichiers
                </p>
              </div>

              <div>
                <Label htmlFor="download_limit">Limite globale de téléchargements</Label>
                <Input
                  id="download_limit"
                  type="number"
                  value={formData.download_limit || ""}
                  onChange={(e) => updateFormData("download_limit", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Illimité"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Limite par client (laisser vide pour illimité)
                </p>
              </div>

              <div>
                <Label htmlFor="download_expiry_days">Expiration (jours)</Label>
                <Input
                  id="download_expiry_days"
                  type="number"
                  value={formData.download_expiry_days || ""}
                  onChange={(e) => updateFormData("download_expiry_days", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Illimité"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nombre de jours avant expiration des liens
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fichiers configurés</span>
                  <Badge variant="secondary">
                    {(formData.downloadable_files || []).length}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fichiers protégés</span>
                  <Badge variant="secondary">
                    {(formData.downloadable_files || []).filter((f: FileItem) => f.isProtected).length}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taille totale</span>
                  <Badge variant="secondary">
                    {formatFileSize((formData.downloadable_files || []).reduce((total: number, file: FileItem) => total + file.size, 0))}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Type d'accès</span>
                  <Badge variant="secondary">
                    {formData.file_access_type === "immediate" ? "Immédiat" : 
                     formData.file_access_type === "email" ? "Email" : "Manuel"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Les fichiers sont automatiquement sécurisés</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Les téléchargements sont tracés</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Support des liens d'expiration</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Limite de 100MB par fichier</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};