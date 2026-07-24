/**
 * Header sidebar : logo + nom de la boutique sélectionnée, menu pour changer / créer.
 */
import { useEffect, useState } from 'react';
import { Check, ChevronDown, Plus, Store as StoreIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useStoreContext, type Store } from '@/contexts/StoreContext';
import { STORE_CREATE_PATH } from '@/lib/store/store-create-path';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function StoreAvatar({
  store,
  className,
}: {
  store: Pick<Store, 'name' | 'logo_url'> | null;
  className?: string;
}) {
  const name = store?.name?.trim() || 'B';
  const initial = name.charAt(0).toUpperCase();
  const logoUrl = store?.logo_url?.trim() || '';
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [logoUrl]);

  if (logoUrl && !imgFailed) {
    return (
      <div className={cn('overflow-hidden rounded-lg bg-muted shrink-0', className)}>
        <img
          src={logoUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-gradient-to-br from-sky-600 to-indigo-600 text-white font-bold shrink-0 shadow-sm',
        className
      )}
      aria-hidden
    >
      {initial}
    </div>
  );
}

type SidebarStoreSwitcherProps = {
  isCollapsed: boolean;
};

export function SidebarStoreSwitcher({ isCollapsed }: SidebarStoreSwitcherProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { stores, selectedStore, selectedStoreId, switchStore, canCreateStore, loading } =
    useStoreContext();

  const displayStore =
    selectedStore ??
    (stores.length > 0 ? (stores.find(s => s.id === selectedStoreId) ?? stores[0]) : null);

  const handleSelectStore = (store: Store) => {
    if (store.id === selectedStoreId) return;
    switchStore(store.id);
    navigate('/dashboard');
    toast({
      title: t('sidebar.chrome.storeChangedTitle'),
      description: t('sidebar.chrome.storeChangedDescription', { name: store.name }),
    });
  };

  if (loading && stores.length === 0) {
    return (
      <div
        className={cn('flex items-center gap-2 min-w-0', isCollapsed ? 'justify-center' : 'flex-1')}
      >
        <div
          className={cn(
            'animate-pulse rounded-lg bg-muted',
            isCollapsed ? 'h-8 w-8' : 'h-9 w-9 sm:h-10 sm:w-10'
          )}
        />
        {!isCollapsed && <div className="h-4 flex-1 max-w-[7rem] animate-pulse rounded bg-muted" />}
      </div>
    );
  }

  if (!displayStore) {
    return (
      <button
        type="button"
        onClick={() => navigate(STORE_CREATE_PATH)}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-dashed border-border px-2 py-1.5 text-left transition-colors hover:bg-accent hover:text-foreground min-w-0',
          isCollapsed ? 'justify-center p-1.5' : 'flex-1'
        )}
        aria-label={t('sidebar.chrome.createStore')}
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0',
            isCollapsed ? 'h-8 w-8' : 'h-9 w-9'
          )}
        >
          <StoreIcon className="h-4 w-4" />
        </div>
        {!isCollapsed && (
          <span className="truncate text-sm font-medium">{t('sidebar.chrome.createStore')}</span>
        )}
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 rounded-lg outline-none transition-colors hover:bg-accent/80 focus-visible:ring-2 focus-visible:ring-ring min-w-0',
            isCollapsed ? 'justify-center p-0.5' : 'flex-1 px-1.5 py-1'
          )}
          aria-label={t('sidebar.chrome.storeSwitcherAria', {
            name: displayStore.name,
            defaultValue: `Boutique active : {{name}}. Changer de boutique`,
          })}
        >
          <StoreAvatar
            store={displayStore}
            className={cn(
              isCollapsed ? 'h-8 w-8 text-sm' : 'h-9 w-9 sm:h-10 sm:w-10 text-sm sm:text-base'
            )}
          />
          {!isCollapsed && (
            <>
              <span className="flex-1 truncate text-left text-sm font-semibold tracking-tight text-foreground">
                {displayStore.name}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" className="w-64 z-[80]">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          {t('sidebar.chrome.myStores', { count: stores.length })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {stores.map(store => (
          <DropdownMenuItem
            key={store.id}
            onSelect={() => handleSelectStore(store)}
            className="gap-2 cursor-pointer"
          >
            <StoreAvatar store={store} className="h-7 w-7 text-xs" />
            <span className="flex-1 truncate">{store.name}</span>
            {selectedStoreId === store.id && <Check className="h-4 w-4 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
        {canCreateStore() && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => navigate(STORE_CREATE_PATH)}
              className="gap-2 cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-border shrink-0">
                <Plus className="h-3.5 w-3.5" />
              </div>
              <span>{t('sidebar.chrome.createStore')}</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
