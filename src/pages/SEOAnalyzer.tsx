import { Button } from "@/components/ui/button";
import { useSEOAnalysis } from "@/hooks/useSEOAnalysis";
import { SEOOverview } from "@/components/seo/SEOOverview";
import { SEOPagesList } from "@/components/seo/SEOPagesList";
import { Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const SEOAnalyzer = () => {
  const { toast } = useToast();
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    },
  });

  const { data, isLoading, refetch, isRefetching } = useSEOAnalysis(
    session?.user?.id
  );

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: "Analyse terminée",
      description: "Vos pages ont été réanalysées avec succès.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Container global responsive */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title & description */}
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 flex-wrap">
                <Search className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Mon Analyseur SEO
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Optimisez le référencement de vos pages et produits
              </p>
            </div>

            {/* Bouton d’analyse */}
            <Button
              onClick={handleRefresh}
              disabled={isRefetching}
              variant="outline"
              className="gap-2 self-start sm:self-auto w-full sm:w-auto"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
              />
              <span className="text-sm sm:text-base">Analyser maintenant</span>
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="mb-8">
          <SEOOverview data={data} isLoading={isLoading} />
        </div>

        {/* Pages List */}
        <div className="overflow-x-auto">
          <SEOPagesList data={data} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default SEOAnalyzer;
