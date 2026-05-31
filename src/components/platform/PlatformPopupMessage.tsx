import { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useDismissPlatformPopup,
  usePlatformPopupMessages,
} from '@/hooks/usePlatformPopupMessages';
import type { PopupStyle } from '@/lib/admin/admin-broadcast-service';

const styleConfig: Record<PopupStyle, { icon: typeof Info; badge: string; accent: string }> = {
  info: {
    icon: Info,
    badge: 'Information',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    badge: 'Attention',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  success: {
    icon: CheckCircle2,
    badge: 'Annonce',
    accent: 'text-green-600 dark:text-green-400',
  },
  announcement: {
    icon: Megaphone,
    badge: 'Message plateforme',
    accent: 'text-primary',
  },
};

function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

export function PlatformPopupMessage() {
  const location = useLocation();
  const { data: popups = [], isLoading } = usePlatformPopupMessages();
  const dismissMutation = useDismissPlatformPopup();
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isAdminRoute = location.pathname.startsWith('/admin');

  const visiblePopups = useMemo(() => popups.filter(p => p.is_active), [popups]);

  const currentPopup = visiblePopups[currentIndex] ?? null;

  useEffect(() => {
    if (isAdminRoute || isLoading || visiblePopups.length === 0) {
      setOpen(false);
      return;
    }
    setCurrentIndex(0);
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, [isAdminRoute, isLoading, visiblePopups.length, visiblePopups[0]?.id]);

  if (isAdminRoute || !currentPopup) {
    return null;
  }

  const config = styleConfig[currentPopup.style] ?? styleConfig.info;
  const Icon = config.icon;

  const handleDismiss = async () => {
    if (currentPopup.dismissible) {
      await dismissMutation.mutateAsync(currentPopup.id);
    }
    setOpen(false);
    if (currentIndex + 1 < visiblePopups.length) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setOpen(true);
      }, 300);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next && currentPopup.dismissible) {
          void handleDismiss();
        } else {
          setOpen(next);
        }
      }}
    >
      <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Icon className={cn('h-5 w-5', config.accent)} aria-hidden="true" />
            <Badge variant="secondary">{config.badge}</Badge>
          </div>
          <DialogTitle>{currentPopup.title}</DialogTitle>
          {looksLikeHtml(currentPopup.message) ? (
            <div
              className="text-left pt-2 text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: currentPopup.message }}
            />
          ) : (
            <DialogDescription className="text-left whitespace-pre-wrap pt-2">
              {currentPopup.message}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {currentPopup.action_url && (
            <Button asChild variant="default" className="w-full sm:w-auto">
              <Link to={currentPopup.action_url} onClick={() => void handleDismiss()}>
                {currentPopup.action_label || 'En savoir plus'}
              </Link>
            </Button>
          )}
          {currentPopup.dismissible && (
            <Button
              variant={currentPopup.action_url ? 'outline' : 'default'}
              className="w-full sm:w-auto"
              onClick={() => void handleDismiss()}
              disabled={dismissMutation.isPending}
            >
              {currentPopup.action_url ? 'Fermer' : 'Compris'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
