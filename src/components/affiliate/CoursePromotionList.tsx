/**
 * Liste des cours promus par l'affilié
 * Affichage détaillé des performances par cours
 * Date : 27 octobre 2025
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

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun cours promu</h3>
            <p className="text-muted-foreground mb-6">
              Commencez à promouvoir des cours pour gagner des commissions
            </p>
            <Button onClick={() => navigate('/marketplace')}>
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
    <div className="space-y-6">
      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Plus de Clics</span>
            </div>
            <p className="text-lg font-bold text-blue-900 truncate">{topByClicks.product_name}</p>
            <p className="text-sm text-blue-700">{topByClicks.total_clicks.toLocaleString()} clics</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-semibold text-orange-900">Plus de Conversions</span>
            </div>
            <p className="text-lg font-bold text-orange-900 truncate">{topByConversions.product_name}</p>
            <p className="text-sm text-orange-700">{topByConversions.total_conversions} ventes</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-900">Plus de Commission</span>
            </div>
            <p className="text-lg font-bold text-green-900 truncate">{topByCommission.product_name}</p>
            <p className="text-sm text-green-700">{topByCommission.total_commission.toLocaleString()} XOF</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des cours */}
      <Card>
        <CardHeader>
          <CardTitle>Tous mes cours promus ({courses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses.map((course) => {
              const conversionRate = course.total_clicks > 0
                ? (course.total_conversions / course.total_clicks) * 100
                : 0;

              return (
                <Card key={course.product_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Info cours */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold mb-1">{course.product_name}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {course.product_price.toLocaleString()} XOF
                              </span>
                              <Badge variant="secondary">
                                {course.commission_type === 'percentage'
                                  ? `${course.commission_rate}% commission`
                                  : `${course.commission_rate} XOF fixe`}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <LinkIcon className="w-4 h-4" />
                                {course.total_links} lien{course.total_links > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Statistiques */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              {course.total_clicks.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <MousePointerClick className="w-3 h-3" />
                              Clics
                            </div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-600">
                              {course.total_conversions}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Conversions
                            </div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-teal-600">
                              {conversionRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Taux
                            </div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {course.total_commission.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              XOF gagnés
                            </div>
                          </div>
                        </div>

                        {/* Barre de progression */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Performance</span>
                            <span className="font-semibold">{conversionRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.min(conversionRate * 10, 100)} className="h-2" />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 lg:min-w-[200px]">
                        <Button
                          onClick={() => navigate(`/affiliate/courses/${course.product_slug}`)}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Gérer mes liens
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/courses/${course.product_slug}`)}
                          className="w-full"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Voir le cours
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

