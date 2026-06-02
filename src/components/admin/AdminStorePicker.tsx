import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

type StoreOption = { id: string; name: string };

interface AdminStorePickerProps {
  value: string | null;
  onChange: (storeId: string) => void;
  className?: string;
}

export function AdminStorePicker({ value, onChange, className }: AdminStorePickerProps) {
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStores = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .order('name', { ascending: true })
        .limit(200);

      if (error) throw error;
      setStores((data ?? []) as StoreOption[]);
    } catch (err) {
      logger.error('AdminStorePicker: chargement boutiques', { err });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  useEffect(() => {
    if (!value && stores[0]) {
      onChange(stores[0].id);
    }
  }, [stores, value, onChange]);

  if (loading) {
    return <Skeleton className={`h-10 w-full max-w-sm ${className ?? ''}`} />;
  }

  if (stores.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune boutique sur la plateforme.</p>;
  }

  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger
        className={`max-w-sm ${className ?? ''}`}
        aria-label="Sélectionner une boutique"
      >
        <SelectValue placeholder="Choisir une boutique" />
      </SelectTrigger>
      <SelectContent>
        {stores.map(store => (
          <SelectItem key={store.id} value={store.id}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
