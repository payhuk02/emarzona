/**
 * RegistrationDialog Component
 * Dialog pour l'inscription au programme d'affiliation
 * Optimisé avec React.memo pour améliorer les performances
 */

import { memo, useCallback, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, AlertCircle, Loader2 } from '@/components/icons';
import { z } from 'zod';
import { useDebounce } from '@/hooks/useDebounce';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';

interface RegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (data: RegistrationData) => Promise<void>;
  isRegistering?: boolean;
}

interface RegistrationData {
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
}

// Schéma de validation Zod
const registrationSchema = z.object({
  email: z.string()
    .min(1, 'L\'email est requis')
    .email('L\'email doit être valide'),
  first_name: z.union([
    z.string().length(0),
    z.string()
      .min(2, 'Le prénom doit contenir au moins 2 caractères')
      .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
      .regex(/^[a-zA-ZàâäéèêëïîôùûüÿñçÀÂÄÉÈÊËÏÎÔÙÛÜŸÑÇ\s'-]+$/, 'Le prénom ne peut contenir que des lettres')
  ]),
  last_name: z.union([
    z.string().length(0),
    z.string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(50, 'Le nom ne peut pas dépasser 50 caractères')
      .regex(/^[a-zA-ZàâäéèêëïîôùûüÿñçÀÂÄÉÈÊËÏÎÔÙÛÜŸÑÇ\s'-]+$/, 'Le nom ne peut contenir que des lettres')
  ]),
  display_name: z.union([
    z.string().length(0),
    z.string().max(50, 'Le nom d\'affichage ne peut pas dépasser 50 caractères')
  ]),
});

export const RegistrationDialog = memo(({ 
  open, 
  onOpenChange, 
  onRegister, 
  isRegistering = false 
}: RegistrationDialogProps) => {
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    email: '',
    first_name: '',
    last_name: '',
    display_name: '',
  });
  const [registrationErrors, setRegistrationErrors] = useState<Record<string, string>>({});

  // Debounce des valeurs pour optimiser les validations
  const debouncedEmail = useDebounce(registrationData.email, 300);
  const debouncedFirstName = useDebounce(registrationData.first_name, 300);
  const debouncedLastName = useDebounce(registrationData.last_name, 300);

  // Validation en temps réel avec debounce
  useEffect(() => {
    if (debouncedEmail || debouncedFirstName || debouncedLastName) {
      try {
        registrationSchema.parse({
          email: debouncedEmail,
          first_name: debouncedFirstName,
          last_name: debouncedLastName,
          display_name: registrationData.display_name,
        });
        // Effacer les erreurs si la validation passe
        setRegistrationErrors(prev => {
          const newErrors = { ...prev };
          if (debouncedEmail && newErrors.email) delete newErrors.email;
          if (debouncedFirstName && newErrors.first_name) delete newErrors.first_name;
          if (debouncedLastName && newErrors.last_name) delete newErrors.last_name;
          return newErrors;
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors: Record<string, string> = {};
          error.errors.forEach((err) => {
            const path = err.path[0] as string;
            if (path && (path === 'email' || path === 'first_name' || path === 'last_name')) {
              errors[path] = err.message;
            }
          });
          setRegistrationErrors(prev => ({ ...prev, ...errors }));
        }
      }
    }
  }, [debouncedEmail, debouncedFirstName, debouncedLastName, registrationData.display_name]);

  // Réinitialiser le formulaire quand le dialog se ferme
  useEffect(() => {
    if (!open) {
      setRegistrationData({
        email: '',
        first_name: '',
        last_name: '',
        display_name: '',
      });
      setRegistrationErrors({});
    }
  }, [open]);

  const validateRegistration = useCallback((data: RegistrationData): boolean => {
    try {
      registrationSchema.parse(data);
      setRegistrationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as string;
          if (path) {
            errors[path] = err.message;
          }
        });
        setRegistrationErrors(errors);
      }
      return false;
    }
  }, []);

  const handleInputChange = useCallback((field: keyof RegistrationData, value: string) => {
    setRegistrationData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié immédiatement
    if (registrationErrors[field]) {
      setRegistrationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [registrationErrors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegistration(registrationData)) {
      return;
    }

    await onRegister(registrationData);
  }, [registrationData, validateRegistration, onRegister]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <UserPlus className="h-5 w-5" />
          Devenir affilié
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Inscription au programme d'affiliation</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Rejoignez notre programme et commencez à gagner des commissions dès aujourd'hui
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={registrationData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isRegistering}
              className={registrationErrors.email ? 'border-destructive' : ''}
              aria-invalid={!!registrationErrors.email}
              aria-describedby={registrationErrors.email ? 'email-error' : undefined}
            />
            {registrationErrors.email && (
              <p id="email-error" className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {registrationErrors.email}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-sm font-medium">Prénom</Label>
              <Input
                id="first_name"
                placeholder="Jean"
                value={registrationData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                disabled={isRegistering}
                className={registrationErrors.first_name ? 'border-destructive' : ''}
                aria-invalid={!!registrationErrors.first_name}
                aria-describedby={registrationErrors.first_name ? 'first_name-error' : undefined}
              />
              {registrationErrors.first_name && (
                <p id="first_name-error" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {registrationErrors.first_name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-sm font-medium">Nom</Label>
              <Input
                id="last_name"
                placeholder="Dupont"
                value={registrationData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                disabled={isRegistering}
                className={registrationErrors.last_name ? 'border-destructive' : ''}
                aria-invalid={!!registrationErrors.last_name}
                aria-describedby={registrationErrors.last_name ? 'last_name-error' : undefined}
              />
              {registrationErrors.last_name && (
                <p id="last_name-error" className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {registrationErrors.last_name}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-sm font-medium">
              Nom d'affichage <span className="text-muted-foreground text-xs">(optionnel)</span>
            </Label>
            <Input
              id="display_name"
              placeholder="JeanD"
              value={registrationData.display_name}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              onKeyDown={handleSpaceKeyDown}
              disabled={isRegistering}
            />
          </div>
          
          <div className="pt-2">
            <Button 
              type="submit"
              disabled={isRegistering}
              className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  S'inscrire
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground pt-2">
            Aucun frais • Aucun engagement • Commencez immédiatement
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}, (prevProps, nextProps) => {
  // Comparaison optimisée pour éviter les re-renders inutiles
  return (
    prevProps.open === nextProps.open &&
    prevProps.isRegistering === nextProps.isRegistering &&
    prevProps.onOpenChange === nextProps.onOpenChange &&
    prevProps.onRegister === nextProps.onRegister
  );
});

RegistrationDialog.displayName = 'RegistrationDialog';

