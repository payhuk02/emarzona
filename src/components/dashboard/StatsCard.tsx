import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

const StatsCardComponent = ({ title, value, description, icon: Icon, trend, className }: StatsCardProps) => {
  return (
    <Card className={`shadow-soft hover:shadow-medium transition-smooth hover-scale ${className}`} style={{ willChange: 'transform' }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4 md:p-6">
        <CardTitle className="text-xs sm:text-sm font-medium truncate">{title}</CardTitle>
        <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="text-lg sm:text-xl md:text-2xl font-bold animate-fade-in break-words">{value}</div>
        {description && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            <Badge variant={trend.value >= 0 ? "default" : "destructive"} className="text-[10px] sm:text-xs">
              {trend.value >= 0 ? "+" : ""}{trend.value}%
            </Badge>
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const StatsCard = React.memo(StatsCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.description === nextProps.description &&
    prevProps.trend?.value === nextProps.trend?.value &&
    prevProps.trend?.label === nextProps.trend?.label &&
    prevProps.className === nextProps.className
  );
});

StatsCard.displayName = 'StatsCard';
