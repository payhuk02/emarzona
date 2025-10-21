import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  Download, 
  RefreshCw, 
  FileText, 
  BarChart3, 
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAnalyticsReports } from '@/hooks/useProductAnalytics';
import { useToast } from '@/hooks/use-toast';

interface ReportsSectionProps {
  productId: string;
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({ productId }) => {
  const { toast } = useToast();
  const { reports, loading, generateReport } = useAnalyticsReports(productId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv' | 'xlsx' | 'json'>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  const getDateRange = useCallback((period: string) => {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            startDate: customStartDate.toISOString().split('T')[0],
            endDate: customEndDate.toISOString().split('T')[0]
          };
        }
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }, [customStartDate, customEndDate]);

  const handleGenerateReport = useCallback(async (reportType: 'daily' | 'weekly' | 'monthly' | 'custom') => {
    try {
      setIsGenerating(true);
      
      const { startDate, endDate } = getDateRange(selectedPeriod);
      
      const report = await generateReport(
        reportType,
        selectedFormat,
        startDate,
        endDate,
        includeCharts
      );

      toast({
        title: "Rapport généré",
        description: `Le rapport ${reportType} a été généré avec succès.`,
      });

      // Simuler le téléchargement
      setTimeout(() => {
        toast({
          title: "Téléchargement disponible",
          description: "Votre rapport est prêt à être téléchargé.",
        });
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedPeriod, selectedFormat, includeCharts, getDateRange, generateReport, toast]);

  const getReportStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'generating':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getReportStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'generating':
        return 'Génération...';
      case 'failed':
        return 'Échec';
      default:
        return 'En attente';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cartes de génération de rapports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <CalendarIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-white">Rapport quotidien</CardTitle>
                <CardDescription className="text-gray-400">
                  Résumé des performances du jour
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => handleGenerateReport('daily')}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Générer
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <BarChart3 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-white">Rapport mensuel</CardTitle>
                <CardDescription className="text-gray-400">
                  Analyse complète du mois
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => handleGenerateReport('monthly')}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Générer
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <FileText className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-white">Export CSV</CardTitle>
                <CardDescription className="text-gray-400">
                  Données brutes pour analyse approfondie
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => handleGenerateReport('custom')}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Options d'export avancées */}
      <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Settings className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-white">Options d'export avancées</CardTitle>
              <CardDescription className="text-gray-400">
                Personnalisez vos exports selon vos besoins
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white">Période d'export</Label>
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="7d" className="text-white hover:bg-gray-700">7 derniers jours</SelectItem>
                  <SelectItem value="30d" className="text-white hover:bg-gray-700">30 derniers jours</SelectItem>
                  <SelectItem value="90d" className="text-white hover:bg-gray-700">90 derniers jours</SelectItem>
                  <SelectItem value="custom" className="text-white hover:bg-gray-700">Période personnalisée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white">Format d'export</Label>
              <Select value={selectedFormat} onValueChange={(value: any) => setSelectedFormat(value)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="pdf" className="text-white hover:bg-gray-700">PDF</SelectItem>
                  <SelectItem value="csv" className="text-white hover:bg-gray-700">CSV</SelectItem>
                  <SelectItem value="xlsx" className="text-white hover:bg-gray-700">Excel</SelectItem>
                  <SelectItem value="json" className="text-white hover:bg-gray-700">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sélecteurs de dates personnalisées */}
          {selectedPeriod === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Date de début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                        !customStartDate && "text-gray-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      initialFocus
                      className="bg-gray-800 text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Date de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                        !customEndDate && "text-gray-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      initialFocus
                      className="bg-gray-800 text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-white">Inclure les graphiques</Label>
              </div>
              <p className="text-xs text-gray-400">Inclure les graphiques dans l'export PDF</p>
            </div>
            <Switch
              checked={includeCharts}
              onCheckedChange={setIncludeCharts}
            />
          </div>
        </CardContent>
      </Card>

      {/* Historique des rapports */}
      {reports && reports.length > 0 && (
        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <FileText className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-white">Rapports générés</CardTitle>
                <CardDescription className="text-gray-400">
                  Historique de vos rapports et exports
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.slice(0, 5).map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="flex items-center gap-3">
                    {getReportStatusIcon(report.status)}
                    <div>
                      <p className="text-sm font-medium text-white">
                        Rapport {report.report_type} - {report.report_format.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(report.start_date), "dd/MM/yyyy", { locale: fr })} - {format(new Date(report.end_date), "dd/MM/yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {getReportStatusText(report.status)}
                    </span>
                    {report.status === 'completed' && report.file_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300"
                        onClick={() => window.open(report.file_url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
