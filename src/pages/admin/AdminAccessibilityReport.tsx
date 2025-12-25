/**
 * Page Admin - Rapport d'Accessibilité
 * Affiche le rapport d'accessibilité de la page actuelle
 */

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  validatePageAccessibility,
  checkElementContrast,
  type AccessibilityReport 
} from '@/lib/accessibility-enhanced';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Download } from 'lucide-react';

export default function AdminAccessibilityReport() {
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const generateReport = () => {
    setLoading(true);
    setCurrentUrl(window.location.href);
    
    // Attendre un peu pour que la page soit complètement chargée
    setTimeout(() => {
      const newReport = validatePageAccessibility();
      setReport(newReport);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    generateReport();
  }, []);

  const exportReport = () => {
    if (!report) return;

    const reportText = `
RAPPORT D'ACCESSIBILITÉ
=======================
URL: ${currentUrl}
Date: ${new Date().toLocaleString()}
Score: ${report.score}/100

VIOLATIONS (${report.violations.length})
${report.violations.map(v => `- [${v.severity.toUpperCase()}] ${v.type}: ${v.message} (${v.element})`).join('\n')}

AVERTISSEMENTS (${report.warnings.length})
${report.warnings.map(w => `- ${w.type}: ${w.message} (${w.element})`).join('\n')}

RECOMMANDATIONS
${report.recommendations.map(r => `- ${r}`).join('\n')}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-500">Bon</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500">Moyen</Badge>;
    return <Badge className="bg-red-500">Faible</Badge>;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rapport d'Accessibilité</h1>
            <p className="text-muted-foreground">
              Analyse WCAG 2.1 de la page actuelle
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={loading} className="min-h-[44px]">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analyse...' : 'Rafraîchir'}
            </Button>
            {report && (
              <Button variant="outline" onClick={exportReport} className="min-h-[44px]">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            )}
          </div>
        </div>

        {currentUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Page analysée</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground break-all">{currentUrl}</p>
            </CardContent>
          </Card>
        )}

        {report && (
          <>
            {/* Score global */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Score d'Accessibilité</span>
                  {getScoreBadge(report.score)}
                </CardTitle>
                <CardDescription>
                  Basé sur {report.violations.length + report.warnings.length} vérifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Score global</span>
                    <span className={`text-3xl font-bold ${getScoreColor(report.score)}`}>
                      {report.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        report.score >= 90 ? 'bg-green-500' :
                        report.score >= 70 ? 'bg-yellow-500' :
                        report.score >= 50 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${report.score}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Violations */}
            {report.violations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Violations ({report.violations.length})
                  </CardTitle>
                  <CardDescription>
                    Problèmes critiques nécessitant une correction immédiate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {report.violations.map((violation, index) => (
                    <Alert
                      key={index}
                      variant={violation.severity === 'error' ? 'destructive' : 'default'}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>
                          {violation.severity === 'error' ? 'Erreur' : 'Avertissement'}: {violation.type}
                        </span>
                        <Badge variant="outline">{violation.element}</Badge>
                      </AlertTitle>
                      <AlertDescription>{violation.message}</AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Avertissements */}
            {report.warnings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Avertissements ({report.warnings.length})
                  </CardTitle>
                  <CardDescription>
                    Problèmes mineurs à corriger pour améliorer l'accessibilité
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {report.warnings.map((warning, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{warning.type}</span>
                        <Badge variant="outline">{warning.element}</Badge>
                      </AlertTitle>
                      <AlertDescription>{warning.message}</AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recommandations */}
            {report.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Recommandations
                  </CardTitle>
                  <CardDescription>
                    Actions suggérées pour améliorer le score d'accessibilité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Aucun problème */}
            {report.violations.length === 0 && report.warnings.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Excellent !</h3>
                  <p className="text-muted-foreground">
                    Aucune violation ou avertissement détecté. La page respecte les standards WCAG 2.1 AA.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

