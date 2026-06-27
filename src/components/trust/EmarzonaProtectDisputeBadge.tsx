/**
 * Badge litige Emarzona Protect (admin).
 */

import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmarzonaProtectDisputeBadgeProps {
  isProtect?: boolean;
  reasonCode?: string | null;
  className?: string;
}

export function EmarzonaProtectDisputeBadge({
  isProtect,
  reasonCode,
  className,
}: EmarzonaProtectDisputeBadgeProps) {
  if (!isProtect) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 flex items-center gap-1 w-fit',
        className
      )}
    >
      <ShieldCheck className="h-3 w-3" aria-hidden />
      Protect
      {reasonCode ? <span className="text-[10px] opacity-80">({reasonCode})</span> : null}
    </Badge>
  );
}
