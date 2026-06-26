/**
 * @deprecated Utiliser `PreOrdersManager` depuis `./preorders/PreOrdersManager`.
 * Conservé pour compatibilité exports — données réelles Supabase (plus de mock).
 */
import { PreOrdersManager } from './preorders/PreOrdersManager';

export interface PreOrderManagerProps {
  productId?: string;
  storeId?: string;
  className?: string;
}

export function PreOrderManager({ storeId, className }: PreOrderManagerProps) {
  return (
    <div className={className}>
      <PreOrdersManager storeId={storeId} />
    </div>
  );
}
