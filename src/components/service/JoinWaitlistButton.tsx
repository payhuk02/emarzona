/**
 * Composant pour rejoindre la waitlist d'un service
 * Date: 1 Février 2025
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Bell, Loader2 } from 'lucide-react';
import { useAddToWaitlist } from '@/hooks/services/useServiceWaitlist';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/hooks/useStore';
import { format } from 'date-fns';

interface JoinWaitlistButtonProps {
  serviceId: string;
  serviceName: string;
  disabled?: boolean;
}

export function JoinWaitlistButton({ serviceId, serviceName, disabled }: JoinWaitlistButtonProps) {
  const { user } = useAuth();
  const { store } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: user?.user_metadata?.full_name || '',
    customer_email: user?.email || '',
    customer_phone: '',
    preferred_date: '',
    preferred_time: '',
    customer_notes: '',
    priority: 'normal' as 'normal' | 'high' | 'urgent',
  });

  const addToWaitlist = useAddToWaitlist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    try {
      await addToWaitlist.mutateAsync({
        service_id: serviceId,
        store_id: store.id,
        ...formData,
      });
      setIsOpen(false);
      setFormData({
        customer_name: user?.user_metadata?.full_name || '',
        customer_email: user?.email || '',
        customer_phone: '',
        preferred_date: '',
        preferred_time: '',
        customer_notes: '',
        priority: 'normal',
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled} className="w-full">
          <Bell className="h-4 w-4 mr-2" />
          Rejoindre la liste d'attente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejoindre la liste d'attente</DialogTitle>
          <DialogDescription>
            Vous serez notifié dès qu'un créneau sera disponible pour {serviceName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Nom complet *</Label>
            <Input
              id="customer_name"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_email">Email *</Label>
            <Input
              id="customer_email"
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_phone">Téléphone</Label>
            <Input
              id="customer_phone"
              type="tel"
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred_date">Date préférée</Label>
              <Input
                id="preferred_date"
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_time">Heure préférée</Label>
              <Input
                id="preferred_time"
                type="time"
                value={formData.preferred_time}
                onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_notes">Notes (optionnel)</Label>
            <Textarea
              id="customer_notes"
              value={formData.customer_notes}
              onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
              rows={3}
              placeholder="Informations supplémentaires..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={addToWaitlist.isPending}>
              {addToWaitlist.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Rejoindre la liste
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

