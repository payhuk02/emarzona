/**
 * FileVersionForm - Formulaire de création de version
 * Date: 2025-01-27
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useFileVersions,
  useCreateFileVersion,
} from '@/hooks/digital/useAdvancedFileManagement';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';

interface FileVersionFormProps {
  fileId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const FileVersionForm = ({ fileId, onSuccess, onCancel }: FileVersionFormProps) => {
  const { toast } = useToast();
  const { data: existingVersions } = useFileVersions(fileId);
  const createVersion = useCreateFileVersion();

  const [formData, setFormData] = useState({
    version_number: 1,
    version_label: '',
    file_url: '',
    file_size_mb: 0,
    file_hash: '',
    checksum_sha256: '',
    changelog: '',
    release_notes: '',
    is_stable: true,
    is_beta: false,
    is_alpha: false,
  });

  useEffect(() => {
    // Calculer le prochain numéro de version
    if (existingVersions && existingVersions.length > 0) {
      const maxVersion = Math.max(...existingVersions.map(v => v.version_number));
      setFormData(prev => ({
        ...prev,
        version_number: maxVersion + 1,
      }));
    }
  }, [existingVersions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.version_label || !formData.file_url || formData.file_size_mb <= 0) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createVersion.mutateAsync({
        file_id: fileId,
        ...formData,
      });
      onSuccess();
    } catch (error: any) {
      // L'erreur est déjà gérée par le hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="version_number">Numéro de version *</Label>
          <Input
            id="version_number"
            type="number"
            min="1"
            value={formData.version_number}
            onChange={(e) =>
              setFormData({ ...formData, version_number: parseInt(e.target.value) || 1 })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="version_label">Label de version *</Label>
          <Input
            id="version_label"
            value={formData.version_label}
            onChange={(e) => setFormData({ ...formData, version_label: e.target.value })}
            placeholder="Ex: 1.0.0, beta, rc1"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file_url">URL du fichier *</Label>
        <Input
          id="file_url"
          type="url"
          value={formData.file_url}
          onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
          placeholder="https://..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="file_size_mb">Taille (MB) *</Label>
          <Input
            id="file_size_mb"
            type="number"
            step="0.01"
            min="0"
            value={formData.file_size_mb}
            onChange={(e) =>
              setFormData({ ...formData, file_size_mb: parseFloat(e.target.value) || 0 })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checksum_sha256">Checksum SHA-256</Label>
          <Input
            id="checksum_sha256"
            value={formData.checksum_sha256}
            onChange={(e) => setFormData({ ...formData, checksum_sha256: e.target.value })}
            placeholder="Optionnel"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="changelog">Changelog</Label>
        <Textarea
          id="changelog"
          value={formData.changelog}
          onChange={(e) => setFormData({ ...formData, changelog: e.target.value })}
          placeholder="Liste des changements..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="release_notes">Notes de version</Label>
        <Textarea
          id="release_notes"
          value={formData.release_notes}
          onChange={(e) => setFormData({ ...formData, release_notes: e.target.value })}
          placeholder="Notes détaillées pour les utilisateurs..."
          rows={4}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Version stable</Label>
            <div className="text-sm text-muted-foreground">
              Version recommandée pour la production
            </div>
          </div>
          <Switch
            checked={formData.is_stable}
            onCheckedChange={(checked) => {
              setFormData({ ...formData, is_stable: checked, is_beta: false, is_alpha: false });
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Version beta</Label>
            <div className="text-sm text-muted-foreground">
              Version en test, peut contenir des bugs
            </div>
          </div>
          <Switch
            checked={formData.is_beta}
            onCheckedChange={(checked) => {
              setFormData({ ...formData, is_beta: checked, is_stable: !checked });
            }}
            disabled={formData.is_stable}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Version alpha</Label>
            <div className="text-sm text-muted-foreground">
              Version de développement, instable
            </div>
          </div>
          <Switch
            checked={formData.is_alpha}
            onCheckedChange={(checked) => {
              setFormData({ ...formData, is_alpha: checked, is_stable: !checked });
            }}
            disabled={formData.is_stable}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={createVersion.isPending}>
          {createVersion.isPending && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          Créer la version
        </Button>
      </div>
    </form>
  );
};

