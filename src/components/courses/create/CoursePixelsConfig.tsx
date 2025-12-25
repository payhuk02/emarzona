/**
 * Configuration des pixels et tracking pour cours
 * Intégration Google Analytics, Facebook Pixel, TikTok, etc.
 * Date : 27 octobre 2025
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  Eye,
  MousePointerClick,
  Users,
  TrendingUp,
  Info,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export interface CoursePixelsData {
  tracking_enabled: boolean;
  google_analytics_id?: string;
  facebook_pixel_id?: string;
  google_tag_manager_id?: string;
  tiktok_pixel_id?: string;
  track_video_events: boolean;
  track_lesson_completion: boolean;
  track_quiz_attempts: boolean;
  track_certificate_downloads: boolean;
}

interface CoursePixelsConfigProps {
  data: CoursePixelsData;
  onChange: (data: CoursePixelsData) => void;
}

export const CoursePixelsConfig = ({ data, onChange }: CoursePixelsConfigProps) => {
  const handleChange = (field: keyof CoursePixelsData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const isGAValid = data.google_analytics_id?.match(/^(G|UA)-[A-Z0-9-]+$/);
  const isFBValid = data.facebook_pixel_id?.match(/^\d{15,16}$/);
  const isGTMValid = data.google_tag_manager_id?.match(/^GTM-[A-Z0-9]+$/);
  const isTikTokValid = data.tiktok_pixel_id?.match(/^[A-Z0-9]{20}$/);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <div>
              <CardTitle>Pixels & Tracking Avancé</CardTitle>
              <CardDescription>
                Configurez vos outils d'analytics pour suivre les performances de votre cours
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Switch
                checked={data.tracking_enabled}
                onCheckedChange={(checked) => handleChange('tracking_enabled', checked)}
                id="tracking-enabled"
              />
              <div>
                <Label htmlFor="tracking-enabled" className="text-base font-semibold cursor-pointer">
                  Activer le tracking avancé
                </Label>
                <p className="text-sm text-muted-foreground">
                  Suivez les vues, inscriptions, vidéos, quizzes et plus
                </p>
              </div>
            </div>
            {data.tracking_enabled && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Actif
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Événements à tracker */}
      {data.tracking_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Événements à Suivre</CardTitle>
            <CardDescription>
              Choisissez les événements que vous souhaitez tracker automatiquement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Switch
                  checked={data.track_video_events}
                  onCheckedChange={(checked) => handleChange('track_video_events', checked)}
                  id="track-video"
                />
                <div className="flex-1">
                  <Label htmlFor="track-video" className="cursor-pointer font-medium">
                    Événements Vidéo
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Play, pause, 25%, 50%, 75%, 100% visionnage
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Switch
                  checked={data.track_lesson_completion}
                  onCheckedChange={(checked) => handleChange('track_lesson_completion', checked)}
                  id="track-lesson"
                />
                <div className="flex-1">
                  <Label htmlFor="track-lesson" className="cursor-pointer font-medium">
                    Complétion Leçons
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quand un étudiant termine une leçon
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Switch
                  checked={data.track_quiz_attempts}
                  onCheckedChange={(checked) => handleChange('track_quiz_attempts', checked)}
                  id="track-quiz"
                />
                <div className="flex-1">
                  <Label htmlFor="track-quiz" className="cursor-pointer font-medium">
                    Tentatives Quiz
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Démarrage, soumission, score obtenu
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Switch
                  checked={data.track_certificate_downloads}
                  onCheckedChange={(checked) => handleChange('track_certificate_downloads', checked)}
                  id="track-cert"
                />
                <div className="flex-1">
                  <Label htmlFor="track-cert" className="cursor-pointer font-medium">
                    Téléchargements Certificats
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quand un certificat est généré/téléchargé
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pixels externes */}
      {data.tracking_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Intégrations Pixels</CardTitle>
            <CardDescription>
              Connectez vos outils d'analytics externe (optionnel)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {/* Google Analytics */}
              <AccordionItem value="google-analytics">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                    <span>Google Analytics</span>
                    {isGAValid && <Badge variant="secondary" className="text-xs">Configuré</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-3">
                  <div>
                    <Label htmlFor="ga-id">Measurement ID (GA4) ou Tracking ID (UA)</Label>
                    <Input
                      id="ga-id"
                      placeholder="G-XXXXXXXXXX ou UA-XXXXXXXXX-X"
                      value={data.google_analytics_id || ''}
                      onChange={(e) => handleChange('google_analytics_id', e.target.value)}
                      className={isGAValid ? 'border-green-500' : ''}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Trouvez votre ID dans <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                        Google Analytics <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                  {isGAValid && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        ID valide ! Les événements seront envoyés à Google Analytics.
                      </AlertDescription>
                    </Alert>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Facebook Pixel */}
              <AccordionItem value="facebook-pixel">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <span>Facebook Pixel</span>
                    {isFBValid && <Badge variant="secondary" className="text-xs">Configuré</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-3">
                  <div>
                    <Label htmlFor="fb-id">Pixel ID</Label>
                    <Input
                      id="fb-id"
                      placeholder="123456789012345"
                      value={data.facebook_pixel_id || ''}
                      onChange={(e) => handleChange('facebook_pixel_id', e.target.value)}
                      className={isFBValid ? 'border-green-500' : ''}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ID à 15-16 chiffres trouvé dans <a href="https://business.facebook.com/events_manager2" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                        Events Manager <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                  {isFBValid && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Pixel ID valide ! Tracking Facebook activé.
                      </AlertDescription>
                    </Alert>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Google Tag Manager */}
              <AccordionItem value="google-tag-manager">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="w-5 h-5 text-green-600" />
                    <span>Google Tag Manager</span>
                    {isGTMValid && <Badge variant="secondary" className="text-xs">Configuré</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-3">
                  <div>
                    <Label htmlFor="gtm-id">Container ID</Label>
                    <Input
                      id="gtm-id"
                      placeholder="GTM-XXXXXXX"
                      value={data.google_tag_manager_id || ''}
                      onChange={(e) => handleChange('google_tag_manager_id', e.target.value)}
                      className={isGTMValid ? 'border-green-500' : ''}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format : GTM-XXXXXXX (trouvé dans <a href="https://tagmanager.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                        Tag Manager <ExternalLink className="w-3 h-3" />
                      </a>)
                    </p>
                  </div>
                  {isGTMValid && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        GTM configuré ! Vous pouvez gérer vos tags depuis Tag Manager.
                      </AlertDescription>
                    </Alert>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* TikTok Pixel */}
              <AccordionItem value="tiktok-pixel">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-pink-600" />
                    <span>TikTok Pixel</span>
                    {isTikTokValid && <Badge variant="secondary" className="text-xs">Configuré</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-3">
                  <div>
                    <Label htmlFor="tiktok-id">Pixel ID</Label>
                    <Input
                      id="tiktok-id"
                      placeholder="ABC123DEF456GHI789JK"
                      value={data.tiktok_pixel_id || ''}
                      onChange={(e) => handleChange('tiktok_pixel_id', e.target.value)}
                      className={isTikTokValid ? 'border-green-500' : ''}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ID alphanumérique de 20 caractères (TikTok Events Manager)
                    </p>
                  </div>
                  {isTikTokValid && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        TikTok Pixel configuré avec succès !
                      </AlertDescription>
                    </Alert>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Note :</strong> Les pixels externes sont optionnels. Le tracking natif Emarzona fonctionne sans configuration supplémentaire.
        </AlertDescription>
      </Alert>
    </div>
  );
};

