import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { useAverageSEOScore } from "@/hooks/useSEOAnalysis";

interface SEOOverviewProps {
  data: any;
  isLoading: boolean;
}

export const SEOOverview = ({ data, isLoading }: SEOOverviewProps) => {
  const averageScore = useAverageSEOScore(data);

  // On calcule simplement le nombre de points à améliorer ici :
  const improvements = data?.filter((p: any) => p.score < 80) || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Score moyen */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" />
            Score SEO moyen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
          ) : (
            <>
              <p className="text-2xl font-bold">{averageScore}%</p>
              <Progress value={averageScore} className="mt-2" />
            </>
          )}
        </CardContent>
      </Card>

      {/* Améliorations trouvées */}
      <Card className="animate-fade-in delay-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Points à améliorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          ) : (
            <p className="text-xl font-bold">{improvements.length}</p>
          )}
        </CardContent>
      </Card>

      {/* Pages bien optimisées */}
      <Card className="animate-fade-in delay-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Pages optimisées
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
          ) : (
            <p className="text-xl font-bold">
              {data?.filter((p: any) => p.score > 80).length || 0}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
