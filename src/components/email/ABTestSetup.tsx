/**
 * Composant pour configurer un test A/B
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmailTemplates } from '@/hooks/useEmail';
import { useCreateEmailABTest } from '@/hooks/email/useEmailABTests';
import type { ABTestVariant, CreateABTestPayload } from '@/lib/email/email-ab-test-service';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ABTestSetupProps {
  campaignId: string;
  onSuccess?: () => void;
}

export const ABTestSetup = ({ campaignId, onSuccess }: ABTestSetupProps) => {
  const [variantAName, setVariantAName] = useState('Variante A');
  const [variantASubject, setVariantASubject] = useState('');
  const [variantATemplateId, setVariantATemplateId] = useState('');
  const [variantAPercentage, setVariantAPercentage] = useState(50);

  const [variantBName, setVariantBName] = useState('Variante B');
  const [variantBSubject, setVariantBSubject] = useState('');
  const [variantBTemplateId, setVariantBTemplateId] = useState('');
  const [variantBPercentage, setVariantBPercentage] = useState(50);

  const [testDurationHours, setTestDurationHours] = useState(24);
  const [minRecipients, setMinRecipients] = useState(100);

  const { data: templates } = useEmailTemplates({ category: 'marketing' });
  const createABTest = useCreateEmailABTest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Valider que les pourcentages totalisent 100
    if (variantAPercentage + variantBPercentage !== 100) {
      alert('Les pourcentages doivent totaliser 100%');
      return;
    }

    const variantA: ABTestVariant = {
      name: variantAName,
      subject: variantASubject,
      template_id: variantATemplateId || undefined,
      send_percentage: variantAPercentage,
    };

    const variantB: ABTestVariant = {
      name: variantBName,
      subject: variantBSubject,
      template_id: variantBTemplateId || undefined,
      send_percentage: variantBPercentage,
    };

    const payload: CreateABTestPayload = {
      campaign_id: campaignId,
      variant_a: variantA,
      variant_b: variantB,
      test_duration_hours: testDurationHours,
      min_recipients_per_variant: minRecipients,
    };

    try {
      await createABTest.mutateAsync(payload);
      onSuccess?.();
    } catch (error) {
      logger.error('Failed to create AB test', { error });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration du Test A/B</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Variante A */}
          <div className="space-y-4 border rounded-lg p-4">
            <Label className="text-lg font-semibold">Variante A</Label>
            <div>
              <Label htmlFor="variantA-name">Nom de la variante</Label>
              <Input
                id="variantA-name"
                value={variantAName}
                onChange={(e) => setVariantAName(e.target.value)}
                placeholder="ex: Sujet avec emoji"
              />
            </div>
            <div>
              <Label htmlFor="variantA-subject">Sujet *</Label>
              <Input
                id="variantA-subject"
                value={variantASubject}
                onChange={(e) => setVariantASubject(e.target.value)}
                placeholder="Sujet de l'email variante A"
                required
              />
            </div>
            <div>
              <Label htmlFor="variantA-template">Template (optionnel)</Label>
              <Select value={variantATemplateId} onValueChange={setVariantATemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="variantA-percentage">
                Pourcentage d&apos;envoi: {variantAPercentage}%
              </Label>
              <input
                id="variantA-percentage"
                type="range"
                min="0"
                max="100"
                value={variantAPercentage}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setVariantAPercentage(value);
                  setVariantBPercentage(100 - value);
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Variante B */}
          <div className="space-y-4 border rounded-lg p-4">
            <Label className="text-lg font-semibold">Variante B</Label>
            <div>
              <Label htmlFor="variantB-name">Nom de la variante</Label>
              <Input
                id="variantB-name"
                value={variantBName}
                onChange={(e) => setVariantBName(e.target.value)}
                placeholder="ex: Sujet sans emoji"
              />
            </div>
            <div>
              <Label htmlFor="variantB-subject">Sujet *</Label>
              <Input
                id="variantB-subject"
                value={variantBSubject}
                onChange={(e) => setVariantBSubject(e.target.value)}
                placeholder="Sujet de l'email variante B"
                required
              />
            </div>
            <div>
              <Label htmlFor="variantB-template">Template (optionnel)</Label>
              <Select value={variantBTemplateId} onValueChange={setVariantBTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="variantB-percentage">
                Pourcentage d&apos;envoi: {variantBPercentage}%
              </Label>
              <input
                id="variantB-percentage"
                type="range"
                min="0"
                max="100"
                value={variantBPercentage}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setVariantBPercentage(value);
                  setVariantAPercentage(100 - value);
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Configuration du test */}
          <div className="space-y-4 border rounded-lg p-4">
            <Label className="text-lg font-semibold">Configuration du Test</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-duration">Durée du test (heures)</Label>
                <Input
                  id="test-duration"
                  type="number"
                  value={testDurationHours}
                  onChange={(e) => setTestDurationHours(parseInt(e.target.value) || 24)}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="min-recipients">Minimum par variante</Label>
                <Input
                  id="min-recipients"
                  type="number"
                  value={minRecipients}
                  onChange={(e) => setMinRecipients(parseInt(e.target.value) || 100)}
                  min="10"
                />
              </div>
            </div>
          </div>

          {/* Avertissement */}
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note :</strong> Les pourcentages doivent totaliser 100%. 
              Le gagnant sera déterminé automatiquement après la période de test 
              basé sur les taux d&apos;ouverture, de clic et les revenus générés.
            </p>
          </div>

          <Button
            type="submit"
            disabled={createABTest.isPending || !variantASubject || !variantBSubject}
            className="w-full"
          >
            {createABTest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer le test A/B
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

