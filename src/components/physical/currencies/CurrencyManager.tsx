/**
 * Composant de gestion des devises et taux de change
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DollarSign,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Globe,
} from '@/components/icons';
import {
  useCurrencies,
  useExchangeRates,
  useUpdateExchangeRates,
  Currency,
  ExchangeRate,
} from '@/hooks/physical/useCurrencies';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

export function CurrencyManager() {
  const { toast } = useToast();
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies(false);
  const { data: exchangeRates, isLoading: isLoadingRates } = useExchangeRates();
  const updateRates = useUpdateExchangeRates();

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const currenciesRef = useScrollAnimation<HTMLDivElement>();

  const [isUpdating, setIsUpdating] = useState(false);

  const baseCurrency = currencies?.find((c) => c.is_base_currency);

  // Stats calculées
  const stats = useMemo(() => {
    if (!currencies || !exchangeRates) return { total: 0, active: 0, totalRates: 0, autoUpdate: 0 };
    return {
      total: currencies.length,
      active: currencies.filter(c => c.is_active).length,
      totalRates: exchangeRates.length,
      autoUpdate: exchangeRates.filter(r => r.auto_update).length,
    };
  }, [currencies, exchangeRates]);

  const handleUpdateRates = async () => {
    setIsUpdating(true);
    try {
      await updateRates.mutateAsync();
      toast({
        title: 'Taux mis à jour',
        description: 'Les taux de change ont été mis à jour avec succès',
      });
    } catch (error) {
      // Error handled
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoadingCurrencies || isLoadingRates) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards - Responsive */}
      {currencies && currencies.length > 0 && (
        <div 
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          {[
            { label: 'Total Devises', value: stats.total, icon: Globe, color: 'from-purple-600 to-pink-600' },
            { label: 'Actives', value: stats.active, icon: CheckCircle2, color: 'from-green-600 to-emerald-600' },
            { label: 'Taux de Change', value: stats.totalRates, icon: TrendingUp, color: 'from-blue-600 to-cyan-600' },
            { label: 'Auto-update', value: stats.autoUpdate, icon: RefreshCw, color: 'from-orange-600 to-yellow-600' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                Gestion Multi-devises
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Gérez les devises, taux de change et prix régionaux
              </CardDescription>
            </div>
            <Button 
              onClick={handleUpdateRates} 
              disabled={isUpdating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="sm"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  <span className="text-xs sm:text-sm">Mise à jour...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Actualiser les taux</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="currencies" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger 
                value="currencies"
                className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                Devises
              </TabsTrigger>
              <TabsTrigger 
                value="rates"
                className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                Taux de Change
              </TabsTrigger>
            </TabsList>

            <TabsContent value="currencies" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              {baseCurrency && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        Devise de base: {baseCurrency.name} ({baseCurrency.code})
                      </p>
                      <p className="text-muted-foreground">
                        Toutes les conversions sont calculées à partir de cette devise
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {!currencies || currencies.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center py-8 sm:py-12">
                  <Globe className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                  <p className="text-sm sm:text-base text-muted-foreground">Aucune devise configurée</p>
                </div>
              ) : (
                <>
                  {/* Mobile View - Cards */}
                  <div className="block md:hidden space-y-3 sm:space-y-4">
                    {currencies.map((currency, index) => (
                      <CurrencyCard
                        key={currency.id}
                        currency={currency}
                        isBase={currency.is_base_currency}
                        animationDelay={index * 50}
                      />
                    ))}
                  </div>

                  {/* Desktop View - Table */}
                  <div className="hidden md:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">Code</TableHead>
                          <TableHead className="min-w-[200px]">Nom</TableHead>
                          <TableHead className="min-w-[100px]">Symbole</TableHead>
                          <TableHead className="min-w-[100px]">Décimales</TableHead>
                          <TableHead className="min-w-[150px]">Région</TableHead>
                          <TableHead className="min-w-[100px]">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currencies.map((currency) => (
                          <TableRow key={currency.id}>
                            <TableCell>
                              <Badge 
                                variant={currency.is_base_currency ? 'default' : 'outline'}
                                className={currency.is_base_currency ? 'bg-blue-500 text-xs' : 'text-xs'}
                              >
                                {currency.code}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-sm">{currency.name}</TableCell>
                            <TableCell className="text-sm">{currency.symbol}</TableCell>
                            <TableCell className="text-sm">{currency.decimal_places}</TableCell>
                            <TableCell className="text-sm">
                              {currency.region || currency.country_code || '-'}
                            </TableCell>
                            <TableCell>
                              {currency.is_active ? (
                                <Badge variant="default" className="bg-green-500 text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="rates" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <AlertDescription>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <p className="font-semibold text-blue-600 dark:text-blue-400">Taux de change en temps réel</p>
                    <p className="text-muted-foreground">
                      Les taux sont mis à jour automatiquement
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {!exchangeRates || exchangeRates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center py-8 sm:py-12">
                  <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                  <p className="text-sm sm:text-base text-muted-foreground">Aucun taux de change configuré</p>
                </div>
              ) : (
                <>
                  {/* Mobile View - Cards */}
                  <div className="block md:hidden space-y-3 sm:space-y-4">
                    {exchangeRates.map((rate, index) => (
                      <RateCard
                        key={rate.id}
                        rate={rate}
                        animationDelay={index * 50}
                      />
                    ))}
                  </div>

                  {/* Desktop View - Table */}
                  <div className="hidden md:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">De</TableHead>
                          <TableHead className="min-w-[100px]">Vers</TableHead>
                          <TableHead className="min-w-[150px]">Taux</TableHead>
                          <TableHead className="min-w-[120px]">Source</TableHead>
                          <TableHead className="min-w-[150px]">Dernière mise à jour</TableHead>
                          <TableHead className="min-w-[120px]">Auto-update</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exchangeRates.map((rate) => (
                          <TableRow key={rate.id}>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{rate.from_currency}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{rate.to_currency}</Badge>
                            </TableCell>
                            <TableCell className="font-mono font-semibold text-sm">
                              {rate.rate.toFixed(6)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{rate.source}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(rate.last_updated), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </TableCell>
                            <TableCell>
                              {rate.auto_update ? (
                                <Badge variant="default" className="bg-green-500 text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Oui
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Non</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Currency Card Component for Mobile View
interface CurrencyCardProps {
  currency: Currency;
  isBase: boolean;
  animationDelay?: number;
}

function CurrencyCard({ currency, isBase, animationDelay = 0 }: CurrencyCardProps) {
  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation",
        isBase && "border-l-4 border-l-blue-500"
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1">
                {currency.name}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {currency.symbol} • {currency.region || currency.country_code || 'N/A'}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <Badge 
              variant={isBase ? 'default' : 'outline'}
              className={isBase ? 'bg-blue-500 text-xs' : 'text-xs'}
            >
              {currency.code}
            </Badge>
            {currency.is_active ? (
              <Badge variant="default" className="bg-green-500 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Inactive</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-2 text-xs sm:text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Décimales:</span>
          <span>{currency.decimal_places}</span>
        </div>
        {isBase && (
          <div className="pt-2 border-t">
            <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs">
              Devise de base
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Rate Card Component for Mobile View
interface RateCardProps {
  rate: ExchangeRate;
  animationDelay?: number;
}

function RateCard({ rate, animationDelay = 0 }: RateCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1 font-mono">
                1 {rate.from_currency} = {rate.rate.toFixed(6)} {rate.to_currency}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Source: {rate.source}
              </CardDescription>
            </div>
          </div>
          {rate.auto_update ? (
            <Badge variant="default" className="bg-green-500 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Auto
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">Manuel</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-2 text-xs sm:text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Dernière mise à jour:</span>
          <span>{format(new Date(rate.last_updated), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
        </div>
      </CardContent>
    </Card>
  );
}
