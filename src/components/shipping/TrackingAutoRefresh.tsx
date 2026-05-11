/**
 * Composant pour le Tracking Automatique Périodique
 * Date: 31 Janvier 2025
 * 
 * Active le tracking automatique périodique pour tous les shipments
 */

import { useAutomaticTracking } from '@/hooks/shipping/useAutomaticTracking';
import { useEffect } from 'react';

interface TrackingAutoRefreshProps {
  enabled?: boolean;
  intervalMs?: number;
}

/**
 * Composant qui active le tracking automatique périodique
 * À utiliser dans les pages de gestion des shipments
 */
export function TrackingAutoRefresh({ 
  enabled = true, 
  intervalMs = 5 * 60 * 1000 // 5 minutes par défaut
}: TrackingAutoRefreshProps) {
  useAutomaticTracking(enabled ? intervalMs : 0);

  return null; // Composant invisible
}







