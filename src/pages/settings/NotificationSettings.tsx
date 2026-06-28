import { AppPageShell } from '@/components/layout/AppPageShell';
import { NotificationSettings as NotificationSettingsContent } from '@/components/settings/NotificationSettings';

const NotificationSettings = () => {
  return (
    <AppPageShell layoutType="settings">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <NotificationSettingsContent />
      </div>
    </AppPageShell>
  );
};

export default NotificationSettings;
