import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsFetching } from '@tanstack/react-query';
import {
  getRouteChunkPendingCount,
  subscribeRouteChunkPending,
} from '@/lib/navigation-chunk-pending';

function useRouteChunkPending(): number {
  return useSyncExternalStore(subscribeRouteChunkPending, getRouteChunkPendingCount, () => 0);
}

/**
 * Barre de progression liée au changement de route + chunks Suspense.
 * Les fetches React Query prolongent légèrement la barre, sans la bloquer
 * (évite les requêtes de fond currency/realtime qui la laisseraient ouverte).
 */
export const LoadingBar = () => {
  const location = useLocation();
  const isFetching = useIsFetching();
  const chunkPending = useRouteChunkPending();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const navToken = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (tickTimer.current) {
      clearInterval(tickTimer.current);
      tickTimer.current = null;
    }
  };

  const finish = (token: number) => {
    if (navToken.current !== token) return;
    clearTimers();
    setProgress(100);
    hideTimer.current = setTimeout(() => {
      if (navToken.current !== token) return;
      setVisible(false);
      setProgress(0);
    }, 220);
  };

  // Nouvelle navigation → démarrer
  useEffect(() => {
    const token = ++navToken.current;
    clearTimers();
    setVisible(true);
    setProgress(15);

    tickTimer.current = setInterval(() => {
      if (navToken.current !== token) return;
      setProgress(p => {
        if (p >= 92) return p;
        return Math.min(92, p + 4 + Math.random() * 6);
      });
    }, 280);

    return () => {
      clearTimers();
    };
  }, [location.pathname, location.key]);

  // Terminer quand le chunk Suspense est prêt (+ courte grâce si fetch en cours)
  useEffect(() => {
    if (!visible) return;
    if (chunkPending > 0) return;

    const token = navToken.current;
    const settleMs = isFetching > 0 ? 280 : 80;
    const settle = setTimeout(() => finish(token), settleMs);
    return () => clearTimeout(settle);
  }, [visible, chunkPending, isFetching, location.key]);

  // Filet de sécurité
  useEffect(() => {
    if (!visible) return;
    const token = navToken.current;
    const maxWait = setTimeout(() => finish(token), 8000);
    return () => clearTimeout(maxWait);
  }, [visible, location.key]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-300 ease-out shadow-glow"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 0.2s ease-out' : 'width 0.3s ease-out',
        }}
      />
    </div>
  );
};
