/**
 * Composant Bouton pour Tracking Automatique
 * Date: 31 Janvier 2025
 */

import { Button } from '@/components/ui/button';
import { useTrackShipment, useTrackPendingShipments } from '@/hooks/shipping/useAutomaticTracking';
import { RefreshCw, Loader2, Package } from 'lucide-react';

interface AutomaticTrackingButtonProps {
  shipmentId?: string | null;
  variant?: 'single' | 'batch';
  className?: string;
}

export function AutomaticTrackingButton({
  shipmentId,
  variant = 'single',
  className,
}: AutomaticTrackingButtonProps) {
  const trackSingle = useTrackShipment(shipmentId || null);
  const trackBatch = useTrackPendingShipments();

  if (variant === 'batch') {
    return (
      <Button
        onClick={() => trackBatch.mutate()}
        disabled={trackBatch.isPending}
        variant="outline"
        className={className}
      >
        {trackBatch.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Mise à jour en cours...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Mettre à jour tous les colis
          </>
        )}
      </Button>
    );
  }

  if (!shipmentId) {
    return null;
  }

  return (
    <Button
      onClick={() => trackSingle.mutate()}
      disabled={trackSingle.isPending}
      variant="outline"
      size="sm"
      className={className}
    >
      {trackSingle.isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Mise à jour...
        </>
      ) : (
        <>
          <Package className="h-4 w-4 mr-2" />
          Mettre à jour le tracking
        </>
      )}
    </Button>
  );
}

