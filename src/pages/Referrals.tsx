import { useState, useEffect, useMemo } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  Copy,
  Check,
  ArrowLeft,
  Share2,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  CheckCircle2,
  Download,
  RefreshCw,
  BarChart3,
  Calendar,
  Mail,
  ExternalLink,
  Sparkles,
  Gift,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useReferral } from "@/hooks/useReferral";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useDebounce } from "@/hooks/useDebounce";
import { logger } from "@/lib/logger";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Referrals = () => {
  const {
    data,
    referrals,
    commissions,
    loading,
    referralsLoading,
    commissionsLoading,
    refetch,
    refetchReferrals,
    refetchCommissions,
  } = useReferral();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const headerRef = useScrollAnimation();
  const statsRef = useScrollAnimation();

  // Charger les données une seule fois quand on change d'onglet
  const [hasLoadedReferrals, setHasLoadedReferrals] = useState(false);
  const [hasLoadedCommissions, setHasLoadedCommissions] = useState(false);

  useEffect(() => {
    // Charger les données seulement si l'onglet est actif ET que les données n'ont pas déjà été chargées
    if (activeTab === "referrals" && !hasLoadedReferrals && !referralsLoading) {
      refetchReferrals();
      setHasLoadedReferrals(true);
    } else if (activeTab === "commissions" && !hasLoadedCommissions && !commissionsLoading) {
      refetchCommissions();
      setHasLoadedCommissions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Seulement dépendre de activeTab pour éviter les boucles

  const copyToClipboard = async () => {
    if (!data?.referralLink) return;

    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      toast({
        title: "Lien copié !",
        description: "Le lien de parrainage a été copié dans votre presse-papier.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error("Error copying referral link", { error });
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive",
      });
    }
  };

  const shareOnSocial = (platform: string) => {
    if (!data?.referralLink) return;

    const text = encodeURIComponent(
      "Rejoignez Emarzona via mon lien de parrainage et profitez de tous les avantages !"
    );
    const url = encodeURIComponent(data.referralLink);

    const shareUrls: { [key: string]: string } = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      email: `mailto:?subject=Rejoignez Emarzona&body=${text}%20${url}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  const exportToCSV = (type: "referrals" | "commissions") => {
    try {
      let csvContent = "";
      let filename = "";

      if (type === "referrals") {
        filename = `filleuls_${new Date().toISOString().split("T")[0]}.csv`;
        csvContent = "Email,Date d'inscription,Statut,Commandes,Total dépensé\n";
        referrals.forEach((ref) => {
          csvContent += `"${ref.user?.email || ""}","${new Date(ref.created_at).toLocaleDateString("fr-FR")}","${ref.status}","${ref.total_orders || 0}","${ref.total_spent || 0}"\n`;
        });
      } else {
        filename = `commissions_${new Date().toISOString().split("T")[0]}.csv`;
        csvContent = "Date,Montant commission,Montant total,Statut,Commande,Filleul\n";
        commissions.forEach((comm) => {
          csvContent += `"${new Date(comm.created_at).toLocaleDateString("fr-FR")}","${comm.commission_amount}","${comm.total_amount}","${comm.status}","${comm.order?.order_number || ""}","${comm.referred?.email || ""}"\n`;
        });
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export réussi",
        description: `Le fichier ${filename} a été téléchargé.`,
      });
    } catch (error) {
      logger.error("Error exporting CSV", { error });
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données.",
        variant: "destructive",
      });
    }
  };

  const filteredReferrals = useMemo(() => {
    if (!debouncedSearch) return referrals;
    return referrals.filter(
      (ref) =>
        ref.user?.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        ref.user?.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [referrals, debouncedSearch]);

  const filteredCommissions = useMemo(() => {
    if (!debouncedSearch) return commissions;
    return commissions.filter(
      (comm) =>
        comm.referred?.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        comm.order?.order_number?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [commissions, debouncedSearch]);

  const handleRefresh = () => {
    refetch();
    if (activeTab === "referrals") refetchReferrals();
    if (activeTab === "commissions") refetchCommissions();
    toast({
      title: "Actualisé",
      description: "Les données ont été mises à jour.",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
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
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Programme de parrainage
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Invitez vos amis et gagnez {data?.commissionRate || 2}% de commission sur chaque vente
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading || referralsLoading || commissionsLoading}
                  className="h-9 sm:h-10 transition-all hover:scale-105"
                >
                  {(loading || referralsLoading || commissionsLoading) ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline text-xs sm:text-sm">Actualiser</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="h-9 sm:h-10"
                >
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline text-xs sm:text-sm">Retour</span>
                  <span className="sm:hidden">Retour</span>
                </Button>
              </div>
            </div>

            {/* Stats Cards - Responsive */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {/* Total Filleuls */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Filleuls</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {loading ? "..." : data?.totalReferrals || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {data?.activeReferrals || 0} actifs
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gains Totaux */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Gains Totaux</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {loading ? "..." : formatCurrency(data?.totalEarnings || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">XOF</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* En Attente */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">En Attente</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                        {loading ? "..." : formatCurrency(data?.pendingEarnings || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">XOF</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/5">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payés */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Payés</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {loading ? "..." : formatCurrency(data?.paidEarnings || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">XOF</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto overflow-x-auto">
            <TabsTrigger
              value="overview"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
              <span className="sm:hidden">Vue</span>
            </TabsTrigger>
            <TabsTrigger
              value="referrals"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Mes Filleuls</span>
              <span className="sm:hidden">Filleuls</span>
              {referrals.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] sm:text-xs">
                  {referrals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="commissions"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Commissions</span>
              <span className="sm:hidden">Commis.</span>
              {commissions.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] sm:text-xs">
                  {commissions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="how-it-works"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Comment ça marche</span>
              <span className="sm:hidden">Guide</span>
            </TabsTrigger>
          </TabsList>

              {/* Vue d'ensemble */}
              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                {/* Lien de parrainage */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                      <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      Votre lien de parrainage
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm lg:text-base">
                      Partagez ce lien unique et gagnez {data?.commissionRate || 2}% de commission sur
                      chaque vente réalisée par vos filleuls.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 relative">
                        <Input
                          type="text"
                          readOnly
                          value={
                            loading
                              ? "Chargement..."
                              : data?.referralLink && data.referralLink.includes('?ref=')
                                ? data.referralLink
                                : data?.referralLink || "Génération du code..."
                          }
                          placeholder="Génération du code de parrainage..."
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-muted rounded-lg font-mono text-xs sm:text-sm border border-border focus:outline-none focus:border-purple-500 transition-colors"
                        />
                        {data?.referralCode && (
                          <p className="text-xs text-muted-foreground mt-1.5 sm:mt-2">
                            Votre code : <span className="font-mono font-semibold">{data.referralCode}</span>
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={copyToClipboard}
                        disabled={loading || !data?.referralLink}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white h-9 sm:h-10 lg:h-11"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            <span className="text-xs sm:text-sm">Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            <span className="text-xs sm:text-sm">Copier le lien</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Boutons de partage social */}
                    <div className="flex flex-wrap gap-2 pt-3 sm:pt-4 border-t border-border/50">
                      <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 w-full sm:w-auto mb-1 sm:mb-0">
                        <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Partager sur :
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareOnSocial("facebook")}
                        className="gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm"
                      >
                        <span className="text-blue-600 font-bold">f</span>
                        <span className="hidden sm:inline">Facebook</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareOnSocial("twitter")}
                        className="gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm"
                      >
                        <span className="text-blue-400 font-bold">𝕏</span>
                        <span className="hidden sm:inline">Twitter</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareOnSocial("whatsapp")}
                        className="gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm"
                      >
                        <span className="text-green-600 font-semibold">WhatsApp</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareOnSocial("email")}
                        className="gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm"
                      >
                        <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Email</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mes Filleuls */}
              <TabsContent value="referrals" className="space-y-4 sm:space-y-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-purple-500" />
                          Mes Filleuls
                        </CardTitle>
                        <CardDescription>
                          Liste de tous vos filleuls et leurs statistiques
                        </CardDescription>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                          <Input
                            placeholder="Rechercher un filleul..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-9 h-9 sm:h-10 text-xs sm:text-sm"
                          />
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-muted"
                              onClick={() => setSearchQuery("")}
                              aria-label="Effacer la recherche"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToCSV("referrals")}
                          className="gap-2 h-9 sm:h-10"
                        >
                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline text-xs sm:text-sm">Export CSV</span>
                          <span className="sm:hidden text-xs">Export</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {referralsLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16" />
                        ))}
                      </div>
                    ) : filteredReferrals.length === 0 ? (
                      <div className="text-center py-12 sm:py-16 text-muted-foreground">
                        <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
                          <Users className="h-12 w-12 sm:h-16 sm:w-16 opacity-20" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
                          {referrals.length === 0
                            ? "Aucun filleul pour le moment"
                            : "Aucun résultat trouvé"}
                        </h3>
                        {referrals.length === 0 && (
                          <p className="text-sm sm:text-base mt-2 max-w-md mx-auto">
                            Partagez votre lien de parrainage pour inviter vos amis !
                          </p>
                        )}
                      </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs sm:text-sm">Filleul</TableHead>
                              <TableHead className="text-xs sm:text-sm">Date d'inscription</TableHead>
                              <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                              <TableHead className="text-right text-xs sm:text-sm">Commandes</TableHead>
                              <TableHead className="text-right text-xs sm:text-sm">Total dépensé</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredReferrals.map((ref, index) => (
                              <TableRow
                                key={ref.id}
                                className="hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: `${index * 0.05}s` }}
                              >
                                <TableCell className="font-medium text-xs sm:text-sm">
                                  <div className="flex flex-col">
                                    <span>
                                      {ref.user?.name || ref.user?.email || `Filleul #${index + 1}`}
                                    </span>
                                    {ref.user?.name && ref.user?.email && (
                                      <span className="text-xs text-muted-foreground">
                                        {ref.user.email}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {formatDate(ref.created_at)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={ref.status === "active" ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {ref.status === "active" ? "Actif" : "Inactif"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-xs sm:text-sm font-medium">
                                  {ref.total_orders || 0}
                                </TableCell>
                                <TableCell className="text-right text-xs sm:text-sm font-bold text-green-600">
                                  {formatCurrency(ref.total_spent || 0)} XOF
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3 sm:space-y-4">
                      {filteredReferrals.map((ref, index) => (
                        <Card
                          key={ref.id}
                          className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-base sm:text-lg mb-1">
                                  {ref.user?.name || ref.user?.email || `Filleul #${index + 1}`}
                                </h3>
                                {ref.user?.name && ref.user?.email && (
                                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                                    {ref.user.email}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge
                                    variant={ref.status === "active" ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {ref.status === "active" ? "Actif" : "Inactif"}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(ref.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                <BarChart3 className="h-4 w-4 text-blue-500" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Commandes</p>
                                  <p className="text-sm font-semibold">{ref.total_orders || 0}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                <DollarSign className="h-4 w-4 text-green-500" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Total</p>
                                  <p className="text-sm font-semibold text-green-600">
                                    {formatCurrency(ref.total_spent || 0)} XOF
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

              {/* Commissions */}
              <TabsContent value="commissions" className="space-y-4 sm:space-y-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-purple-500" />
                          Historique des Commissions
                        </CardTitle>
                        <CardDescription>
                          Suivez toutes vos commissions générées par vos filleuls
                        </CardDescription>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                          <Input
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-9 h-9 sm:h-10 text-xs sm:text-sm"
                          />
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-muted"
                              onClick={() => setSearchQuery("")}
                              aria-label="Effacer la recherche"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToCSV("commissions")}
                          className="gap-2 h-9 sm:h-10"
                        >
                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline text-xs sm:text-sm">Export CSV</span>
                          <span className="sm:hidden text-xs">Export</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {commissionsLoading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-16" />
                        ))}
                      </div>
                    ) : filteredCommissions.length === 0 ? (
                      <div className="text-center py-12 sm:py-16 text-muted-foreground">
                        <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
                          <DollarSign className="h-12 w-12 sm:h-16 sm:w-16 opacity-20" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
                          {commissions.length === 0
                            ? "Aucune commission pour le moment"
                            : "Aucun résultat trouvé"}
                        </h3>
                        {commissions.length === 0 && (
                          <p className="text-sm sm:text-base mt-2 max-w-md mx-auto">
                            Les commissions apparaîtront ici lorsque vos filleuls effectueront des
                            achats.
                          </p>
                        )}
                      </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs sm:text-sm">Date</TableHead>
                              <TableHead className="text-xs sm:text-sm">Filleul</TableHead>
                              <TableHead className="text-xs sm:text-sm">Commande</TableHead>
                              <TableHead className="text-right text-xs sm:text-sm">Montant total</TableHead>
                              <TableHead className="text-right text-xs sm:text-sm">Commission</TableHead>
                              <TableHead className="text-center text-xs sm:text-sm">Statut</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCommissions.map((comm, index) => (
                              <TableRow
                                key={comm.id}
                                className="hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: `${index * 0.05}s` }}
                              >
                                <TableCell className="text-xs sm:text-sm font-medium">
                                  {formatDate(comm.created_at)}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {comm.referred?.email || `Utilisateur ${comm.referred_id?.substring(0, 8)}` || "N/A"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {comm.order?.order_number || "N/A"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-xs sm:text-sm">
                                  {formatCurrency(Number(comm.total_amount || 0))} XOF
                                </TableCell>
                                <TableCell className="text-right text-xs sm:text-sm font-bold text-green-600">
                                  +{formatCurrency(Number(comm.commission_amount || 0))} XOF
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant={
                                      comm.status === "paid" || comm.status === "completed"
                                        ? "default"
                                        : comm.status === "pending"
                                        ? "secondary"
                                        : "destructive"
                                    }
                                    className="text-xs"
                                  >
                                    {comm.status === "paid" || comm.status === "completed"
                                      ? "Payé"
                                      : comm.status === "pending"
                                      ? "En attente"
                                      : "Annulé"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3 sm:space-y-4">
                      {filteredCommissions.map((comm, index) => (
                        <Card
                          key={comm.id}
                          className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-base sm:text-lg">
                                    {formatDate(comm.created_at)}
                                  </h3>
                                  <Badge
                                    variant={
                                      comm.status === "paid" || comm.status === "completed"
                                        ? "default"
                                        : comm.status === "pending"
                                        ? "secondary"
                                        : "destructive"
                                    }
                                    className="text-xs"
                                  >
                                    {comm.status === "paid" || comm.status === "completed"
                                      ? "Payé"
                                      : comm.status === "pending"
                                      ? "En attente"
                                      : "Annulé"}
                                  </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                                  {comm.referred?.email || `Utilisateur ${comm.referred_id?.substring(0, 8)}` || "N/A"}
                                </p>
                                {comm.order?.order_number && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    Commande: {comm.order.order_number}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                <DollarSign className="h-4 w-4 text-blue-500" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Montant total</p>
                                  <p className="text-sm font-semibold">
                                    {formatCurrency(Number(comm.total_amount || 0))} XOF
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Commission</p>
                                  <p className="text-sm font-semibold text-green-600">
                                    +{formatCurrency(Number(comm.commission_amount || 0))} XOF
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Comment ça marche */}
              <TabsContent value="how-it-works" className="space-y-4 sm:space-y-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-purple-500" />
                      Comment ça marche ?
                    </CardTitle>
                    <CardDescription>
                      Découvrez comment fonctionne notre programme de parrainage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6 sm:space-y-8">
                      <div className="flex gap-4 sm:gap-6">
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                          1
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base sm:text-lg mb-2">
                            Partagez votre lien
                          </h3>
                          <p className="text-sm sm:text-base text-muted-foreground">
                            Envoyez votre lien de parrainage à vos amis, sur les réseaux sociaux ou par
                            email. Plus vous partagez, plus vous avez de chances de gagner !
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 sm:gap-6">
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                          2
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base sm:text-lg mb-2">
                            Vos filleuls s'inscrivent
                          </h3>
                          <p className="text-sm sm:text-base text-muted-foreground">
                            Chaque personne qui s'inscrit via votre lien devient automatiquement votre
                            filleul. Vous pouvez suivre leur progression depuis cette page.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 sm:gap-6">
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                          3
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base sm:text-lg mb-2">
                            Gagnez {data?.commissionRate || 2}% de commission
                          </h3>
                          <p className="text-sm sm:text-base text-muted-foreground">
                            À chaque vente réalisée par vos filleuls, vous recevez automatiquement{" "}
                            {data?.commissionRate || 2}% du montant en commission. Les gains sont
                            crédités directement sur votre compte.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Informations complémentaires */}
                    <div className="mt-8 pt-6 border-t border-border/50 space-y-4">
                      <h4 className="font-semibold text-base sm:text-lg">Informations importantes</h4>
                      <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>
                            Les commissions sont calculées automatiquement à chaque paiement réussi.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>
                            Vos gains sont disponibles immédiatement et peuvent être retirés à tout
                            moment.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>
                            Vous pouvez suivre en temps réel toutes vos commissions et l'activité de
                            vos filleuls.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Referrals;
