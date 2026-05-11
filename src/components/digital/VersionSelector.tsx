/**
 * Version Selector Component
 * Date: 1 Février 2025
 * 
 * Sélecteur de version pour télécharger une version spécifique
 */

import { useState } from 'react';
import { useDigitalProductVersionHistory, useCurrentDigitalProductVersion } from '@/hooks/digital/useDigitalProductVersions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VersionSelectorProps {
  productId: string;
  onVersionDownload?: (versionId: string, versionNumber: string) => void;
  className?: string;
}

export const VersionSelector = ({
  productId,
  onVersionDownload,
  className,
}: VersionSelectorProps) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const { data: currentVersion } = useCurrentDigitalProductVersion(productId);
  const { data: versionHistory = [] } = useDigitalProductVersionHistory(productId, 50);

  // Trier les versions (courante en premier, puis par numéro de version décroissant)
  const sortedVersions = [...(versionHistory || [])].sort((a, b) => {
    if (a.is_current) return -1;
    if (b.is_current) return 1;
    if (a.major_version !== b.major_version) return b.major_version - a.major_version;
    if (a.minor_version !== b.minor_version) return b.minor_version - a.minor_version;
    return b.patch_version - a.patch_version;
  });

  const handleDownload = () => {
    if (selectedVersionId && onVersionDownload) {
      const version = sortedVersions.find((v) => v.id === selectedVersionId);
      if (version) {
        onVersionDownload(version.id, version.version_number);
      }
    }
  };

  if (sortedVersions.length === 0) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Aucune version disponible pour ce produit.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Sélectionner une version" />
          </SelectTrigger>
          <SelectContent>
            {sortedVersions.map((version) => (
              <SelectItem key={version.id} value={version.id}>
                <div className="flex items-center gap-2">
                  <span>Version {version.version_number}</span>
                  {version.is_current && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Actuelle
                    </Badge>
                  )}
                  {version.is_beta && <Badge variant="secondary">Beta</Badge>}
                  {version.is_deprecated && (
                    <Badge variant="destructive">Dépréciée</Badge>
                  )}
                  {version.version_name && (
                    <span className="text-muted-foreground text-xs">
                      - {version.version_name}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleDownload}
          disabled={!selectedVersionId}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Télécharger
        </Button>
      </div>

      {/* Version courante recommandée */}
      {currentVersion && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Version courante recommandée :{' '}
            <strong>Version {currentVersion.version_number}</strong>
            {currentVersion.version_name && ` - ${currentVersion.version_name}`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};







