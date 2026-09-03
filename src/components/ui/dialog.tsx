import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from '@/components/icons';

import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[1040] bg-black/80',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'duration-200 motion-reduce:duration-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Position: mobile en bas, desktop centré (évite problèmes avec clavier)
        'fixed left-0 right-0 bottom-0 sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2',
        'z-[1050]',
        // Dimensions et overflow
        'w-full sm:w-[calc(100%-2rem)] sm:max-w-lg',
        // iOS Safari: 100vh peut être faux avec la barre d'adresse / clavier.
        // 100dvh suit le viewport dynamique (support moderne), avec fallback 100vh.
        'max-h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:max-h-[90vh]',
        'overflow-x-hidden overflow-y-auto overscroll-contain',
        '[-webkit-overflow-scrolling:touch]', // Momentum scroll iOS
        // Style et layout
        'grid gap-4 border-t sm:border bg-background shadow-lg',
        'rounded-t-lg sm:rounded-lg',
        'p-4 sm:p-6',
        // Safe areas iOS (notch, barre d'accueil)
        'pt-[max(1rem,env(safe-area-inset-top))] sm:pt-6',
        'pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6',
        'pl-[max(1rem,env(safe-area-inset-left))] sm:pl-6',
        'pr-[max(1rem,env(safe-area-inset-right))] sm:pr-6',
        // Animations optimisées mobile
        'duration-200 motion-reduce:duration-0',
        'will-change-transform', // GPU acceleration
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        // Animations slide: mobile depuis le bas, desktop depuis le centre
        'data-[state=closed]:slide-out-to-bottom-full sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-bottom-full sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Fermer la boîte de dialogue"
      >
        <X className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Fermer</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-base sm:text-lg font-semibold leading-none tracking-tight pr-8', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
