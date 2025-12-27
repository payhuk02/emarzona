/**
 * Composant qui exige l'acceptation des CGV avant de permettre certaines actions
 */

import { ReactNode, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useRequireTermsConsent } from '@/hooks/useRequireTermsConsent';
import { useNavigate } from 'react-router-dom';
import { FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface RequireTermsConsentProps {
  children: ReactNode;
  onAction?: () => void | Promise<void>;
  actionLabel?: string;
  showDialog?: boolean;
}

export const RequireTermsConsent = ({ 
  children, 
  onAction,
  actionLabel = "continuer",
  showDialog = true
}: RequireTermsConsentProps) => {
  const { hasConsented, needsUpdate, isLoading, recordConsent, currentTermsDoc } = useRequireTermsConsent();
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAction = async () => {
    if (!hasConsented || needsUpdate) {
      if (showDialog) {
        setShowTermsDialog(true);
      } else {
        toast({
          title: "CGV requises",
          description: "Vous devez accepter les Conditions Générales de Vente pour continuer.",
          variant: "destructive"
        });
        navigate('/legal/terms');
      }
      return;
    }

    if (onAction) {
      await onAction();
    }
  };

  const handleAcceptTerms = async () => {
    if (!accepted) {
      toast({
        title: "Acceptation requise",
        description: "Veuillez accepter les Conditions Générales de Vente pour continuer.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await recordConsent();
      setShowTermsDialog(false);
      setAccepted(false);
      
      toast({
        title: "CGV acceptées",
        description: "Les Conditions Générales de Vente ont été acceptées avec succès.",
      });

      if (onAction) {
        await onAction();
      }
    } catch ( _error: unknown) {
      logger.error('Error accepting terms', { error });
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre acceptation. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="opacity-50">{children}</div>;
  }

  // Si les CGV sont déjà acceptées et à jour, afficher normalement
  if (hasConsented && !needsUpdate) {
    return <>{children}</>;
  }

  // Rendre le composant cliquable mais afficher le dialogue si nécessaire
  return (
    <>
      <div onClick={handleAction} className="cursor-pointer">
        {children}
      </div>

      <AlertDialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Acceptation des Conditions Générales de Vente requise
            </AlertDialogTitle>
            <AlertDialogDescription>
              {needsUpdate 
                ? "Les Conditions Générales de Vente ont été mises à jour. Veuillez accepter la nouvelle version pour continuer."
                : "Vous devez accepter les Conditions Générales de Vente pour utiliser cette fonctionnalité."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="border rounded-lg p-4 bg-muted/50 max-h-[400px] overflow-y-auto">
              {currentTermsDoc?.content ? (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentTermsDoc.content }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chargement des Conditions Générales de Vente...
                </p>
              )}
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg bg-background">
              <Checkbox
                id="accept-terms"
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked === true)}
                className="mt-1"
              />
              <label
                htmlFor="accept-terms"
                className="text-sm leading-relaxed cursor-pointer flex-1"
              >
                J'ai lu et j'accepte les{' '}
                <a
                  href="/legal/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Conditions Générales de Vente
                </a>
                {' '}et j'accepte d'être lié par ces conditions.
              </label>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowTermsDialog(false);
              setAccepted(false);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAcceptTerms}
              disabled={!accepted || saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Enregistrement...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Accepter et {actionLabel}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};







