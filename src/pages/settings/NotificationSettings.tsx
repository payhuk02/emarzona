import { NotificationSettings as NotificationSettingsContent } from '@/components/settings/NotificationSettings';

const NotificationSettings = () => {
  return (
    <>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <NotificationSettingsContent />
      </div>
    </>
  );
};

export default NotificationSettings;
