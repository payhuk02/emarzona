/**
 * Loyalty Program Page
 * Page principale pour le programme de fidélisation
 */

import { useTranslation } from 'react-i18next';
import { SEOMeta } from '@/components/seo';
import LoyaltyDashboard from '@/components/loyalty/LoyaltyDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Star, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoyaltyProgram = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SEOMeta
          title="Programme de Fidélité"
          description="Rejoignez notre programme de fidélité et gagnez des points sur chaque achat"
        />

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <Gift className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h1 className="text-2xl font-bold mb-4">Programme de Fidélité</h1>
              <p className="text-muted-foreground mb-6">
                Connectez-vous pour accéder à votre tableau de bord fidélité et commencer à gagner des points !
              </p>
              <Button asChild>
                <Link to="/auth">Se connecter</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOMeta
        title="Mon Programme de Fidélité"
        description="Suivez vos points, badges et avantages fidélité"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Programme de Fidélité</h1>
          <p className="text-muted-foreground">
            Gagnez des points sur chaque achat et débloquez des avantages exclusifs
          </p>
        </div>

        {/* Avantages du programme */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <Star className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="font-semibold mb-2">Points sur achats</h3>
              <p className="text-sm text-muted-foreground">
                Gagnez des points sur chaque commande passée
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">Niveaux & Badges</h3>
              <p className="text-sm text-muted-foreground">
                Montez en niveau et débloquez des badges exclusifs
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Gift className="h-12 w-12 mx-auto mb-4 text-purple-500" />
              <h3 className="font-semibold mb-2">Récompenses</h3>
              <p className="text-sm text-muted-foreground">
                Échangez vos points contre des avantages exclusifs
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Users className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h3 className="font-semibold mb-2">Parrainage</h3>
              <p className="text-sm text-muted-foreground">
                Gagnez des points en parrainant vos amis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard principal */}
        <LoyaltyDashboard />
      </div>
    </div>
  );
};

export default LoyaltyProgram;