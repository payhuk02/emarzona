/**
 * Composant de conversion de devises
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  useCurrencies,
  useConvertCurrency,
  useExchangeRates,
} from '@/hooks/physical/useCurrencies';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export function CurrencyConverter() {
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies(true);
  const { data: exchangeRates, isLoading: isLoadingRates } = useExchangeRates();
  const convertMutation = useConvertCurrency();

  // Refs for animations
  const converterRef = useScrollAnimation<HTMLDivElement>();

  const [amount, setAmount] = useState(100);
  const [fromCurrency, setFromCurrency] = useState('XOF');
  const [toCurrency, setToCurrency] = useState('USD');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  const currentRate = exchangeRates?.find(
    (r) => r.from_currency === fromCurrency && r.to_currency === toCurrency
  );

  const handleConvert = async () => {
    try {
      const result = await convertMutation.mutateAsync({
        amount,
        fromCurrency,
        toCurrency,
      });
      setConvertedAmount(result);
    } catch (error) {
      setConvertedAmount(null);
    }
  };

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setConvertedAmount(null);
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
    <Card 
      ref={converterRef}
      className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
          Convertisseur de Devises
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Convertissez instantanément entre différentes devises
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">De</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies?.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Vers</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies?.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">Montant</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="0"
            step="0.01"
            className="h-9 sm:h-10 text-xs sm:text-sm"
          />
        </div>

        {currentRate && (
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <AlertDescription>
              <div className="space-y-1 text-xs sm:text-sm">
                <p>
                  Taux actuel: <span className="font-mono font-semibold">1 {fromCurrency} = {currentRate.rate.toFixed(6)} {toCurrency}</span>
                </p>
                <p className="text-muted-foreground">
                  Source: {currentRate.source}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleConvert} 
            disabled={convertMutation.isPending}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            {convertMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-xs sm:text-sm">Conversion...</span>
              </>
            ) : (
              <>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                <span className="text-xs sm:text-sm">Convertir</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleSwapCurrencies}
            className="h-9 sm:h-10 w-9 sm:w-10"
            aria-label="Inverser les devises"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {convertedAmount !== null && (
          <div className="p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Résultat</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">
                  {convertedAmount.toFixed(2)} {toCurrency}
                </p>
              </div>
              <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-green-500 opacity-50" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}






