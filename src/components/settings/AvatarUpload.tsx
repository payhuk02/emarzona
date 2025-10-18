import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Upload, X, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  value: string | null;
  onUpload: (file: File) => Promise<string | null>;
  onRemove: () => Promise<boolean>;
  disabled?: boolean;
  displayName?: string | null;
}

export const AvatarUpload = ({
  value,
  onUpload,
  onRemove,
  disabled,
  displayName,
}: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image valide",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 5 Mo",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await onRemove();
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
      <div className="relative group">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-2 ring-border transition-all duration-300 group-hover:ring-primary">
          {value ? (
            <AvatarImage src={value} alt="Avatar" className="object-cover" />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-xl sm:text-2xl font-semibold text-primary">
              {getInitials(displayName)}
            </AvatarFallback>
          )}
        </Avatar>
        {value && !disabled && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full sm:w-auto">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full sm:w-auto"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Téléchargement...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {value ? "Changer la photo" : "Télécharger une photo"}
            </>
          )}
        </Button>
        
        <p className="text-xs sm:text-sm text-muted-foreground">
          JPG, PNG ou GIF (max. 5 Mo)
        </p>
      </div>
    </div>
  );
};
