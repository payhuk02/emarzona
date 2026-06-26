/**
 * @deprecated Utiliser `BackordersManager` depuis `./backorders/BackordersManager`.
 * Conservé pour compatibilité exports — données réelles Supabase (plus de mock).
 */
import { BackordersManager } from './backorders/BackordersManager';

export interface BackorderManagerProps {
  productId?: string;
  storeId?: string;
  className?: string;
}

export function BackorderManager({ storeId, className }: BackorderManagerProps) {
  return (
    <div className={className}>
      <BackordersManager storeId={storeId} />
    </div>
  );
}
