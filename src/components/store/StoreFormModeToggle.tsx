/**
 * Toggle pour basculer entre mode simplifié et avancé
 */

import { Settings, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StoreFormModeToggleProps {
  advancedMode: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export const StoreFormModeToggle = ({ 
  advancedMode, 
  onToggle, 
  className = '' 
}: StoreFormModeToggleProps) => {
  return (
    <TooltipProvider>
      <div className={`flex items-center justify-between gap-3 p-3 border rounded-lg bg-muted/30 ${className}`}>
        <div className="flex items-center gap-2">
          {advancedMode ? (
            <Settings className="h-4 w-4 text-primary" />
          ) : (
            <Zap className="h-4 w-4 text-primary" />
          )}
          <div>
            <Label htmlFor="mode-toggle" className="text-sm font-medium cursor-pointer">
              {advancedMode ? 'Mode Avancé' : 'Mode Simplifié'}
            </Label>
            <p className="text-xs text-muted-foreground">
              {advancedMode 
                ? 'Accès à tous les paramètres de personnalisation' 
                : 'Paramètres essentiels uniquement'}
            </p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Switch
                id="mode-toggle"
                checked={advancedMode}
                onCheckedChange={onToggle}
                aria-label={advancedMode ? 'Désactiver le mode avancé' : 'Activer le mode avancé'}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              {advancedMode 
                ? 'Basculer vers le mode simplifié' 
                : 'Basculer vers le mode avancé pour plus d\'options'}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};







