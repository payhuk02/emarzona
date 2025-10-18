import { Store } from "@/hooks/use-store";
import { Users } from "lucide-react";

interface StoreHeaderProps {
  store: Store & {
    logo_url?: string;
    banner_url?: string;
    active_clients?: number;
  };
}

const StoreHeader = ({ store }: StoreHeaderProps) => {
  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-48 md:h-64 w-full overflow-hidden bg-gradient-hero">
        {store.banner_url ? (
          <img
            src={store.banner_url}
            alt={store.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center">
              <Users className="h-16 w-16 text-primary/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Bannière de la boutique</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Store Info Card */}
      <div className="bg-card border-b shadow-soft overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 py-4 sm:py-6">
            {/* Logo */}
            <div className="flex-shrink-0 -mt-12 sm:-mt-16">
              {store.logo_url ? (
                <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full overflow-hidden border-3 sm:border-4 border-background shadow-large bg-card">
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full border-3 sm:border-4 border-background shadow-large bg-muted flex items-center justify-center">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Store Details */}
            <div className="flex-1 min-w-0 w-full">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 truncate">{store.name}</h1>
              {store.description && (
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-2 line-clamp-2 break-words">
                  {store.description}
                </p>
              )}
              {store.active_clients !== undefined && store.active_clients > 0 && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full inline-flex max-w-fit">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">{store.active_clients} clients actifs</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreHeader;
