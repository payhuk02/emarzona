/**
 * BottomSheet - Composant mobile-first pour modales
 * Remplace les dialogs classiques sur mobile avec une expérience native
 */

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from '@/components/icons';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const DialogPortal = DialogPrimitive.Portal;

interface BottomSheetProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /**
   * Titre du bottom sheet
   */
  title?: string;
  /**
   * Description optionnelle
   */
  description?: string;
  /**
   * Afficher le bouton de fermeture
   */
  showClose?: boolean;
  /**
   * Permettre la fermeture par swipe down (mobile uniquement)
   */
  swipeToClose?: boolean;
  /**
   * Callback de changement d'état
   */
  onOpenChange?: (open: boolean) => void;
}

const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[1040] bg-black/60 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "duration-200",
      className,
    )}
    {...props}
  />
));
BottomSheetOverlay.displayName = "BottomSheetOverlay";

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  BottomSheetProps
>(({ className, children, title, description, showClose = true, swipeToClose = true, onOpenChange, ...props }, ref) => {
  const isMobile = useIsMobile();
  const [dragY, setDragY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const startY = React.useRef(0);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Gérer le swipe down pour fermer
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (!swipeToClose || !isMobile) return;
    const touch = e.touches[0];
    startY.current = touch.clientY;
    setIsDragging(true);
  }, [swipeToClose, isMobile]);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!isDragging || !swipeToClose || !isMobile) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  }, [isDragging, swipeToClose, isMobile]);

  const handleTouchEnd = React.useCallback(() => {
    if (!isDragging || !swipeToClose || !isMobile) return;
    
    // Si on a swipé de plus de 100px, fermer
    if (dragY > 100 && onOpenChange) {
      onOpenChange(false);
    }
    
    setIsDragging(false);
    setDragY(0);
  }, [isDragging, dragY, swipeToClose, isMobile, onOpenChange]);

  return (
    <DialogPortal>
      <BottomSheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Position: toujours en bas sur mobile, centré sur desktop
          "fixed left-0 right-0 bottom-0",
          "sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2",
          "z-[1050]",
          // Dimensions
          "w-full sm:w-[calc(100%-2rem)] sm:max-w-lg",
          "max-h-[90vh] sm:max-h-[85vh]",
          // Style mobile-first
          "bg-background border-t sm:border rounded-t-2xl sm:rounded-lg shadow-2xl",
          "overflow-hidden",
          // Safe areas iOS
          "pb-[max(1rem,env(safe-area-inset-bottom))]",
          "pl-[max(1rem,env(safe-area-inset-left))]",
          "pr-[max(1rem,env(safe-area-inset-right))]",
          // Animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-bottom-full sm:data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-bottom-full sm:data-[state=open]:slide-in-from-top-[48%]",
          "duration-300 ease-out",
          className,
        )}
        style={{
          transform: isMobile && dragY > 0 
            ? `translateY(${dragY}px)` 
            : undefined,
          transition: isDragging ? 'none' : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {/* Drag handle (mobile uniquement) */}
        {isMobile && swipeToClose && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-4 sm:px-6 pt-2 sm:pt-4 pb-4 border-b">
            {title && (
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
              </div>
            )}
            {showClose && (
              <DialogPrimitive.Close
                className={cn(
                  "rounded-sm opacity-70 ring-offset-background transition-opacity",
                  "hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:pointer-events-none",
                  "touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center",
                  title ? "ml-4" : "ml-auto"
                )}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Fermer</span>
              </DialogPrimitive.Close>
            )}
          </div>
        )}

        {/* Content avec scroll */}
        <div 
          ref={contentRef}
          className={cn(
            "overflow-y-auto overscroll-contain",
            "-webkit-overflow-scrolling-touch",
            "px-4 sm:px-6 py-4 sm:py-6",
            "max-h-[calc(90vh-120px)] sm:max-h-[calc(85vh-120px)]"
          )}
        >
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
BottomSheetContent.displayName = "BottomSheetContent";

// Wrapper pour utiliser BottomSheet comme Dialog
export const BottomSheet = DialogPrimitive.Root;
export const BottomSheetTrigger = DialogPrimitive.Trigger;
export const BottomSheetClose = DialogPrimitive.Close;
export { BottomSheetContent, BottomSheetOverlay };

