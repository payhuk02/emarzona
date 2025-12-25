import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useSEOAnalysis } from "@/hooks/useSEOAnalysis";
import { SEOOverview } from "@/components/seo/SEOOverview";
import { SEOPagesList } from "@/components/seo/SEOPagesList";
import { Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const SEOAnalyzer = () => {
  const { toast } = useToast();
  const headerRef = useScrollAnimation<HTMLDivElement>();
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Search className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Mon Analyseur SEO
                  </span>
              </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Optimisez le référencement de vos pages et produits
              </p>
            </div>
              <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefetching}
                  className="gap-2 h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <RefreshCw
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefetching ? "animate-spin" : ""}`}
              />
                  <span className="hidden sm:inline text-xs sm:text-sm">Analyser maintenant</span>
                  <span className="sm:hidden text-xs">Analyser</span>
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
          <SEOOverview data={data} isLoading={isLoading} />

        {/* Pages List */}
          <SEOPagesList data={data} isLoading={isLoading} />
        </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SEOAnalyzer;
