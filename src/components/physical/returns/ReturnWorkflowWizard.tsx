/**
 * Return Workflow Wizard - Workflow Amélioré pour Retours
 * Date: 2025
 *
 * Workflow étape par étape pour gérer les retours de manière fluide
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Package, Truck, Search, CreditCard, Loader2 } from 'lucide-react';
import {
  useUpdateReturnStatus,
  useGenerateReturnLabel,
  type ProductReturn,
} from '@/hooks/physical/useReturns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface ReturnWorkflowWizardProps {
  returnItem: ProductReturn;
  onComplete?: () => void;
}

const WORKFLOW_STEPS = [
  {
    id: 'pending',
    label: 'En attente',
    description: 'Demande de retour reçue',
    icon: Package,
    actions: ['approve', 'reject'],
  },
  {
    id: 'approved',
    label: 'Approuvé',
    description: "Retour approuvé, en attente d'expédition",
    icon: CheckCircle2,
    actions: ['mark_shipped', 'cancel'],
  },
  {
    id: 'return_shipped',
    label: 'Retour expédié',
    description: 'Colis retour expédié par le client',
    icon: Truck,
    actions: ['mark_received'],
  },
  {
    id: 'return_received',
    label: 'Retour reçu',
    description: 'Colis retour reçu',
    icon: Package,
    actions: ['start_inspection'],
  },
  {
    id: 'inspecting',
    label: 'En inspection',
    description: "Produit en cours d'inspection",
    icon: Search,
    actions: ['approve_refund', 'reject_refund'],
  },
  {
    id: 'refund_processing',
    label: 'Remboursement en cours',
    description: 'Remboursement en traitement',
    icon: CreditCard,
    actions: ['complete_refund'],
  },
  {
    id: 'refunded',
    label: 'Remboursé',
    description: 'Remboursement complété',
    icon: CheckCircle2,
    actions: [],
  },
];

export function ReturnWorkflowWizard({ returnItem, onComplete }: ReturnWorkflowWizardProps) {
  const { toast } = useToast();
  const updateStatus = useUpdateReturnStatus();
  const generateReturnLabel = useGenerateReturnLabel();
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [actionData, setActionData] = useState<Record<string, string | number | undefined>>({});

  // Calculer la progression
  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.id === returnItem.status);
  const progress = ((currentStepIndex + 1) / WORKFLOW_STEPS.length) * 100;

  const handleAction = (action: string) => {
    setSelectedAction(action);
    setIsActionDialogOpen(true);
  };

  const executeAction = async () => {
    try {
      let newStatus: ProductReturn['status'] = returnItem.status;
      const updateData: {
        admin_notes?: string;
        rejection_reason?: string;
        return_tracking_number?: string;
        return_carrier?: string;
        refund_amount?: number;
      } = {};

      switch (selectedAction) {
        case 'approve':
          newStatus = 'approved';
          updateData.admin_notes = actionData.notes || '';
          break;
        case 'reject':
          newStatus = 'rejected';
          updateData.admin_notes = actionData.notes || '';
          updateData.rejection_reason = actionData.reason || '';
          break;
        case 'mark_shipped':
          newStatus = 'return_shipped';
          updateData.return_tracking_number = actionData.trackingNumber || '';
          updateData.return_carrier = actionData.carrier || '';
          break;
        case 'mark_received':
          newStatus = 'return_received';
          break;
        case 'start_inspection':
          newStatus = 'inspecting';
          updateData.admin_notes = actionData.notes || '';
          break;
        case 'approve_refund':
          newStatus = 'refund_processing';
          updateData.refund_amount = actionData.refundAmount || returnItem.original_amount;
          updateData.admin_notes = actionData.notes || '';
          break;
        case 'reject_refund':
          newStatus = 'rejected';
          updateData.admin_notes = actionData.notes || '';
          updateData.rejection_reason = actionData.reason || '';
          break;
        case 'complete_refund':
          newStatus = 'refunded';
          updateData.admin_notes = actionData.notes || '';
          break;
        case 'cancel':
          newStatus = 'cancelled';
          updateData.admin_notes = actionData.notes || '';
          break;
      }

      await updateStatus.mutateAsync({
        returnId: returnItem.id,
        status: newStatus,
        adminNotes: updateData.admin_notes,
        rejectionReason: updateData.rejection_reason,
        trackingNumber: updateData.return_tracking_number,
        carrier: updateData.return_carrier,
      } as Parameters<typeof updateStatus.mutateAsync>[0]);

      // Générer automatiquement l'étiquette de retour si le retour est approuvé
      if (newStatus === 'approved') {
        try {
          await generateReturnLabel.mutateAsync({
            returnId: returnItem.id,
            serviceType: 'standard',
          });
        } catch (labelError) {
          // Ne pas bloquer le workflow si la génération d'étiquette échoue
          logger.error('Error generating return label', { error: labelError });
          toast({
            title: '⚠️ Avertissement',
            description:
              "Le retour a été approuvé mais l'étiquette de retour n'a pas pu être générée automatiquement. Vous pouvez la générer manuellement.",
            variant: 'default',
          });
        }
      }

      setIsActionDialogOpen(false);
      setSelectedAction(null);
      setActionData({});
      onComplete?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Impossible d'exécuter l'action";
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Workflow de Retour</span>
            <Badge variant="outline">{returnItem.return_number}</Badge>
          </CardTitle>
          <CardDescription>Suivez le processus étape par étape</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progression</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Steps Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-6">
                {WORKFLOW_STEPS.map((step, index) => {
                  const isActive = index === currentStepIndex;
                  const isCompleted = index < currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="relative flex items-start gap-4">
                      <div
                        className={cn(
                          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background',
                          isCompleted && 'border-primary bg-primary text-primary-foreground',
                          isActive && !isCompleted && 'border-primary text-primary',
                          !isActive && !isCompleted && 'border-muted text-muted-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p
                            className={cn(
                              'text-sm font-medium',
                              isActive && 'text-primary',
                              isCompleted && 'text-muted-foreground',
                              !isActive && !isCompleted && 'text-muted-foreground'
                            )}
                          >
                            {step.label}
                          </p>
                          {isCompleted && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                        {isActive && step.actions.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {step.actions.map(action => (
                              <Button
                                key={action}
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(action)}
                                disabled={updateStatus.isPending}
                              >
                                {action === 'approve' && 'Approuver'}
                                {action === 'reject' && 'Rejeter'}
                                {action === 'mark_shipped' && 'Marquer expédié'}
                                {action === 'mark_received' && 'Marquer reçu'}
                                {action === 'start_inspection' && 'Démarrer inspection'}
                                {action === 'approve_refund' && 'Approuver remboursement'}
                                {action === 'reject_refund' && 'Rejeter remboursement'}
                                {action === 'complete_refund' && 'Compléter remboursement'}
                                {action === 'cancel' && 'Annuler'}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAction === 'approve' && 'Approuver le retour'}
              {selectedAction === 'reject' && 'Rejeter le retour'}
              {selectedAction === 'mark_shipped' && 'Marquer comme expédié'}
              {selectedAction === 'mark_received' && 'Marquer comme reçu'}
              {selectedAction === 'start_inspection' && "Démarrer l'inspection"}
              {selectedAction === 'approve_refund' && 'Approuver le remboursement'}
              {selectedAction === 'reject_refund' && 'Rejeter le remboursement'}
              {selectedAction === 'complete_refund' && 'Compléter le remboursement'}
              {selectedAction === 'cancel' && 'Annuler le retour'}
            </DialogTitle>
            <DialogDescription>
              {selectedAction === 'approve' && "Confirmez l'approbation de ce retour"}
              {selectedAction === 'reject' && 'Indiquez la raison du rejet'}
              {selectedAction === 'mark_shipped' && 'Ajoutez les informations de tracking'}
              {selectedAction === 'mark_received' && 'Confirmez la réception du colis retour'}
              {selectedAction === 'start_inspection' && "Démarrez l'inspection du produit"}
              {selectedAction === 'approve_refund' && 'Approuvez et configurez le remboursement'}
              {selectedAction === 'reject_refund' &&
                'Indiquez pourquoi le remboursement est rejeté'}
              {selectedAction === 'complete_refund' &&
                'Confirmez que le remboursement est complété'}
              {selectedAction === 'cancel' && 'Annulez ce retour'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {(selectedAction === 'reject' || selectedAction === 'reject_refund') && (
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Raison du rejet *</Label>
                <Textarea
                  id="rejection-reason"
                  value={actionData.reason || ''}
                  onChange={e => setActionData({ ...actionData, reason: e.target.value })}
                  placeholder="Expliquez pourquoi ce retour est rejeté..."
                  rows={3}
                />
              </div>
            )}

            {selectedAction === 'mark_shipped' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tracking-number">Numéro de suivi</Label>
                  <Input
                    id="tracking-number"
                    value={actionData.trackingNumber || ''}
                    onChange={e => setActionData({ ...actionData, trackingNumber: e.target.value })}
                    placeholder="Ex: 1Z999AA10123456784"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carrier">Transporteur</Label>
                  <Select
                    value={actionData.carrier || ''}
                    onValueChange={value => setActionData({ ...actionData, carrier: value })}
                  >
                    <SelectTrigger id="carrier">
                      <SelectValue placeholder="Sélectionner un transporteur" />
                    </SelectTrigger>
                    <SelectContent mobileVariant="sheet">
                      <SelectItem value="fedex">FedEx</SelectItem>
                      <SelectItem value="dhl">DHL</SelectItem>
                      <SelectItem value="ups">UPS</SelectItem>
                      <SelectItem value="chronopost">Chronopost</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {selectedAction === 'approve_refund' && (
              <div className="space-y-2">
                <Label htmlFor="refund-amount">Montant du remboursement (XOF)</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  value={actionData.refundAmount || returnItem.original_amount}
                  onChange={e =>
                    setActionData({ ...actionData, refundAmount: parseFloat(e.target.value) })
                  }
                  min={0}
                  max={returnItem.original_amount}
                />
                <p className="text-xs text-muted-foreground">
                  Montant original: {returnItem.original_amount} XOF
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-notes">Notes (optionnel)</Label>
              <Textarea
                id="admin-notes"
                value={actionData.notes || ''}
                onChange={e => setActionData({ ...actionData, notes: e.target.value })}
                placeholder="Notes internes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={executeAction} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
