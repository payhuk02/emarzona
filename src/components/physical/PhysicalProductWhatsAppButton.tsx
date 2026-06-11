import { Button } from '@/components/ui/button';
import { usePublicWhatsAppConfig } from '@/hooks/usePublicWhatsAppConfig';
import { buildWhatsAppClickUrl } from '@/lib/whatsapp/whatsapp-url';
import { MessageCircle } from 'lucide-react';

type PhysicalProductWhatsAppButtonProps = {
  productName: string;
  whatsappNumber?: string | null;
  whatsappEnabled?: boolean | null;
  className?: string;
};

export function PhysicalProductWhatsAppButton({
  productName,
  whatsappNumber,
  whatsappEnabled,
  className,
}: PhysicalProductWhatsAppButtonProps) {
  const { data: config } = usePublicWhatsAppConfig();

  if (!whatsappEnabled || !whatsappNumber?.trim() || config?.enabled === false) {
    return null;
  }

  const href = buildWhatsAppClickUrl(
    config?.click_url_base ?? 'https://wa.me',
    whatsappNumber,
    `Bonjour, je suis intéressé(e) par « ${productName} ».`
  );

  if (!href) return null;

  return (
    <Button variant="outline" className={className} asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-5 w-5 mr-2 text-green-600" aria-hidden />
        Contacter sur WhatsApp
      </a>
    </Button>
  );
}
