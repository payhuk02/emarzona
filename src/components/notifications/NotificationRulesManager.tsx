/**
 * Gestionnaire des règles de notification intelligentes
 * Interface pour créer, modifier et gérer les règles de notification
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  Settings,
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  MoreVertical,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  NotificationRule,
  NotificationTrigger,
  NotificationCondition,
  NotificationTemplate,
  NotificationChannel
} from '@/lib/notifications/smart-notification-engine';
import { useToast } from '@/hooks/use-toast';

interface NotificationRulesManagerProps {
  className?: string;
}

export const NotificationRulesManager: React.FC<NotificationRulesManagerProps> = ({ className }) => {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Charger les règles
  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsedRules = (data || []).map(rule => ({
        ...rule,
        trigger: JSON.parse(rule.trigger),
        conditions: JSON.parse(rule.conditions),
        template: JSON.parse(rule.template),
        channels: JSON.parse(rule.channels)
      })) as NotificationRule[];

      setRules(parsedRules);
    } catch (error) {
      logger.error('Error loading notification rules', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les règles de notification',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (ruleData: Partial<NotificationRule>) => {
    try {
      const newRule = {
        ...ruleData,
        id: crypto.randomUUID(),
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notification_rules')
        .insert({
          ...newRule,
          trigger: JSON.stringify(newRule.trigger),
          conditions: JSON.stringify(newRule.conditions),
          template: JSON.stringify(newRule.template),
          channels: JSON.stringify(newRule.channels)
        });

      if (error) throw error;

      toast({
        title: 'Règle créée',
        description: 'La règle de notification a été créée avec succès'
      });

      setIsCreateDialogOpen(false);
      loadRules();
    } catch (error) {
      logger.error('Error creating notification rule', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la règle de notification',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateRule = async (ruleId: string, updates: Partial<NotificationRule>) => {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .update({
          ...updates,
          trigger: updates.trigger ? JSON.stringify(updates.trigger) : undefined,
          conditions: updates.conditions ? JSON.stringify(updates.conditions) : undefined,
          template: updates.template ? JSON.stringify(updates.template) : undefined,
          channels: updates.channels ? JSON.stringify(updates.channels) : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: 'Règle mise à jour',
        description: 'La règle de notification a été mise à jour avec succès'
      });

      setIsEditDialogOpen(false);
      setSelectedRule(null);
      loadRules();
    } catch (error) {
      logger.error('Error updating notification rule', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la règle de notification',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: 'Règle supprimée',
        description: 'La règle de notification a été supprimée avec succès'
      });

      loadRules();
    } catch (error) {
      logger.error('Error deleting notification rule', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la règle de notification',
        variant: 'destructive'
      });
    }
  };

  const toggleRuleStatus = async (ruleId: string, enabled: boolean) => {
    await handleUpdateRule(ruleId, { enabled });
  };

  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'push':
        return <Smartphone className="h-4 w-4" />;
      case 'in_app':
        return <Bell className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Règles de Notification</h2>
          <p className="text-muted-foreground">
            Gérez vos règles de notification intelligente pour engager vos clients
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Règle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une Règle de Notification</DialogTitle>
              <DialogDescription>
                Configurez une nouvelle règle pour déclencher des notifications intelligentes
              </DialogDescription>
            </DialogHeader>
            <RuleForm onSubmit={handleCreateRule} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{rules.length}</div>
            <p className="text-sm text-muted-foreground">Règles totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{rules.filter(r => r.enabled).length}</div>
            <p className="text-sm text-muted-foreground">Règles actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {rules.filter(r => r.priority === 'urgent' || r.priority === 'high').length}
            </div>
            <p className="text-sm text-muted-foreground">Règles prioritaires</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {rules.reduce((sum, r) => sum + r.channels.length, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Canaux configurés</p>
          </CardContent>
        </Card>
      </div>

      {/* Table des règles */}
      <Card>
        <CardHeader>
          <CardTitle>Règles de Notification</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune règle de notification configurée</p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer votre première règle
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Canaux</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-muted-foreground">{rule.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.trigger.type === 'event' && 'Événement'}
                        {rule.trigger.type === 'schedule' && 'Programmé'}
                        {rule.trigger.type === 'prediction' && 'Prédiction'}
                        {rule.trigger.type === 'behavior' && 'Comportement'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(rule.priority)}>
                        {rule.priority === 'urgent' && 'Urgent'}
                        {rule.priority === 'high' && 'Élevé'}
                        {rule.priority === 'medium' && 'Moyen'}
                        {rule.priority === 'low' && 'Faible'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {rule.channels.map((channel) => (
                          <div key={channel} className="text-muted-foreground">
                            {getChannelIcon(channel)}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {rule.enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">
                          {rule.enabled ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </SelectTrigger>
                        <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                          <SelectItem value="view" onSelect
                            onClick={() => {
                              setSelectedRule(rule);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </SelectItem>
                          <SelectItem value="view" onSelect
                            onClick={() => toggleRuleStatus(rule.id, !rule.enabled)}
                          >
                            {rule.enabled ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Activer
                              </>
                            )}
                          </SelectItem>
                          <SelectItem value="export" onSelect
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(rule, null, 2))}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copier JSON
                          </SelectItem>
                          <SelectItem value="delete" onSelect
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la Règle de Notification</DialogTitle>
            <DialogDescription>
              Modifiez les paramètres de votre règle de notification
            </DialogDescription>
          </DialogHeader>
          {selectedRule && (
            <RuleForm
              initialData={selectedRule}
              onSubmit={(data) => handleUpdateRule(selectedRule.id, data)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Composant formulaire pour créer/modifier une règle
interface RuleFormProps {
  initialData?: Partial<NotificationRule>;
  onSubmit: (data: Partial<NotificationRule>) => void;
}

const RuleForm: React.FC<RuleFormProps> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<NotificationRule>>({
    name: '',
    description: '',
    trigger: { type: 'event' },
    conditions: [],
    template: {
      title: '',
      message: '',
      variables: {}
    },
    priority: 'medium',
    channels: ['in_app'],
    cooldown: 60,
    enabled: true,
    ...initialData
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations de base */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nom de la règle</Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Notification d'achat réussi"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Décrivez le but de cette règle..."
          />
        </div>
      </div>

      {/* Trigger */}
      <div className="space-y-4">
        <Label>Type de déclencheur</Label>
        <Select
          value={formData.trigger?.type || 'event'}
          onValueChange={(value: any) => setFormData(prev => ({
            ...prev,
            trigger: { ...prev.trigger, type: value }
          }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="event">Événement</SelectItem>
            <SelectItem value="schedule">Programmé</SelectItem>
            <SelectItem value="prediction">Prédiction</SelectItem>
            <SelectItem value="behavior">Comportement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Template */}
      <div className="space-y-4">
        <Label>Template de notification</Label>
        <div>
          <Label htmlFor="title">Titre</Label>
          <Input
            id="title"
            value={formData.template?.title || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              template: { ...prev.template!, title: e.target.value }
            }))}
            placeholder="Titre de la notification"
            required
          />
        </div>

        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={formData.template?.message || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              template: { ...prev.template!, message: e.target.value }
            }))}
            placeholder="Contenu de la notification"
            required
          />
        </div>
      </div>

      {/* Paramètres */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Priorité</Label>
          <Select
            value={formData.priority || 'medium'}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Faible</SelectItem>
              <SelectItem value="medium">Moyen</SelectItem>
              <SelectItem value="high">Élevé</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="cooldown">Cooldown (minutes)</Label>
          <Input
            id="cooldown"
            type="number"
            value={formData.cooldown || 60}
            onChange={(e) => setFormData(prev => ({ ...prev, cooldown: parseInt(e.target.value) }))}
          />
        </div>
      </div>

      {/* Canaux */}
      <div>
        <Label>Canaux de notification</Label>
        <div className="flex gap-2 mt-2">
          {(['email', 'push', 'in_app', 'sms'] as NotificationChannel[]).map((channel) => (
            <Button
              key={channel}
              type="button"
              variant={formData.channels?.includes(channel) ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  channels: prev.channels?.includes(channel)
                    ? prev.channels.filter(c => c !== channel)
                    : [...(prev.channels || []), channel]
                }));
              }}
            >
              {getChannelIcon(channel)}
              <span className="ml-2 capitalize">{channel}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="submit">
          {initialData ? 'Mettre à jour' : 'Créer'} la règle
        </Button>
      </div>
    </form>
  );
};

// Fonction utilitaire pour les icônes de canal
const getChannelIcon = (channel: NotificationChannel) => {
  switch (channel) {
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'push':
      return <Smartphone className="h-4 w-4" />;
    case 'in_app':
      return <Bell className="h-4 w-4" />;
    case 'sms':
      return <MessageSquare className="h-4 w-4" />;
  }
};