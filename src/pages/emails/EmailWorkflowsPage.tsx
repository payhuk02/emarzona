/**
 * Page principale pour les workflows email
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EmailWorkflowManager,
  EmailWorkflowBuilder,
  EmailDashboardLayout,
} from '@/components/email';
import { useStore } from '@/hooks/useStore';
import { Workflow } from 'lucide-react';
import type { EmailWorkflow } from '@/lib/email/email-workflow-service';

export const EmailWorkflowsPage = () => {
  const { t } = useTranslation();
  const { store } = useStore();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<EmailWorkflow | null>(null);

  return (
    <EmailDashboardLayout
      title={t('emails.workflows.title')}
      subtitle={t('emails.workflows.subtitle')}
      icon={Workflow}
      noStoreMessage={t('emails.workflows.noStore')}
      infoAlert={{
        title: t('emails.workflows.alert.title'),
        description: t('emails.workflows.alert.description'),
      }}
    >
      {store ? (
        <>
          <EmailWorkflowManager
            storeId={store.id}
            onCreateWorkflow={() => {
              setEditingWorkflow(null);
              setBuilderOpen(true);
            }}
            onEditWorkflow={workflow => {
              setEditingWorkflow(workflow);
              setBuilderOpen(true);
            }}
          />
          <EmailWorkflowBuilder
            open={builderOpen}
            onOpenChange={setBuilderOpen}
            storeId={store.id}
            workflow={editingWorkflow}
            onSuccess={() => {
              setBuilderOpen(false);
              setEditingWorkflow(null);
            }}
          />
        </>
      ) : null}
    </EmailDashboardLayout>
  );
};
