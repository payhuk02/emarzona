import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  ShoppingCart, 
  Star,
  Calendar,
  Clock,
  User,
  Package,
  DollarSign,
  Activity,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Bell,
  MessageSquare,
  Heart,
  Share2
} from '@/components/icons';
import { useState } from "react";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  color?: string;
  badge?: string;
}

export const QuickAction = ({ title, description, icon: Icon, onClick, color = "primary", badge }: QuickActionProps) => {
  return (
    <Card 
      className="cursor-pointer shadow-soft hover:shadow-medium transition-smooth hover-scale group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-${color}/10 group-hover:bg-${color}/20 transition-colors`}>
            <Icon className={`h-5 w-5 text-${color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">{title}</h3>
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
};

interface QuickActionsProps {
  onCreateProduct?: () => void;
  onCreateOrder?: () => void;
  onViewAnalytics?: () => void;
  onManageCustomers?: () => void;
  onViewStore?: () => void;
  onSettings?: () => void;
}

export const QuickActions = ({ 
  onCreateProduct, 
  onCreateOrder, 
  onViewAnalytics, 
  onManageCustomers, 
  onViewStore, 
  onSettings 
}: QuickActionsProps) => {
  const actions = [
    {
      title: "Nouveau Produit",
      description: "Ajouter un produit à votre boutique",
      icon: Package,
      onClick: onCreateProduct || (() => {}),
      color: "green",
      badge: "Populaire"
    },
    {
      title: "Nouvelle Commande",
      description: "Créer une commande manuelle",
      icon: ShoppingCart,
      onClick: onCreateOrder || (() => {}),
      color: "blue"
    },
    {
      title: "Analytics",
      description: "Voir les statistiques détaillées",
      icon: Activity,
      onClick: onViewAnalytics || (() => {}),
      color: "purple"
    },
    {
      title: "Clients",
      description: "Gérer vos clients",
      icon: User,
      onClick: onManageCustomers || (() => {}),
      color: "orange"
    },
    {
      title: "Boutique",
      description: "Paramètres de la boutique",
      icon: Settings,
      onClick: onViewStore || (() => {}),
      color: "gray"
    },
    {
      title: "Paramètres",
      description: "Configuration générale",
      icon: Settings,
      onClick: onSettings || (() => {}),
      color: "indigo"
    }
  ];

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Actions Rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((action, index) => (
            <QuickAction
              key={index}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
              color={action.color}
              badge={action.badge}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface NotificationCardProps {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
    read: boolean;
  }>;
  onMarkAsRead?: (id: string) => void;
  onViewAll?: () => void;
}

export const NotificationCard = ({ notifications, onMarkAsRead, onViewAll }: NotificationCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'warning': return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'error': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayNotifications = expanded ? notifications : notifications.slice(0, 3);

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {notifications.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-xs"
              >
                {expanded ? 'Voir moins' : 'Voir tout'}
              </Button>
            )}
            {onViewAll && (
              <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs">
                Tout voir
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                notification.read ? "bg-muted/30" : "bg-primary/5 hover:bg-primary/10",
                !notification.read && "border-l-2 border-primary"
              )}
              onClick={() => onMarkAsRead?.(notification.id)}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium">{notification.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.timestamp).toLocaleString('fr-FR')}
                  </span>
                  {!notification.read && (
                    <Badge variant="secondary" className="text-xs">
                      Nouveau
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-6">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucune notification</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface GoalProgressProps {
  goals: Array<{
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
    deadline: string;
    color: string;
  }>;
}

export const GoalProgress = ({ goals }: GoalProgressProps) => {
  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Objectifs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = Math.min((goal.current / goal.target) * 100, 100);
            const isCompleted = progress >= 100;
            const isOverdue = new Date(goal.deadline) < new Date() && !isCompleted;

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{goal.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                    </span>
                    <Badge 
                      variant={isCompleted ? "default" : isOverdue ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {Math.round(progress)}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={progress} 
                  className="h-2"
                  style={{ 
                    '--progress-background': `hsl(var(--${goal.color}))` 
                  } as React.CSSProperties & { '--progress-background'?: string }}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Échéance: {new Date(goal.deadline).toLocaleDateString('fr-FR')}</span>
                  {isCompleted && (
                    <Badge variant="default" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Atteint
                    </Badge>
                  )}
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      En retard
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

interface RecentActivityProps {
  activities: Array<{
    id: string;
    type: 'order' | 'product' | 'customer' | 'payment' | 'review';
    title: string;
    description: string;
    timestamp: string;
    status?: string;
    value?: number;
  }>;
  onViewAll?: () => void;
}

export const RecentActivity = ({ activities, onViewAll }: RecentActivityProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'product': return <Package className="h-4 w-4 text-green-500" />;
      case 'customer': return <User className="h-4 w-4 text-purple-500" />;
      case 'payment': return <DollarSign className="h-4 w-4 text-yellow-500" />;
      case 'review': return <Star className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Activité Récente
          </CardTitle>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs">
              Tout voir
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">{activity.title}</h4>
                  {activity.status && (
                    <Badge variant="outline" className="text-xs">
                      {activity.status}
                    </Badge>
                  )}
                  {activity.value && (
                    <span className="text-xs text-muted-foreground">
                      {activity.value.toLocaleString()} FCFA
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center py-6">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucune activité récente</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface DashboardControlsProps {
  onRefresh?: () => void;
  onExport?: () => void;
  onFilter?: () => void;
  onSettings?: () => void;
  lastUpdated?: string;
}

export const DashboardControls = ({ 
  onRefresh, 
  onExport, 
  onFilter, 
  onSettings, 
  lastUpdated 
}: DashboardControlsProps) => {
  return (
    <div className="flex items-center gap-2 p-4 bg-card rounded-lg shadow-soft">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
        <Button variant="outline" size="sm" onClick={onFilter}>
          <Filter className="h-4 w-4 mr-2" />
          Filtrer
        </Button>
        <Button variant="outline" size="sm" onClick={onSettings}>
          <Settings className="h-4 w-4 mr-2" />
          Paramètres
        </Button>
      </div>
      <div className="flex-1" />
      {lastUpdated && (
        <div className="text-xs text-muted-foreground">
          Dernière mise à jour: {new Date(lastUpdated).toLocaleString('fr-FR')}
        </div>
      )}
    </div>
  );
};
