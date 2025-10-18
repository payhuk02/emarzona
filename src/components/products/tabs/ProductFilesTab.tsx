import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText } from "lucide-react";

interface ProductFilesTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  storeId: string;
}

export const ProductFilesTab = ({ formData, updateFormData, storeId }: ProductFilesTabProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${storeId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      const currentFiles = formData.downloadable_files || [];
      updateFormData("downloadable_files", [
        ...currentFiles,
        {
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type,
        },
      ]);

      toast({
        title: "Succès",
        description: "Fichier téléchargé avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    const currentFiles = [...(formData.downloadable_files || [])];
    currentFiles.splice(index, 1);
    updateFormData("downloadable_files", currentFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Fichiers téléchargeables</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Ajoutez les fichiers que vos clients recevront après l'achat (PDF, ZIP, vidéos, etc.)
        </p>

        {formData.downloadable_files?.length > 0 && (
          <div className="space-y-2 mb-4">
            {formData.downloadable_files.map((file: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <Label
            htmlFor="file-upload"
            className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Téléchargement..." : "Ajouter un fichier"}
          </Label>
        </div>
      </div>

      <div>
        <Label htmlFor="digital_file_url">Ou ajouter une URL de fichier</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Si vos fichiers sont hébergés ailleurs
        </p>
        <Input
          id="digital_file_url"
          value={formData.digital_file_url || ""}
          onChange={(e) => updateFormData("digital_file_url", e.target.value)}
          placeholder="https://exemple.com/mon-fichier.pdf"
        />
      </div>
    </div>
  );
};
