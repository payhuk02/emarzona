/**
 * Dialogue détail campagne : rapport, métriques, test A/B
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { CampaignReport } from './CampaignReport';
import { CampaignMetrics } from './CampaignMetrics';
import { ABTestSetup } from './ABTestSetup';
import { ABTestResults } from './ABTestResults';
import { useEmailABTestsByCampaign } from '@/hooks/email/useEmailABTests';
import type { EmailCampaign } from '@/lib/email/email-campaign-service';

interface CampaignDetailDialogProps {
  campaign: EmailCampaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'report' | 'metrics' | 'abtest';
}

export const CampaignDetailDialog = ({
  campaign,
  open,
  onOpenChange,
  defaultTab = 'report',
}: CampaignDetailDialogProps) => {
  const campaignId = campaign?.id ?? '';
  const { data: abTests, isLoading: abLoading } = useEmailABTestsByCampaign(campaignId);
  const abTest = abTests?.[0];

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign.name}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} key={`${campaign.id}-${defaultTab}`}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="report">Rapport</TabsTrigger>
            <TabsTrigger value="metrics">Métriques</TabsTrigger>
            <TabsTrigger value="abtest">Test A/B</TabsTrigger>
          </TabsList>
          <TabsContent value="report" className="mt-4">
            <CampaignReport campaign={campaign} />
          </TabsContent>
          <TabsContent value="metrics" className="mt-4">
            <CampaignMetrics campaign={campaign} />
          </TabsContent>
          <TabsContent value="abtest" className="mt-4">
            {abLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : abTest ? (
              <ABTestResults abTestId={abTest.id} />
            ) : (
              <ABTestSetup campaignId={campaign.id} subjectHint={campaign.name} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
