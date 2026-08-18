import { Button } from '@/components/ui/button';
import { usePublicWhatsAppConfig } from '@/hooks/usePublicWhatsAppConfig';
import { buildProductWhatsAppMessage, buildWhatsAppClickUrl } from '@/lib/whatsapp/whatsapp-url';
import { MessageCircle } from 'lucide-react';

type PhysicalProductWhatsAppButtonProps = {
  productName: string;
  whatsappNumber?: string | null;
  whatsappEnabled?: boolean | null;
  paymentUrl?: string | null;
  className?: string;
  label?: string;
};

export function PhysicalProductWhatsAppButton({
  productName,
  whatsappNumber,
  whatsappEnabled,
  paymentUrl,
  className,
  label = 'WhatsApp',
}: PhysicalProductWhatsAppButtonProps) {
  const { data: config } = usePublicWhatsAppConfig();

  if (!whatsappEnabled || !whatsappNumber?.trim() || config?.enabled === false) {
    return null;
  }

  const href = buildWhatsAppClickUrl(
    config?.click_url_base ?? 'https://wa.me',
    whatsappNumber,
    buildProductWhatsAppMessage(productName, paymentUrl || '')
  );

  if (!href) return null;

  return (
    <Button variant="outline" className={className} asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 shrink-0" aria-hidden />
        {label}
      </a>
    </Button>
  );
}
