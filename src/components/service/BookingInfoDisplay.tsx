import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Package,
  Truck,
  CreditCard,
  MessageSquare,
  ExternalLink,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Statuts possibles pour une réservation
 */
export type BookingStatus =
  | 'pending'        // En attente de confirmation
  | 'confirmed'      // Confirmée
  | 'in_progress'    // En cours
  | 'completed'      // Terminée
  | 'cancelled'      // Annulée
  | 'no_show'        // Client absent
  | 'rescheduled'    // Reprogrammée
  | 'refunded';      // Remboursée

/**
 * Variantes d'affichage du composant
 */
export type BookingInfoVariant = 'compact' | 'default' | 'detailed';

/**
 * Informations client
 */
export interface BookingCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

/**
 * Informations de service
 */
export interface BookingService {
  id: string;
  name: string;
  duration: number; // en minutes
  price: number;
  currency?: string;
}

/**
 * Informations de localisation
 */
export interface BookingLocation {
  type: 'online' | 'on_site' | 'client_location';
  address?: string;
  meetingLink?: string;
  instructions?: string;
}

/**
 * Props pour BookingInfoDisplay
 */
export interface BookingInfoDisplayProps {
  /** ID unique de la réservation */
  bookingId: string;
  
  /** Statut de la réservation */
  status: BookingStatus;
  
  /** Date et heure de la réservation */
  scheduledDate: Date | string;
  
  /** Informations client */
  customer: BookingCustomer;
  
  /** Informations service */
  service: BookingService;
  
  /** Localisation / type de rendez-vous */
  location?: BookingLocation;
  
  /** Staff assigné (optionnel) */
  assignedStaff?: string;
  
  /** Notes du client */
  customerNotes?: string;
  
  /** Notes internes */
  internalNotes?: string;
  
  /** Variante d'affichage */
  variant?: BookingInfoVariant;
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Date de création de la réservation */
  createdAt?: Date | string;
  
  /** Date de dernière modification */
  updatedAt?: Date | string;
  
  /** Montant payé */
  amountPaid?: number;
  
  /** Méthode de paiement */
  paymentMethod?: string;
  
  /** Callback pour actions (confirmer, annuler, etc.) */
  onAction?: (action: string) => void;
  
  /** Afficher les boutons d'action */
  showActions?: boolean;
}

/**
 * Configuration des statuts
 */
const STATUS_CONFIG: Record<
  BookingStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    textColor: string;
  }
> = {
  pending: {
    label: 'En attente',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
  },
  confirmed: {
    label: 'Confirmée',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  in_progress: {
    label: 'En cours',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  completed: {
    label: 'Terminée',
    icon: CheckCircle2,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
  },
  cancelled: {
    label: 'Annulée',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
  no_show: {
    label: 'Client absent',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  rescheduled: {
    label: 'Reprogrammée',
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
  refunded: {
    label: 'Remboursée',
    icon: CreditCard,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
  },
};

/**
 * BookingInfoDisplay - Composant d'affichage des informations de réservation
 * 
 * @example
 * ```tsx
 * // Compact variant
 * <BookingInfoDisplay 
 *   bookingId="BK-001"
 *   status="confirmed"
 *   scheduledDate={new Date()}
 *   customer={{ id: '1', name: 'John Doe', email: 'john@example.com' }}
 *   service={{ id: '1', name: 'Coaching 1h', duration: 60, price: 50 }}
 *   variant="compact"
 * />
 * 
 * // Default with location
 * <BookingInfoDisplay 
 *   bookingId="BK-002"
 *   status="pending"
 *   scheduledDate={new Date()}
 *   customer={{ id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+33612345678' }}
 *   service={{ id: '2', name: 'Consultation', duration: 45, price: 75 }}
 *   location={{ type: 'online', meetingLink: 'https://zoom.us/j/123' }}
 *   assignedStaff="Dr. Martin"
 *   showActions={true}
 * />
 * ```
 */
export const BookingInfoDisplay: React.FC<BookingInfoDisplayProps> = ({
  bookingId,
  status,
  scheduledDate,
  customer,
  service,
  location,
  assignedStaff,
  customerNotes,
  internalNotes,
  variant = 'default',
  className,
  createdAt,
  updatedAt,
  amountPaid,
  paymentMethod,
  onAction,
  showActions = false,
}) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Formater l'heure
  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Copier dans le presse-papier
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // VARIANT: COMPACT
  if (variant === 'compact') {
    return (
      <Card className={cn('p-3', className)}>
        <div className="flex items-center justify-between">
          {/* Left side - Status and customer */}
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.bgColor)}>
              <Icon className={cn('h-4 w-4', config.color)} />
            </div>
            <div>
              <p className="font-semibold text-sm">{customer.name}</p>
              <p className="text-xs text-muted-foreground">{service.name}</p>
            </div>
          </div>

          {/* Right side - Date and ID */}
          <div className="text-right">
            <p className="text-sm font-medium">
              {formatDate(scheduledDate)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTime(scheduledDate)} • {bookingId}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // VARIANT: DEFAULT
  if (variant === 'default') {
    return (
      <Card className={cn('p-4', className)}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-3 rounded-lg', config.bgColor)}>
                <Icon className={cn('h-5 w-5', config.color)} />
              </div>
              <div>
                <p className={cn('font-semibold', config.textColor)}>
                  {config.label}
                </p>
                <p className="text-sm text-muted-foreground">#{bookingId}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {service.duration} min
            </Badge>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">{formatDate(scheduledDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Heure</p>
                <p className="text-sm font-medium">{formatTime(scheduledDate)}</p>
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{customer.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{customer.email}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(customer.email)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{customer.phone}</span>
              </div>
            )}
          </div>

          {/* Service */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium text-sm">{service.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {service.price} {service.currency || 'EUR'}
              {assignedStaff && ` • ${assignedStaff}`}
            </p>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  {location.type === 'online' && 'En ligne'}
                  {location.type === 'on_site' && 'Sur place'}
                  {location.type === 'client_location' && 'Chez le client'}
                </p>
                {location.meetingLink && (
                  <a
                    href={location.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Rejoindre la réunion
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {location.address && (
                  <p className="text-sm">{location.address}</p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {customerNotes && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-700">Note du client</p>
                <p className="text-sm text-blue-900 mt-1">{customerNotes}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && onAction && (
            <div className="flex gap-2 pt-2">
              {status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onAction('confirm')}
                    className="flex-1"
                  >
                    Confirmer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction('cancel')}
                  >
                    Annuler
                  </Button>
                </>
              )}
              {status === 'confirmed' && (
                <Button
                  size="sm"
                  onClick={() => onAction('start')}
                  className="flex-1"
                >
                  Démarrer
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  // VARIANT: DETAILED
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header with full status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('p-4 rounded-xl', config.bgColor)}>
              <Icon className={cn('h-6 w-6', config.color)} />
            </div>
            <div>
              <h3 className={cn('text-lg font-bold', config.textColor)}>
                {config.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                Réservation #{bookingId}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="mb-1">
              {service.duration} minutes
            </Badge>
            {createdAt && (
              <p className="text-xs text-muted-foreground">
                Créée le {formatDate(createdAt)}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Detailed date and time */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Date du rendez-vous</p>
                <p className="text-base font-semibold mt-1">
                  {formatDate(scheduledDate)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Horaire</p>
                <p className="text-base font-semibold mt-1">
                  {formatTime(scheduledDate)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Customer detailed info */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Informations client
          </h4>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {customer.avatar && (
                  <img
                    src={customer.avatar}
                    alt={customer.name}
                    className="h-10 w-10 rounded-full"
                  />
                )}
                <div>
                  <p className="font-semibold">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {customer.id}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Voir profil
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{customer.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => copyToClipboard(customer.email)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              {customer.phone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => copyToClipboard(customer.phone)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Service detailed info */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Détails du service
          </h4>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{service.name}</p>
                {assignedStaff && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Assigné à : {assignedStaff}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {service.price} {service.currency || 'EUR'}
                </p>
                <p className="text-xs text-muted-foreground">{service.duration} min</p>
              </div>
            </div>
            {amountPaid !== undefined && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    <span>Paiement effectué</span>
                  </div>
                  <span className="font-semibold">
                    {amountPaid} {service.currency || 'EUR'}
                    {paymentMethod && (
                      <span className="text-xs text-muted-foreground ml-2">
                        via {paymentMethod}
                      </span>
                    )}
                  </span>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Location detailed */}
        {location && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Localisation
            </h4>
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {location.type === 'online' && 'En ligne'}
                  {location.type === 'on_site' && 'Sur place'}
                  {location.type === 'client_location' && 'Chez le client'}
                </Badge>
              </div>
              {location.meetingLink && (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => window.open(location.meetingLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Rejoindre la réunion
                </Button>
              )}
              {location.address && (
                <p className="text-sm text-muted-foreground">{location.address}</p>
              )}
              {location.instructions && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-medium text-blue-700">Instructions</p>
                  <p className="text-sm text-blue-900 mt-1">{location.instructions}</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Notes section */}
        {(customerNotes || internalNotes) && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </h4>
            {customerNotes && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <p className="text-xs font-medium text-blue-700 mb-2">Note du client</p>
                <p className="text-sm text-blue-900">{customerNotes}</p>
              </Card>
            )}
            {internalNotes && (
              <Card className="p-4 bg-orange-50 border-orange-200">
                <p className="text-xs font-medium text-orange-700 mb-2">Note interne</p>
                <p className="text-sm text-orange-900">{internalNotes}</p>
              </Card>
            )}
          </div>
        )}

        {/* Detailed actions */}
        {showActions && onAction && (
          <div className="flex gap-3 pt-4">
            {status === 'pending' && (
              <>
                <Button
                  size="default"
                  onClick={() => onAction('confirm')}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmer la réservation
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  onClick={() => onAction('reschedule')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Reprogrammer
                </Button>
                <Button
                  size="default"
                  variant="destructive"
                  onClick={() => onAction('cancel')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </>
            )}
            {status === 'confirmed' && (
              <>
                <Button
                  size="default"
                  onClick={() => onAction('start')}
                  className="flex-1"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Démarrer la prestation
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  onClick={() => onAction('reschedule')}
                >
                  Reprogrammer
                </Button>
              </>
            )}
            {status === 'in_progress' && (
              <Button
                size="default"
                onClick={() => onAction('complete')}
                className="w-full"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marquer comme terminée
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

BookingInfoDisplay.displayName = 'BookingInfoDisplay';

export default BookingInfoDisplay;

