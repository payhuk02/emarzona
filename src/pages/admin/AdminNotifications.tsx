import { useState, useCallback, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bell, Send, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'email' | 'internal' | 'both';
  recipients: string;
  sentAt: string;
  status: 'sent' | 'pending' | 'failed';
}

const AdminNotifications = () => {
  const { toast } = useToast();
  
  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const formRef = useScrollAnimation<HTMLDivElement>();
  const historyRef = useScrollAnimation<HTMLDivElement>();

  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'both' as 'email' | 'internal' | 'both',
    recipients: 'all',
  });

  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Nouvelle fonctionnalité',
      message: 'Découvrez notre nouveau système de parrainage !',
      type: 'both',
      recipients: 'all',
      sentAt: new Date().toISOString(),
      status: 'sent',
    },
    {
      id: '2',
      title: 'Maintenance programmée',
      message: 'La plateforme sera en maintenance ce week-end.',
      type: 'email',
      recipients: 'all',
      sentAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'sent',
    },
  ]);

  useEffect(() => {
    logger.info('Admin Notifications page chargée');
  }, []);

  const handleSendNotification = useCallback(() => {
    if (!notificationForm.title || !notificationForm.message) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive',
      });
      return;
    }

    // Ici, vous pouvez implémenter l'envoi de notifications
    toast({
      title: 'Notification envoyée',
      description: `La notification a été envoyée à ${notificationForm.recipients === 'all' ? 'tous les utilisateurs' : notificationForm.recipients}.`,
    });

    setNotificationForm({
      title: '',
      message: '',
      type: 'both',
      recipients: 'all',
    });
    logger.info('Notification envoyée');
  }, [notificationForm, toast]);

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div ref={headerRef} className="flex items-center justify-between" role="banner">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent" id="admin-notifications-title">
              Notifications
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérer les notifications internes et emails
            </p>
          </div>
          <Bell className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>

        <Tabs defaultValue="send" className="space-y-4">
          <TabsList>
            <TabsTrigger value="send" className="min-h-[44px]">
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </TabsTrigger>
            <TabsTrigger value="history" className="min-h-[44px]">
              <History className="h-4 w-4 mr-2" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle>Envoyer une notification</CardTitle>
                <CardDescription>
                  Envoyer des notifications aux utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Nouvelle fonctionnalité disponible"
                    value={notificationForm.title}
                    onChange={(e) =>
                      setNotificationForm({ ...notificationForm, title: e.target.value })
                    }
                    className="min-h-[44px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Décrivez votre notification..."
                    value={notificationForm.message}
                    onChange={(e) =>
                      setNotificationForm({ ...notificationForm, message: e.target.value })
                    }
                    rows={5}
                    className="min-h-[44px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type de notification</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={notificationForm.type === 'internal' ? 'default' : 'outline'}
                      onClick={() => setNotificationForm({ ...notificationForm, type: 'internal' })}
                      className="min-h-[44px]"
                    >
                      Interne uniquement
                    </Button>
                    <Button
                      variant={notificationForm.type === 'email' ? 'default' : 'outline'}
                      onClick={() => setNotificationForm({ ...notificationForm, type: 'email' })}
                      className="min-h-[44px]"
                    >
                      Email uniquement
                    </Button>
                    <Button
                      variant={notificationForm.type === 'both' ? 'default' : 'outline'}
                      onClick={() => setNotificationForm({ ...notificationForm, type: 'both' })}
                      className="min-h-[44px]"
                    >
                      Interne + Email
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipients">Destinataires</Label>
                  <Input
                    id="recipients"
                    placeholder="Ex: all, admin, sellers"
                    value={notificationForm.recipients}
                    onChange={(e) =>
                      setNotificationForm({ ...notificationForm, recipients: e.target.value })
                    }
                    className="min-h-[44px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Utilisez 'all' pour tous les utilisateurs, ou spécifiez un groupe
                  </p>
                </div>

                <Button onClick={handleSendNotification} className="w-full gap-2 min-h-[44px]">
                  <Send className="h-4 w-4" />
                  Envoyer la notification
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historique des notifications</CardTitle>
                <CardDescription>
                  Toutes les notifications envoyées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{notification.title}</h3>
                          <Badge variant={notification.status === 'sent' ? 'default' : 'secondary'}>
                            {notification.status}
                          </Badge>
                          <Badge variant="outline">{notification.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>Destinataires: {notification.recipients}</span>
                          <span>•</span>
                          <span>{new Date(notification.sentAt).toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      Aucune notification envoyée
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
