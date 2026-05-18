/**
 * Comparateur avant / après avec curseur glissant.
 */

import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ImageCompareSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export const ImageCompareSlider: React.FC<ImageCompareSliderProps> = ({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Avant',
  afterLabel = 'Après',
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    updateFromClientX(e.clientX);
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>{beforeLabel}</span>
        <span>{afterLabel}</span>
      </div>
      <div
        ref={containerRef}
        className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted select-none touch-none cursor-ew-resize"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <img
          src={afterSrc}
          alt={afterLabel}
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img
            src={beforeSrc}
            alt={beforeLabel}
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />
        </div>
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md pointer-events-none"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground text-[10px] font-bold shadow-lg">
            ↔
          </div>
        </div>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Glissez le curseur pour comparer
      </p>
    </div>
  );
};

export default ImageCompareSlider;
