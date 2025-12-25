import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertTriangle, TrendingUp } from '@/components/icons';
import { useAverageSEOScore } from "@/hooks/useSEOAnalysis";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface SEOOverviewProps {
  data: any;
  isLoading: boolean;
}

export const SEOOverview = ({ data, isLoading }: SEOOverviewProps) => {
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const averageScore = useAverageSEOScore(data);

  // On calcule simplement le nombre de points à améliorer ici :
  const improvements = data?.filter((p: any) => p.score < 80) || [];
  const optimizedCount = data?.filter((p: any) => p.score > 80).length || 0;

  return (
    <div
      ref={statsRef}
      className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
      {/* Score moyen */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Score SEO moyen</p>
              </div>
          {isLoading ? (
                <Skeleton className="h-6 sm:h-8 w-20 mb-2" />
          ) : (
            <>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    {averageScore}%
                  </p>
                  <Progress value={averageScore} className="h-2" />
            </>
          )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Améliorations trouvées */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/5">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Points à améliorer</p>
              </div>
          {isLoading ? (
                <Skeleton className="h-6 sm:h-8 w-16" />
          ) : (
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  {improvements.length}
                </p>
          )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pages bien optimisées */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Pages optimisées</p>
              </div>
          {isLoading ? (
                <Skeleton className="h-6 sm:h-8 w-16" />
          ) : (
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {optimizedCount}
            </p>
          )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
