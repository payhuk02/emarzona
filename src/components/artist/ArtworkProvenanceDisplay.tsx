/**
 * Composant d'affichage de la provenance d'une œuvre
 * Date: 1 Février 2025
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timeline, TimelineItem, TimelineContent, TimelineSeparator, TimelineConnector, TimelineDot } from '@/components/ui/timeline';
import { Calendar, MapPin, User, CheckCircle2, FileText, Award } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ArtworkProvenance } from '@/hooks/artist/useArtworkProvenance';

interface ArtworkProvenanceDisplayProps {
  provenanceHistory: ArtworkProvenance[];
  className?: string;
}

const  provenanceTypeLabels: Record<string, string> = {
  creation: 'Création',
  ownership: 'Propriété',
  exhibition: 'Exposition',
  publication: 'Publication',
  restoration: 'Restauration',
  authentication: 'Authentification',
  certification: 'Certification',
  other: 'Autre',
};

const  provenanceTypeColors: Record<string, string> = {
  creation: 'bg-blue-500',
  ownership: 'bg-green-500',
  exhibition: 'bg-purple-500',
  publication: 'bg-orange-500',
  restoration: 'bg-yellow-500',
  authentication: 'bg-red-500',
  certification: 'bg-indigo-500',
  other: 'bg-gray-500',
};

export const ArtworkProvenanceDisplay = ({
  provenanceHistory,
  className,
}: ArtworkProvenanceDisplayProps) => {
  if (!provenanceHistory || provenanceHistory.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Provenance</CardTitle>
          <CardDescription>Historique de provenance de l'œuvre</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Aucun historique de provenance disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Provenance
        </CardTitle>
        <CardDescription>
          Historique complet de provenance de l'œuvre
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Timeline>
          {provenanceHistory.map((item, index) => (
            <TimelineItem key={item.id}>
              <TimelineSeparator>
                <TimelineDot className={provenanceTypeColors[item.provenance_type] || 'bg-gray-500'}>
                  {item.is_verified && <CheckCircle2 className="h-3 w-3 text-white" />}
                </TimelineDot>
                {index < provenanceHistory.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {provenanceTypeLabels[item.provenance_type] || item.provenance_type}
                    </Badge>
                    {item.is_verified && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Vérifié
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(item.event_date), 'PP', { locale: fr })}
                  </div>

                  {item.location_city || item.location_country ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {[item.location_city, item.location_country].filter(Boolean).join(', ')}
                    </div>
                  ) : null}

                  {(item.previous_owner_name || item.current_owner_name) && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {item.previous_owner_name && (
                        <span className="text-muted-foreground">
                          De: {item.previous_owner_name}
                        </span>
                      )}
                      {item.previous_owner_name && item.current_owner_name && (
                        <span className="mx-2">→</span>
                      )}
                      {item.current_owner_name && (
                        <span>À: {item.current_owner_name}</span>
                      )}
                    </div>
                  )}

                  {item.description && (
                    <p className="text-sm mt-2">{item.description}</p>
                  )}

                  {item.documents && item.documents.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.documents.map((doc, docIndex) => (
                        <Badge key={docIndex} variant="secondary" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          {doc.type}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {item.blockchain_hash && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono break-all">
                      <div className="font-semibold mb-1">Blockchain:</div>
                      <div>Hash: {item.blockchain_hash}</div>
                      {item.blockchain_tx_id && (
                        <div>TX: {item.blockchain_tx_id}</div>
                      )}
                      {item.blockchain_network && (
                        <div>Réseau: {item.blockchain_network}</div>
                      )}
                    </div>
                  )}
                </div>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
};







