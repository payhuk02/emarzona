/**
 * Service - Pricing & Options Form (Step 4)
 * Date: 28 octobre 2025
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Calendar, XCircle } from 'lucide-react';
import type { ServiceProductFormData } from '@/types/service-product';

interface ServicePricingOptionsFormProps {
  data: Partial<ServiceProductFormData>;
  onUpdate: (data: Partial<ServiceProductFormData>) => void;
}

export const ServicePricingOptionsForm = ({ data, onUpdate }: ServicePricingOptionsFormProps) => {
  return (
    <div className="space-y-6">
      {/* Pricing Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Type de tarification
          </CardTitle>
          <CardDescription>Comment le prix est-il calculé ?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={data.pricing_type}
            onValueChange={(value) => onUpdate({ pricing_type: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Prix fixe</SelectItem>
              <SelectItem value="hourly">Tarif horaire</SelectItem>
              <SelectItem value="per_participant">Par participant</SelectItem>
            </SelectContent>
          </Select>

          {data.pricing_type === 'hourly' && (
            <p className="text-sm text-muted-foreground">
              Le prix sera calculé en fonction de la durée du service
            </p>
          )}

          {data.pricing_type === 'per_participant' && (
            <p className="text-sm text-muted-foreground">
              Le prix sera multiplié par le nombre de participants
            </p>
          )}
        </CardContent>
      </Card>

      {/* Deposit */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Acompte requis</CardTitle>
              <CardDescription>
                Demander un acompte à la réservation ?
              </CardDescription>
            </div>
            <Switch
              checked={data.deposit_required ?? false}
              onCheckedChange={(checked) => onUpdate({ deposit_required: checked })}
            />
          </div>
        </CardHeader>

        {data.deposit_required && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit_type">Type d'acompte</Label>
              <Select
                value={data.deposit_type}
                onValueChange={(value) => onUpdate({ deposit_type: value as 'fixed' | 'percentage' })}
              >
                <SelectTrigger id="deposit_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Montant fixe (XOF)</SelectItem>
                  <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit_amount">
                Montant de l'acompte *
              </Label>
              <Input
                id="deposit_amount"
                type="number"
                min="0"
                step={data.deposit_type === 'percentage' ? '1' : '100'}
                max={data.deposit_type === 'percentage' ? '100' : undefined}
                placeholder={data.deposit_type === 'percentage' ? '50' : '10000'}
                value={data.deposit_amount || ''}
                onChange={(e) => onUpdate({ deposit_amount: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                {data.deposit_type === 'percentage' 
                  ? 'Pourcentage du prix total'
                  : 'Montant fixe en XOF'
                }
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Booking Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Options de réservation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Allow Cancellation */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autoriser l'annulation</Label>
              <p className="text-sm text-muted-foreground">
                Les clients peuvent annuler leur réservation
              </p>
            </div>
            <Switch
              checked={data.booking_options?.allow_booking_cancellation ?? true}
              onCheckedChange={(checked) => 
                onUpdate({
                  booking_options: {
                    ...data.booking_options!,
                    allow_booking_cancellation: checked,
                  },
                })
              }
            />
          </div>

          {/* Cancellation Deadline */}
          {data.booking_options?.allow_booking_cancellation && (
            <div className="space-y-2">
              <Label htmlFor="cancellation_deadline">
                Délai d'annulation (heures avant RDV)
              </Label>
              <Input
                id="cancellation_deadline"
                type="number"
                min="0"
                value={data.booking_options?.cancellation_deadline_hours || 24}
                onChange={(e) =>
                  onUpdate({
                    booking_options: {
                      ...data.booking_options!,
                      cancellation_deadline_hours: parseInt(e.target.value) || 24,
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Les annulations doivent être faites au moins X heures avant le RDV
              </p>
            </div>
          )}

          {/* Require Approval */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Approbation manuelle</Label>
              <p className="text-sm text-muted-foreground">
                Vous devez approuver chaque réservation
              </p>
            </div>
            <Switch
              checked={data.booking_options?.require_approval ?? false}
              onCheckedChange={(checked) =>
                onUpdate({
                  booking_options: {
                    ...data.booking_options!,
                    require_approval: checked,
                  },
                })
              }
            />
          </div>

          {/* Buffer Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buffer_before">Temps tampon avant (min)</Label>
              <Input
                id="buffer_before"
                type="number"
                min="0"
                value={data.booking_options?.buffer_time_before || 0}
                onChange={(e) =>
                  onUpdate({
                    booking_options: {
                      ...data.booking_options!,
                      buffer_time_before: parseInt(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buffer_after">Temps tampon après (min)</Label>
              <Input
                id="buffer_after"
                type="number"
                min="0"
                value={data.booking_options?.buffer_time_after || 0}
                onChange={(e) =>
                  onUpdate({
                    booking_options: {
                      ...data.booking_options!,
                      buffer_time_after: parseInt(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Temps de pause entre les rendez-vous
          </p>

          {/* Advance Booking Days */}
          <div className="space-y-2">
            <Label htmlFor="advance_booking_days">
              Réservation à l'avance (jours)
            </Label>
            <Input
              id="advance_booking_days"
              type="number"
              min="1"
              value={data.booking_options?.advance_booking_days || 30}
              onChange={(e) =>
                onUpdate({
                  booking_options: {
                    ...data.booking_options!,
                    advance_booking_days: parseInt(e.target.value) || 30,
                  },
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Maximum de jours à l'avance que les clients peuvent réserver
            </p>
          </div>

          {/* Max Bookings Per Day */}
          <div className="space-y-2">
            <Label htmlFor="max_bookings_per_day">
              Maximum de réservations par jour (optionnel)
            </Label>
            <Input
              id="max_bookings_per_day"
              type="number"
              min="0"
              placeholder="Illimité"
              value={data.booking_options?.max_bookings_per_day || ''}
              onChange={(e) =>
                onUpdate({
                  booking_options: {
                    ...data.booking_options!,
                    max_bookings_per_day: parseInt(e.target.value) || undefined,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

