import { useState, type MouseEvent } from 'react';
import { Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { joinBookingMeeting } from '@/lib/service/join-booking-meeting';
import { canShowServiceMeetingJoin } from '@/lib/service/daily-meeting';
import { useToast } from '@/hooks/use-toast';

type JoinServiceMeetingButtonProps = {
  bookingId: string;
  role: 'host' | 'guest';
  meetingUrl?: string | null;
  meetingPlatform?: string | null;
  locationType?: string | null;
  status?: string | null;
  label?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm';
  className?: string;
};

export function JoinServiceMeetingButton({
  bookingId,
  role,
  meetingUrl,
  meetingPlatform,
  locationType,
  status,
  label = 'Rejoindre la visio',
  variant = 'outline',
  size = 'sm',
  className,
}: JoinServiceMeetingButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isDaily = meetingPlatform === 'daily' || (!meetingPlatform && locationType === 'online');

  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleClick = async (event?: MouseEvent) => {
    event?.stopPropagation();
    if (!isDaily && meetingUrl) {
      openUrl(meetingUrl);
      return;
    }
    setLoading(true);
    try {
      const result = await joinBookingMeeting(bookingId, role);
      if ('error' in result) {
        if (meetingUrl) {
          openUrl(meetingUrl);
          return;
        }
        toast({
          title: 'Visio indisponible',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      openUrl(result.url);
    } finally {
      setLoading(false);
    }
  };

  if (!canShowServiceMeetingJoin({ meetingUrl, meetingPlatform, locationType, status })) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={e => void handleClick(e)}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
      ) : (
        <Video className="h-4 w-4 mr-2" aria-hidden="true" />
      )}
      {label}
    </Button>
  );
}
