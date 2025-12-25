/**
 * Liste des cours promus par l'affilié
 * Affichage détaillé des performances par cours
 * Date : 27 octobre 2025
 * Updated: 2025-02-02 - Responsive design with Mes Templates style
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  MousePointerClick,
  Users,
  DollarSign,
  Link as LinkIcon,
  ExternalLink,
  Award,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface PromotedCourse {
  product_id: string;
  product_name: string;
  product_slug: string;
  product_price: number;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  total_links: number;
  total_clicks: number;
  total_conversions: number;
  total_commission: number;
}

interface CoursePromotionListProps {
  courses: PromotedCourse[];
}

export const CoursePromotionList = ({ courses }: CoursePromotionListProps) => {
  const navigate = useNavigate();
  const topPerformersRef = useScrollAnimation<HTMLDivElement>();
  const listRef = useScrollAnimation<HTMLDivElement>();

  if (courses.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 sm:py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-4 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
              <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Aucun cours promu</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Commencez à promouvoir des cours pour gagner des commissions
            </p>
            <Button onClick={() => navigate('/marketplace')} className="h-9 sm:h-10">
              Découvrir les cours
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Trouver les meilleurs performers
  const topByClicks = [...courses].sort((a, b) => b.total_clicks - a.total_clicks)[0];
  const topByConversions = [...courses].sort((a, b) => b.total_conversions - a.total_conversions)[0];
  const topByCommission = [...courses].sort((a, b) => b.total_commission - a.total_commission)[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Performers */}
      <div
        ref={topPerformersRef}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-blue-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <span className="text-xs sm:text-sm font-semibold">Plus de Clics</span>
            </div>
            <p className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent truncate">{topByClicks.product_name}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{topByClicks.total_clicks.toLocaleString()} clics</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-orange-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <span className="text-xs sm:text-sm font-semibold">Plus de Conversions</span>
            </div>
            <p className="text-base sm:text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent truncate">{topByConversions.product_name}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{topByConversions.total_conversions} ventes</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-green-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <span className="text-xs sm:text-sm font-semibold">Plus de Commission</span>
            </div>
            <p className="text-base sm:text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent truncate">{topByCommission.product_name}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{topByCommission.total_commission.toLocaleString()} XOF</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des cours */}
      <Card
        ref={listRef}
        className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Tous mes cours promus ({courses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {courses.map((course, index) => {
              const conversionRate = course.total_clicks > 0
                ? (course.total_conversions / course.total_clicks) * 100
                : 0;

              return (
                <Card
                  key={course.product_id}
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] animate-in fade-in slide-in-from-left-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Info cours */}
                      <div className="flex-1">
                        <div className="mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-bold mb-2">{course.product_name}</h3>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                              {course.product_price.toLocaleString()} XOF
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {course.commission_type === 'percentage'
                                ? `${course.commission_rate}% commission`
                                : `${course.commission_rate} XOF fixe`}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                              {course.total_links} lien{course.total_links > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Statistiques */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
                            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                              {course.total_clicks.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MousePointerClick className="h-3 w-3" />
                              Clics
                            </div>
                          </div>
                          <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
                            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                              {course.total_conversions}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Users className="h-3 w-3" />
                              Conversions
                            </div>
                          </div>
                          <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
                            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                              {conversionRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Taux
                            </div>
                          </div>
                          <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
                            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              {course.total_commission.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              XOF gagnés
                            </div>
                          </div>
                        </div>

                        {/* Barre de progression */}
                        <div className="mb-3 sm:mb-4">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Performance</span>
                            <span className="font-semibold">{conversionRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.min(conversionRate * 10, 100)} className="h-2" />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[200px]">
                        <Button
                          onClick={() => navigate(`/affiliate/courses/${course.product_slug}`)}
                          className="w-full sm:w-auto lg:w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 h-9 sm:h-10"
                        >
                          <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          <span className="text-xs sm:text-sm">Gérer mes liens</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/courses/${course.product_slug}`)}
                          className="w-full sm:w-auto lg:w-full h-9 sm:h-10"
                        >
                          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          <span className="text-xs sm:text-sm">Voir le cours</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

