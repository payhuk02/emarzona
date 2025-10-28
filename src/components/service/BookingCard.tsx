/**
 * Booking Card Component
 * Date: 28 octobre 2025
 * 
 * Professional card for displaying service bookings
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Video,
  Phone,
  Mail,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ServiceBooking } from '@/hooks/service';

interface BookingCardProps {
  booking: ServiceBooking & { product?: any; customer?: any; staff?: any };
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
  onNoShow?: (id: string) => void;
  showActions?: boolean;
}

export const BookingCard = ({
  booking,
  onConfirm,
  onCancel,
  onComplete,
  onNoShow,
  showActions = true,
}: BookingCardProps) => {
  const getStatusBadge = () => {
    switch (booking.status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            En attente
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="default" className="gap-1 bg-blue-600">
            <CheckCircle2 className="h-3 w-3" />
            Confirmé
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Terminé
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Annulé
          </Badge>
        );
      case 'no_show':
        return (
          <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600">
            <Ban className="h-3 w-3" />
            Absent
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEEE d MMMM yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{booking.product?.name}</h3>
              {getStatusBadge()}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(booking.booking_date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTime(booking.booking_time)}</span>
              </div>
            </div>
          </div>

          {showActions && booking.status !== 'completed' && booking.status !== 'cancelled' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {booking.status === 'pending' && (
                  <DropdownMenuItem onClick={() => onConfirm?.(booking.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirmer
                  </DropdownMenuItem>
                )}
                {booking.status === 'confirmed' && (
                  <DropdownMenuItem onClick={() => onComplete?.(booking.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marquer terminé
                  </DropdownMenuItem>
                )}
                {booking.status === 'confirmed' && (
                  <DropdownMenuItem onClick={() => onNoShow?.(booking.id)}>
                    <Ban className="h-4 w-4 mr-2" />
                    Absent
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onCancel?.(booking.id)}
                  className="text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Annuler
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Customer Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={booking.customer?.avatar_url} />
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{booking.customer?.name || 'Client'}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {booking.customer?.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{booking.customer.email}</span>
                </div>
              )}
              {booking.customer?.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{booking.customer.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Staff Member */}
        {booking.staff && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Avec:</span>
            <span className="font-medium">{booking.staff.name}</span>
          </div>
        )}

        {/* Meeting URL */}
        {booking.meeting_url && (
          <div className="flex items-center gap-2 text-sm">
            <Video className="h-4 w-4 text-muted-foreground" />
            <a
              href={booking.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline truncate"
            >
              Lien de visio
            </a>
          </div>
        )}

        {/* Participants Count */}
        {booking.participants_count > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {booking.participants_count} participants
            </span>
          </div>
        )}

        {/* Customer Notes */}
        {booking.customer_notes && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">Notes du client:</p>
            <p className="text-muted-foreground">{booking.customer_notes}</p>
          </div>
        )}

        {/* Internal Notes */}
        {booking.internal_notes && showActions && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-sm border border-yellow-200 dark:border-yellow-800">
            <p className="font-medium mb-1 text-yellow-900 dark:text-yellow-100">
              Notes internes:
            </p>
            <p className="text-yellow-800 dark:text-yellow-200">
              {booking.internal_notes}
            </p>
          </div>
        )}

        {/* Cancellation Reason */}
        {booking.status === 'cancelled' && booking.cancellation_reason && (
          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg text-sm border border-red-200 dark:border-red-800">
            <p className="font-medium mb-1 text-red-900 dark:text-red-100">
              Raison de l'annulation:
            </p>
            <p className="text-red-800 dark:text-red-200">
              {booking.cancellation_reason}
            </p>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-bold text-primary">
            {booking.total_price?.toLocaleString() || 0} XOF
          </span>
        </div>

        {/* Deposit Info */}
        {booking.deposit_paid > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Acompte versé</span>
            <span className="font-medium text-green-600">
              {booking.deposit_paid.toLocaleString()} XOF
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Bookings List
 */
interface BookingsListProps {
  bookings: (ServiceBooking & { product?: any; customer?: any; staff?: any })[];
  loading?: boolean;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
  onNoShow?: (id: string) => void;
  showActions?: boolean;
}

export const BookingsList = ({
  bookings,
  loading,
  onConfirm,
  onCancel,
  onComplete,
  onNoShow,
  showActions = true,
}: BookingsListProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucune réservation</h3>
          <p className="text-muted-foreground">
            Les réservations apparaîtront ici
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onComplete={onComplete}
          onNoShow={onNoShow}
          showActions={showActions}
        />
      ))}
    </div>
  );
};

