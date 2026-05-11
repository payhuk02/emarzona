import { useEffect, useRef, useCallback } from 'react';

export interface TouchGestureCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onDoubleTap?: () => void;
}

export interface MobileGestureOptions {
  swipeThreshold?: number;
  pinchThreshold?: number;
  doubleTapDelay?: number;
  enablePinch?: boolean;
  enableSwipe?: boolean;
  enableDoubleTap?: boolean;
}

export const useMobileGestures = (
  callbacks: TouchGestureCallbacks,
  options: MobileGestureOptions = {}
) => {
  const elementRef = useRef<HTMLElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const initialDistanceRef = useRef<number>(0);

  const {
    swipeThreshold = 50,
    pinchThreshold = 0.1,
    doubleTapDelay = 300,
    enablePinch = true,
    enableSwipe = true,
    enableDoubleTap = true,
  } = options;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    if (e.touches.length === 2 && enablePinch) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialDistanceRef.current = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
    }
  }, [enablePinch]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    if (e.touches.length === 2 && enablePinch && initialDistanceRef.current > 0) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      const scale = currentDistance / initialDistanceRef.current;
      if (Math.abs(scale - 1) > pinchThreshold) {
        callbacks.onPinch?.(scale);
      }
    }
  }, [enablePinch, pinchThreshold, callbacks]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Handle double tap
    if (enableDoubleTap && deltaTime < doubleTapDelay) {
      const now = Date.now();
      if (now - lastTapRef.current < doubleTapDelay) {
        callbacks.onDoubleTap?.();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    }

    // Handle swipe gestures
    if (enableSwipe && deltaTime < 500) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY && absX > swipeThreshold) {
        if (deltaX > 0) {
          callbacks.onSwipeRight?.();
        } else {
          callbacks.onSwipeLeft?.();
        }
      } else if (absY > absX && absY > swipeThreshold) {
        if (deltaY > 0) {
          callbacks.onSwipeDown?.();
        } else {
          callbacks.onSwipeUp?.();
        }
      }
    }

    touchStartRef.current = null;
    initialDistanceRef.current = 0;
  }, [swipeThreshold, doubleTapDelay, enableSwipe, enableDoubleTap, callbacks]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
};