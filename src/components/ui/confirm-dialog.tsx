/**
 * Composant ConfirmDialog - Dialog de confirmation réutilisable
 * Simplifie les confirmations d'actions destructives ou importantes
 * 
 * @example
 * ```tsx
 * const { confirm } = useConfirmDialog();
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Supprimer le produit',
 *     description: 'Êtes-vous sûr de vouloir supprimer ce produit ?',
 *   });
 *   if (confirmed) {
 *     await deleteProduct();
 *   }
 * };
 * ```
 */

import React, { useState, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Info, AlertCircle } from 'lucide-react';

export interface ConfirmDialogOptions {
  /**
   * Titre de la confirmation
   */
  title: string;
  /**
   * Description de la confirmation
   */
  description: string;
  /**
   * Texte du bouton de confirmation
   * @default "Confirmer"
   */
  confirmText?: string;
  /**
   * Texte du bouton d'annulation
   * @default "Annuler"
   */
  cancelText?: string;
  /**
   * Variant du bouton de confirmation
   * @default "destructive"
   */
  variant?: 'default' | 'destructive';
  /**
   * Icône à afficher
   */
  icon?: React.ReactNode;
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
}

/**
 * Hook pour utiliser le dialog de confirmation
 */
export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    description: '',
  });

  const confirm = useCallback(
    (options: ConfirmDialogOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          ...options,
          open: true,
          resolve,
        });
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    setState((prev) => {
      prev.resolve?.(true);
      return { ...prev, open: false, resolve: undefined };
    });
  }, []);

  const handleCancel = useCallback(() => {
    setState((prev) => {
      prev.resolve?.(false);
      return { ...prev, open: false, resolve: undefined };
    });
  }, []);

  const ConfirmDialogComponent = (
    <AlertDialog open={state.open} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {state.icon || (
              state.variant === 'destructive' ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <Info className="h-5 w-5" />
              )
            )}
            {state.title}
          </AlertDialogTitle>
          <AlertDialogDescription>{state.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {state.cancelText || 'Annuler'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              state.variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {state.confirmText || 'Confirmer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
}

/**
 * Hook spécialisé pour les confirmations de suppression
 */
export function useDeleteConfirmation() {
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const confirmDelete = useCallback(
    (itemName: string, itemType: string = 'élément'): Promise<boolean> => {
      return confirm({
        title: `Supprimer ${itemType}`,
        description: `Êtes-vous sûr de vouloir supprimer "${itemName}" ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        variant: 'destructive',
        icon: <Trash2 className="h-5 w-5 text-destructive" />,
      });
    },
    [confirm]
  );

  return {
    confirmDelete,
    ConfirmDialog,
  };
}

