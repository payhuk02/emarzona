import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MessageCircle } from 'lucide-react';

type PhysicalWhatsAppContactConfigProps = {
  whatsappNumber: string;
  whatsappEnabled: boolean;
  onChange: (patch: { whatsapp_number?: string; whatsapp_enabled?: boolean }) => void;
  disabled?: boolean;
};

export function PhysicalWhatsAppContactConfig({
  whatsappNumber,
  whatsappEnabled,
  onChange,
  disabled = false,
}: PhysicalWhatsAppContactConfigProps) {
  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
          <MessageCircle className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-sm font-semibold">Bouton WhatsApp (fiche produit)</h3>
          <p className="text-xs text-muted-foreground">
            Inclus dans le plan Starter. Saisissez uniquement votre numéro — l&apos;URL{' '}
            <code className="text-[10px]">wa.me</code> est configurée par l&apos;administrateur
            Emarzona.
          </p>
        </div>
        <Switch
          checked={whatsappEnabled}
          onCheckedChange={checked => onChange({ whatsapp_enabled: checked })}
          disabled={disabled}
          aria-label="Activer le bouton WhatsApp"
        />
      </div>

      {whatsappEnabled && (
        <div className="space-y-2">
          <Label htmlFor="physical-whatsapp-number">Numéro WhatsApp</Label>
          <Input
            id="physical-whatsapp-number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="226 70 12 34 56"
            value={whatsappNumber}
            onChange={e => onChange({ whatsapp_number: e.target.value })}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Indicatif pays sans le +. Exemple Burkina Faso : 226 7X XX XX XX
          </p>
        </div>
      )}
    </div>
  );
}
