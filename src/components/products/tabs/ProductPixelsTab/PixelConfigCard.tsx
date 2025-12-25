import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PixelEvent {
  id: string;
  label: string;
  enabled: boolean;
}

interface PixelConfigCardProps {
  platform: {
    id: string;
    name: string;
    icon: LucideIcon;
    color: string;
    description: string;
    events: string[];
  };
  pixelId: string;
  isEnabled: boolean;
  isActive: boolean;
  events: Record<string, boolean>;
  onPixelIdChange: (value: string) => void;
  onEnabledChange: (checked: boolean) => void;
  onEventChange: (eventId: string, checked: boolean) => void;
}

/**
 * Carte de configuration pour un pixel de tracking spécifique
 * Gère l'ID, l'activation et les événements à tracker
 */
const PixelConfigCardComponent = ({
  platform,
  pixelId,
  isEnabled,
  isActive,
  events,
  onPixelIdChange,
  onEnabledChange,
  onEventChange,
}: PixelConfigCardProps) => {
  const Icon = platform.icon;
  
  const colorClasses = {
    blue: "bg-blue-500/20 text-blue-400",
    green: "bg-green-500/20 text-green-400",
    red: "bg-red-500/20 text-red-400",
    pink: "bg-pink-500/20 text-pink-400",
  };

  return (
    <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm" style={{ willChange: 'transform' }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", colorClasses[platform.color as keyof typeof colorClasses])}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-white">{platform.name}</CardTitle>
              <CardDescription className="text-gray-400">
                {platform.description}
              </CardDescription>
            </div>
          </div>
          {isActive && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Actif
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label 
            htmlFor={`${platform.id}_pixel_id`}
            className="text-sm font-medium text-white flex items-center gap-2"
          >
            {platform.name} Pixel ID
          </Label>
          <Input
            id={`${platform.id}_pixel_id`}
            value={pixelId}
            onChange={(e) => onPixelIdChange(e.target.value)}
            placeholder={
              platform.id === 'facebook' ? '123456789012345' :
              platform.id === 'google' ? 'GA-XXXXXXXXX' :
              platform.id === 'tiktok' ? 'CXXXXXXXXXXXXXXX' :
              '123456789012345'
            }
            aria-label={`ID du pixel ${platform.name}`}
            aria-describedby={`${platform.id}_pixel_help`}
            className={cn(
              "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400",
              "focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
            )}
          />
          <p id={`${platform.id}_pixel_help`} className="text-xs text-gray-400">
            ID unique de votre pixel {platform.name}
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
          <div className="space-y-0.5">
            <Label 
              htmlFor={`${platform.id}_enabled`}
              className="text-sm font-medium text-white"
            >
              Activer le pixel
            </Label>
            <p className="text-sm text-gray-400">Tracking automatique des événements</p>
          </div>
          <Switch
            id={`${platform.id}_enabled`}
            checked={isEnabled}
            onCheckedChange={onEnabledChange}
            aria-label={`Activer ou désactiver le pixel ${platform.name}`}
            className="touch-manipulation"
          />
        </div>

        {isEnabled && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Événements à tracker</Label>
            <div className="space-y-2">
              {platform.events.map((event) => {
                const eventKey = `${platform.id}_${event.toLowerCase().replace(/\s+/g, '_')}`;
                return (
                  <div 
                    key={event} 
                    className="flex items-center justify-between p-3 bg-gray-700/20 rounded-lg border border-gray-600 hover:bg-gray-700/30 transition-colors"
                  >
                    <Label 
                      htmlFor={eventKey}
                      className="text-sm text-gray-300 cursor-pointer touch-manipulation"
                    >
                      {event}
                    </Label>
                    <Switch
                      id={eventKey}
                      checked={events[eventKey] || false}
                      onCheckedChange={(checked) => onEventChange(eventKey, checked)}
                      aria-label={`Activer le tracking de l'événement ${event}`}
                      className="touch-manipulation"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const PixelConfigCard = React.memo(PixelConfigCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.platform.id === nextProps.platform.id &&
    prevProps.pixelId === nextProps.pixelId &&
    prevProps.isEnabled === nextProps.isEnabled &&
    prevProps.isActive === nextProps.isActive &&
    JSON.stringify(prevProps.events) === JSON.stringify(nextProps.events) &&
    prevProps.onPixelIdChange === nextProps.onPixelIdChange &&
    prevProps.onEnabledChange === nextProps.onEnabledChange &&
    prevProps.onEventChange === nextProps.onEventChange
  );
});

PixelConfigCard.displayName = 'PixelConfigCard';

