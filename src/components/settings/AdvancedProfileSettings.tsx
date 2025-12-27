import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { logger } from "@/lib/logger";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Camera, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Copy,
  Share2,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Shield,
  Eye,
  EyeOff,
  Settings,
  Bell,
  Lock,
  Unlock,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Star,
  Award,
  Target,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const AdvancedProfileSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { 
    profile, 
    loading: profileLoading, 
    uploading, 
    uploadAvatar, 
    removeAvatar, 
    updateProfile, 
    getProfileStats,
    getProfileCompletion,
    getReferralInfo,
    getReferredProfiles,
    refetch 
  } = useProfile();
  const { toast } = useToast();
  
  // États pour l'édition
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // États des champs du formulaire
  const [formData, setFormData] = useState({
    displayName: "",
    firstName: "",
    lastName: "",
    bio: "",
    phone: "",
    location: "",
    website: "",
  });
  
  // États pour les fonctionnalités avancées
  const [profileStats, setProfileStats] = useState<any>(null);
  const [referralInfo, setReferralInfo] = useState<any>(null);
  const [referredProfiles, setReferredProfiles] = useState<any[]>([]);
  const [showPrivateInfo, setShowPrivateInfo] = useState(false);
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    marketingEmails: false,
    securityAlerts: true,
    referralNotifications: true,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les données du profil
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.display_name || "",
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        location: profile.location || "",
        website: profile.website || "",
      });
    }
  }, [profile]);

  // Charger les données avancées
  useEffect(() => {
    if (user) {
      loadAdvancedData();
    }
  }, [user]);

  const loadAdvancedData = async () => {
    try {
      const [stats, referral, referred] = await Promise.all([
        getProfileStats(),
        getReferralInfo(),
        getReferredProfiles()
      ]);
      
      setProfileStats(stats);
      setReferralInfo(referral);
      setReferredProfiles(referred);
    } catch (error) {
      logger.error('Error loading advanced data', { error });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await updateProfile(formData);
      if (success) {
        setIsEditing(false);
        await refetch();
        await loadAdvancedData();
      }
    } catch (error) {
      logger.error('Error updating profile', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
        displayName: profile.display_name || "",
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        location: profile.location || "",
        website: profile.website || "",
      });
    }
  };

  const copyReferralCode = () => {
    if (referralInfo?.referral_code) {
      navigator.clipboard.writeText(referralInfo.referral_code);
      toast({
        title: "Code copié",
        description: "Le code de parrainage a été copié dans le presse-papiers",
      });
    }
  };

  const shareReferralCode = () => {
    if (referralInfo?.referral_code) {
      const shareUrl = `${window.location.origin}/register?ref=${referralInfo.referral_code}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: t('settings.profileSettings.referral.linkShared'),
        description: t('settings.profileSettings.referral.linkCopied'),
      });
    }
  };

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase();
    }
    if (formData.displayName) {
      return formData.displayName[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const profileCompletion = getProfileCompletion();

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('settings.profileSettings.loading')}</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('settings.profileSettings.error')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* En-tête du profil */}
        <Card className="border border-border bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-primary/20">
                    <AvatarImage src={profile.avatar_url || ""} alt="Avatar" />
                    <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleAvatarClick}
                    disabled={uploading}
                    aria-label="Modifier l'avatar"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {formData.displayName || user?.email}
                  </h1>
                  <p className="text-muted-foreground">
                    {formData.firstName && formData.lastName 
                      ? `${formData.firstName} ${formData.lastName}` 
                      : t('settings.profileSettings.memberSince') + " " + format(new Date(profile.created_at), "MMMM yyyy", { locale: fr })
                    }
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {profileCompletion}% {t('settings.profileSettings.completed')}
                    </Badge>
                    {profile.is_suspended && (
                      <Badge variant="destructive" className="text-xs">
                        {t('settings.profileSettings.suspended')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrivateInfo(!showPrivateInfo)}
                  className="border-border text-foreground hover:bg-accent"
                >
                  {showPrivateInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="border-border text-foreground hover:bg-accent"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Barre de progression du profil */}
        <Card className="border border-border bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Complétion du profil</span>
              <span className="text-sm text-muted-foreground font-semibold">{profileCompletion}%</span>
            </div>
            <Progress value={profileCompletion} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Complétez votre profil pour améliorer votre visibilité et votre crédibilité
            </p>
          </CardContent>
        </Card>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-muted border border-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="personal" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Informations</TabsTrigger>
            <TabsTrigger value="referral" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Parrainage</TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Statistiques</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Paramètres</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-border bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Complétion</p>
                      <p className="text-2xl font-bold text-foreground">{profileCompletion}%</p>
                    </div>
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Parrainages</p>
                      <p className="text-2xl font-bold text-foreground">{referredProfiles.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Gains</p>
                      <p className="text-2xl font-bold text-foreground">
                        {referralInfo?.total_referral_earnings || 0} XOF
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Membre depuis</p>
                      <p className="text-sm font-semibold text-foreground">
                        {format(new Date(profile.created_at), "MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informations récentes */}
            <Card className="border border-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Profil mis à jour</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(profile.updated_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  {referralInfo?.referral_code && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                      <Share2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Code de parrainage généré</p>
                        <p className="text-xs text-muted-foreground">Code: {referralInfo.referral_code}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Informations personnelles */}
          <TabsContent value="personal" className="space-y-6 mt-6">
            <Card className="border border-border bg-white shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">Informations personnelles</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Gérez vos informations personnelles et votre profil public
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        {t('settings.profileSettings.cancel')}
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4 mr-2" />
                        {t('settings.profileSettings.edit')}
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Nom d'affichage *</Label>
                      <Input
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Votre nom d'affichage"
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Email</Label>
                      <Input
                        value={user?.email || ""}
                        disabled
                        className="bg-muted border-input text-muted-foreground"
                      />
                      <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Prénom</Label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Votre prénom"
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Nom de famille</Label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Votre nom de famille"
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Téléphone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+226 XX XX XX XX"
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Localisation</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Ville, Pays"
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-foreground">Site web</Label>
                      <Input
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://votre-site.com"
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-foreground">Biographie</Label>
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Parlez-nous de vous..."
                        rows={4}
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                        disabled={!isEditing}
                      />
                      <p className="text-xs text-muted-foreground">Maximum 500 caractères</p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex items-center justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        className="border-border text-foreground hover:bg-accent"
                      >
                        {t('settings.profileSettings.cancel')}
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Sauvegarder
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parrainage */}
          <TabsContent value="referral" className="space-y-6 mt-6">
            <Card className="border border-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Programme de parrainage
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Invitez vos amis et gagnez des commissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {referralInfo?.referral_code ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Votre code de parrainage</p>
                          <p className="text-2xl font-bold text-primary font-mono">
                            {referralInfo.referral_code}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyReferralCode}
                            className="border-border text-foreground hover:bg-accent"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={shareReferralCode}
                            className="border-border text-foreground hover:bg-accent"
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Partager
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-muted/50 border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Parrainages</p>
                              <p className="text-2xl font-bold text-foreground">{referredProfiles.length}</p>
                            </div>
                            <Users className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/50 border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Gains totaux</p>
                              <p className="text-2xl font-bold text-foreground">
                                {referralInfo.total_referral_earnings || 0} XOF
                              </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-yellow-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {referredProfiles.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Parrainages récents</h3>
                        <div className="space-y-2">
                          {referredProfiles.slice(0, 5).map((ref) => (
                            <div key={ref.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                    {ref.display_name?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {ref.display_name || `${ref.first_name || ""} ${ref.last_name || ""}`.trim() || "Utilisateur"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Rejoint le {format(new Date(ref.created_at), "dd MMM yyyy", { locale: fr })}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Parrainé
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Code de parrainage non disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistiques */}
          <TabsContent value="stats" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-border bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Statistiques du profil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Complétion du profil</span>
                      <span className="text-sm font-semibold text-foreground">{profileCompletion}%</span>
                    </div>
                    <Progress value={profileCompletion} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Membre depuis</span>
                      <span className="text-sm font-semibold text-foreground">
                        {format(new Date(profile.created_at), "dd MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Dernière mise à jour</span>
                      <span className="text-sm font-semibold text-foreground">
                        {format(new Date(profile.updated_at), "dd MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Répartition des informations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: "Informations de base", value: (formData.displayName ? 1 : 0) + (formData.firstName ? 1 : 0) + (formData.lastName ? 1 : 0), max: 3 },
                      { label: "Contact", value: (formData.phone ? 1 : 0) + (formData.location ? 1 : 0), max: 2 },
                      { label: "Présentation", value: (formData.bio ? 1 : 0) + (formData.website ? 1 : 0), max: 2 },
                      { label: "Avatar", value: profile.avatar_url ? 1 : 0, max: 1 },
                    ].map((item, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-semibold text-foreground">
                            {item.value}/{item.max}
                          </span>
                        </div>
                        <Progress value={(item.value / item.max) * 100} className="h-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Paramètres */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card className="border border-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres de confidentialité
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Contrôlez la visibilité de vos informations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Profil public</Label>
                      <p className="text-xs text-muted-foreground">Rendre votre profil visible par d'autres utilisateurs</p>
                    </div>
                    <Switch
                      checked={showPrivateInfo}
                      onCheckedChange={setShowPrivateInfo}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Statut en ligne</Label>
                      <p className="text-xs text-muted-foreground">Afficher quand vous êtes connecté</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Notifications par email</Label>
                      <p className="text-xs text-muted-foreground">Recevoir des notifications importantes par email</p>
                    </div>
                    <Switch
                      checked={notifications.emailUpdates}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailUpdates: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Emails marketing</Label>
                      <p className="text-xs text-muted-foreground">Recevoir des offres et promotions</p>
                    </div>
                    <Switch
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, marketingEmails: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Actions du compte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="border-border text-foreground hover:bg-accent"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter les données
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="border-border text-foreground hover:bg-accent"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer l'avatar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};






