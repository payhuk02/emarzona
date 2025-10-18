import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Copy, Check, ArrowLeft } from "lucide-react";
import { useReferral } from "@/hooks/useReferral";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Referrals = () => {
  const { data, loading } = useReferral();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

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
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserPlus className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Programme de parrainage</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>
      </div>

      {/* Lien de parrainage */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Votre lien de parrainage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Partagez ce lien unique et gagnez 2% de commission sur chaque vente réalisée par vos filleuls.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                readOnly
                value={loading ? "Chargement..." : data?.referralLink || ""}
                className="w-full px-4 py-3 bg-muted rounded-lg font-mono text-sm border-2 border-border focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <Button
              onClick={copyToClipboard}
              disabled={loading || !data?.referralLink}
              className="group relative overflow-hidden transition-all hover:scale-105"
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

          {/* Stats rapides */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Filleuls actifs</p>
              <p className="text-2xl font-bold text-primary">
                {loading ? "..." : data?.totalReferrals || 0}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Gains totaux</p>
              <p className="text-2xl font-bold text-primary">
                {loading ? "..." : `${data?.totalEarnings || 0} XOF`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations sur le programme */}
      <Card>
        <CardHeader>
          <CardTitle>Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Partagez votre lien</h3>
                <p className="text-sm text-muted-foreground">
                  Envoyez votre lien de parrainage à vos amis, sur les réseaux sociaux ou par email.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Vos filleuls s'inscrivent</h3>
                <p className="text-sm text-muted-foreground">
                  Chaque personne qui s'inscrit via votre lien devient automatiquement votre filleul.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Gagnez 2% de commission</h3>
                <p className="text-sm text-muted-foreground">
                  À chaque vente réalisée par vos filleuls, vous recevez automatiquement 2% du montant.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Referrals;
