import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CalendarClock, History, Megaphone, Send } from 'lucide-react';
import { BroadcastStatsCards } from '@/components/admin/notifications/BroadcastStatsCards';
import { BroadcastComposer } from '@/components/admin/notifications/BroadcastComposer';
import { BroadcastHistoryPanel } from '@/components/admin/notifications/BroadcastHistoryPanel';
import { ScheduledBroadcastsPanel } from '@/components/admin/notifications/ScheduledBroadcastsPanel';
import { PopupsManagementPanel } from '@/components/admin/notifications/PopupsManagementPanel';
import type { BroadcastFormState } from '@/components/admin/notifications/broadcast-constants';

const AdminNotifications = () => {
  const { can } = useCurrentAdminPermissions();
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const [activeTab, setActiveTab] = useState('send');
  const [composerKey, setComposerKey] = useState(0);
  const [composerSeed, setComposerSeed] = useState<BroadcastFormState | undefined>();

  useEffect(() => {
    logger.info('Admin Notifications page chargée');
  }, []);

  const handleDuplicate = (form: BroadcastFormState) => {
    setComposerSeed({ ...form, scheduleEnabled: false, scheduledAt: '' });
    setComposerKey(k => k + 1);
    setActiveTab('send');
  };

  if (!can('emails.manage')) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <p className="text-muted-foreground">
            Vous n&apos;avez pas la permission d&apos;envoyer des messages.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <div ref={headerRef} className="flex items-center justify-between" role="banner">
          <div>
            <h1
              className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
              id="admin-notifications-title"
            >
              Messages &amp; notifications
            </h1>
            <p className="text-muted-foreground mt-2">
              Centre de communication : envois massifs, programmation, popups et historique
            </p>
          </div>
          <Bell className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>

        <BroadcastStatsCards />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="send" className="min-h-[44px]">
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="min-h-[44px]">
              <CalendarClock className="h-4 w-4 mr-2" />
              Programmés
            </TabsTrigger>
            <TabsTrigger value="popups" className="min-h-[44px]">
              <Megaphone className="h-4 w-4 mr-2" />
              Popups
            </TabsTrigger>
            <TabsTrigger value="history" className="min-h-[44px]">
              <History className="h-4 w-4 mr-2" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <BroadcastComposer
              key={composerKey}
              initialForm={composerSeed}
              onSent={() => setComposerSeed(undefined)}
            />
          </TabsContent>

          <TabsContent value="scheduled">
            <ScheduledBroadcastsPanel />
          </TabsContent>

          <TabsContent value="popups">
            <PopupsManagementPanel />
          </TabsContent>

          <TabsContent value="history">
            <BroadcastHistoryPanel onDuplicate={handleDuplicate} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
