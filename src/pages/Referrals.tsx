import { useState, useEffect, useMemo } from "react";
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

  // Charger les données quand on change d'onglet
  useEffect(() => {
    if (activeTab === "referrals" && !referralsLoading) {
      // Ne recharger que si on n'est pas déjà en train de charger
      if (referrals.length === 0 && !referralsLoading) {
        refetchReferrals();
      }
    } else if (activeTab === "commissions" && !commissionsLoading) {
      // Ne recharger que si on n'est pas déjà en train de charger
      if (commissions.length === 0 && !commissionsLoading) {
        refetchCommissions();
      }
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
      "Rejoignez Payhula via mon lien de parrainage et profitez de tous les avantages !"
    );
    const url = encodeURIComponent(data.referralLink);

    const shareUrls: { [key: string]: string } = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      email: `mailto:?subject=Rejoignez Payhula&body=${text}%20${url}`,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
              <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Programme de parrainage
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Invitez vos amis et gagnez {data?.commissionRate || 2}% de commission sur chaque vente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || referralsLoading || commissionsLoading}
              className="flex-1 sm:flex-none transition-all hover:scale-105"
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
              onClick={() => navigate("/dashboard")}
              className="gap-2 flex-1 sm:flex-none"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour</span>
              <span className="sm:hidden">Retour</span>
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div
          ref={statsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8 animate-in fade-in slide-in-from-left-4 duration-500 delay-100"
        >
          {/* Total Filleuls */}
          <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-purple-100 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-200" />
                Total Filleuls
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                {loading ? "..." : data?.totalReferrals || 0}
              </div>
              <p className="text-xs text-purple-200/90 mt-1 font-medium">
                {data?.activeReferrals || 0} actifs
              </p>
            </CardContent>
            <div className="absolute top-2 right-2 h-2 w-2 bg-purple-300 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
          </Card>

          {/* Gains Totaux */}
          <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-green-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-purple-100 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-400 drop-shadow-lg" />
                Gains Totaux
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl md:text-3xl font-bold text-green-400 drop-shadow-lg">
                {loading ? "..." : `${formatCurrency(data?.totalEarnings || 0)}`}
              </div>
              <p className="text-xs text-purple-200/90 mt-1 font-medium">XOF</p>
            </CardContent>
            <div className="absolute top-2 right-2 h-2 w-2 bg-green-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-lg shadow-green-400/50"></div>
          </Card>

          {/* En Attente */}
          <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-yellow-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-purple-100 flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-400 drop-shadow-lg" />
                En Attente
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl md:text-3xl font-bold text-yellow-400 drop-shadow-lg">
                {loading ? "..." : `${formatCurrency(data?.pendingEarnings || 0)}`}
              </div>
              <p className="text-xs text-purple-200/90 mt-1 font-medium">XOF</p>
            </CardContent>
            <div className="absolute top-2 right-2 h-2 w-2 bg-yellow-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-lg shadow-yellow-400/50"></div>
          </Card>

          {/* Payés */}
          <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-blue-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-purple-100 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400 drop-shadow-lg" />
                Payés
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl md:text-3xl font-bold text-blue-400 drop-shadow-lg">
                {loading ? "..." : `${formatCurrency(data?.paidEarnings || 0)}`}
              </div>
              <p className="text-xs text-purple-200/90 mt-1 font-medium">XOF</p>
            </CardContent>
            <div className="absolute top-2 right-2 h-2 w-2 bg-blue-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-lg shadow-blue-400/50"></div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto">
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
            <Card className="border-2 border-purple-500/20 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  Votre lien de parrainage
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
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
                      className="w-full px-4 py-3 bg-muted rounded-lg font-mono text-xs sm:text-sm border-2 border-border focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    {data?.referralCode && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Votre code : <span className="font-mono font-semibold">{data.referralCode}</span>
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={copyToClipboard}
                    disabled={loading || !data?.referralLink}
                    className="group relative overflow-hidden transition-all hover:scale-105 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl text-white"
                    size="lg"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copier le lien
                      </>
                    )}
                  </Button>
                </div>

                {/* Boutons de partage social */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground flex items-center gap-2 w-full sm:w-auto">
                    <Share2 className="h-4 w-4" />
                    Partager sur :
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareOnSocial("facebook")}
                    className="gap-2"
                  >
                    <span className="text-blue-600">f</span>
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareOnSocial("twitter")}
                    className="gap-2"
                  >
                    <span className="text-blue-400">𝕏</span>
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareOnSocial("whatsapp")}
                    className="gap-2"
                  >
                    <span className="text-green-600">WhatsApp</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareOnSocial("email")}
                    className="gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mes Filleuls */}
          <TabsContent value="referrals" className="space-y-4 sm:space-y-6">
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input
                      placeholder="Rechercher un filleul..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 sm:flex-none sm:w-64"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV("referrals")}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export CSV</span>
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
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm sm:text-base">
                      {referrals.length === 0
                        ? "Aucun filleul pour le moment"
                        : "Aucun résultat trouvé"}
                    </p>
                    {referrals.length === 0 && (
                      <p className="text-xs sm:text-sm mt-2">
                        Partagez votre lien de parrainage pour inviter vos amis !
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Filleul</TableHead>
                          <TableHead className="hidden sm:table-cell">Date d'inscription</TableHead>
                          <TableHead className="hidden md:table-cell">Statut</TableHead>
                          <TableHead className="text-right">Commandes</TableHead>
                          <TableHead className="text-right">Total dépensé</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReferrals.map((ref, index) => (
                          <TableRow
                            key={ref.id}
                            className="animate-in fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span className="text-sm sm:text-base">
                                  {ref.user?.name || ref.user?.email || `Filleul #${index + 1}`}
                                </span>
                                {ref.user?.name && ref.user?.email && (
                                  <span className="text-xs text-muted-foreground sm:hidden">
                                    {ref.user.email}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {formatDate(ref.created_at)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge
                                variant={ref.status === "active" ? "default" : "secondary"}
                              >
                                {ref.status === "active" ? "Actif" : "Inactif"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm sm:text-base font-medium">
                                {ref.total_orders || 0}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm sm:text-base font-bold text-green-600">
                                {formatCurrency(ref.total_spent || 0)} XOF
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions */}
          <TabsContent value="commissions" className="space-y-4 sm:space-y-6">
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 sm:flex-none sm:w-64"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV("commissions")}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export CSV</span>
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
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm sm:text-base">
                      {commissions.length === 0
                        ? "Aucune commission pour le moment"
                        : "Aucun résultat trouvé"}
                    </p>
                    {commissions.length === 0 && (
                      <p className="text-xs sm:text-sm mt-2">
                        Les commissions apparaîtront ici lorsque vos filleuls effectueront des
                        achats.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Date</TableHead>
                          <TableHead className="hidden sm:table-cell">Filleul</TableHead>
                          <TableHead className="hidden md:table-cell">Commande</TableHead>
                          <TableHead className="text-right">Montant total</TableHead>
                          <TableHead className="text-right">Commission</TableHead>
                          <TableHead className="text-center">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCommissions.map((comm, index) => (
                          <TableRow
                            key={comm.id}
                            className="animate-in fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm sm:text-base font-medium">
                                  {formatDate(comm.created_at)}
                                </span>
                                <span className="text-xs text-muted-foreground sm:hidden">
                                  {comm.referred?.email || "N/A"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {comm.referred?.email || `Utilisateur ${comm.referred_id?.substring(0, 8)}` || "N/A"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline">
                                {comm.order?.order_number || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm sm:text-base">
                                {formatCurrency(Number(comm.total_amount || 0))} XOF
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm sm:text-base font-bold text-green-600">
                                +{formatCurrency(Number(comm.commission_amount || 0))} XOF
                              </span>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comment ça marche */}
          <TabsContent value="how-it-works" className="space-y-4 sm:space-y-6">
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                <div className="mt-8 pt-6 border-t space-y-4">
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
    </div>
  );
};

export default Referrals;
