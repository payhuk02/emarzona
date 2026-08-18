import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MessageCircle } from 'lucide-react';
import {
  combineWhatsAppNumber,
  DEFAULT_WHATSAPP_COUNTRY_CODE,
  splitWhatsAppNumber,
} from '@/lib/whatsapp/whatsapp-url';

export type ProductWhatsAppContactConfigProps = {
  whatsappNumber: string;
  whatsappEnabled: boolean;
  onChange: (patch: { whatsapp_number?: string; whatsapp_enabled?: boolean }) => void;
  disabled?: boolean;
};

export function ProductWhatsAppContactConfig({
  whatsappNumber,
  whatsappEnabled,
  onChange,
  disabled = false,
}: ProductWhatsAppContactConfigProps) {
  const parts = useMemo(() => splitWhatsAppNumber(whatsappNumber), [whatsappNumber]);

  const emitNumber = (countryCode: string, localNumber: string) => {
    onChange({ whatsapp_number: combineWhatsAppNumber(countryCode, localNumber) });
  };

  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
          <MessageCircle className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-sm font-semibold">Bouton WhatsApp (cartes produits)</h3>
          <p className="text-xs text-muted-foreground">
            Les clients pourront vous écrire depuis la carte produit, avec un message contenant le
            lien « Payer ici en sécurité ». Saisissez l&apos;indicatif sans le +.
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
        <div className="grid grid-cols-1 sm:grid-cols-[7.5rem_1fr] gap-3">
          <div className="space-y-2">
            <Label htmlFor="product-whatsapp-country">Indicatif pays</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                +
              </span>
              <Input
                id="product-whatsapp-country"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-country-code"
                placeholder={DEFAULT_WHATSAPP_COUNTRY_CODE}
                value={parts.countryCode}
                onChange={e => emitNumber(e.target.value.replace(/\D/g, ''), parts.localNumber)}
                disabled={disabled}
                className="pl-7"
                maxLength={4}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Sans le +. Ex. 226</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-whatsapp-number">Numéro WhatsApp</Label>
            <Input
              id="product-whatsapp-number"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="70 12 34 56"
              value={parts.localNumber}
              onChange={e => emitNumber(parts.countryCode, e.target.value)}
              disabled={disabled}
            />
            <p className="text-[11px] text-muted-foreground">
              Lien généré : wa.me/
              {combineWhatsAppNumber(parts.countryCode, parts.localNumber) || '…'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
