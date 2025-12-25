/**
 * Page publique de la Communauté
 * Date: 31 Janvier 2025
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCurrentCommunityMember } from '@/hooks/community/useCommunityMembers';
import { useCommunityPosts } from '@/hooks/community/useCommunityPosts';
import { CommunityMemberForm } from '@/components/community/CommunityMemberForm';
import { CommunityPostCard } from '@/components/community/CommunityPostCard';
import { CommunityPostForm } from '@/components/community/CommunityPostForm';
import { Users, MessageSquare, Plus, Search, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [joinFormOpen, setJoinFormOpen] = useState(false);
  const [postFormOpen, setPostFormOpen] = useState(false);

  // Vérifier si l'utilisateur est membre de la communauté
  const { data: currentMember, isLoading: memberLoading } = useCurrentCommunityMember();
  const isMember = currentMember?.status === 'approved';
  const isPending = currentMember?.status === 'pending';

  // Fetch posts (seulement publiés pour la page publique)
  const { data: posts, isLoading: postsLoading } = useCommunityPosts({
    status: ['published'] as const,
    search: searchQuery || undefined,
  });

  const handleJoinClick = () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez vous connecter pour rejoindre la communauté.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (isMember) {
      // Si déjà membre, ouvrir le formulaire de post
      setPostFormOpen(true);
    } else if (isPending) {
      toast({
        title: 'Demande en attente',
        description: 'Votre demande d\'adhésion est en cours de traitement. Vous serez notifié une fois approuvé.',
      });
    } else {
      // Ouvrir le formulaire d'inscription
      setJoinFormOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/5 backdrop-blur-sm border border-blue-500/20 shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 dark:text-blue-400" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                  Communauté Emarzona
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Rejoignez notre communauté d'entrepreneurs et créateurs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!user ? (
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">
                    <LogIn className="h-4 w-4 mr-2" />
                    <span className="hidden xs:inline">Se connecter</span>
                    <span className="xs:hidden">Connexion</span>
                  </Button>
                </Link>
              ) : isMember ? (
                <Button onClick={() => setPostFormOpen(true)} className="w-full sm:w-auto min-h-[44px]">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Nouveau post</span>
                  <span className="xs:hidden">Post</span>
                </Button>
              ) : (
                <Button onClick={handleJoinClick} className="w-full sm:w-auto min-h-[44px]">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    {isPending ? 'Demande en attente' : 'Rejoindre la communauté'}
                  </span>
                  <span className="sm:hidden">
                    {isPending ? 'En attente' : 'Rejoindre'}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Banner pour les non-membres */}
        {user && !isMember && !isPending && (
          <Card className="mb-4 sm:mb-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Rejoignez la communauté</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Créez votre profil et commencez à partager avec d'autres membres de la communauté Emarzona.
                  </p>
                </div>
                <Button onClick={() => setJoinFormOpen(true)} className="w-full sm:w-auto min-h-[44px] shrink-0">
                  <Users className="h-4 w-4 mr-2" />
                  S'inscrire
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Banner pour les membres en attente */}
        {user && isPending && (
          <Card className="mb-4 sm:mb-6 border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-1.5 sm:p-2 rounded-full bg-yellow-500/10 shrink-0">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold mb-1">Demande en attente</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Votre demande d'adhésion est en cours de traitement. Vous recevrez une notification une fois approuvé.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 min-h-[44px]"
            />
          </div>
        </div>

        {/* Posts List */}
        {postsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <CommunityPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucun post pour le moment</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isMember
                    ? 'Soyez le premier à partager quelque chose avec la communauté !'
                    : 'Rejoignez la communauté pour commencer à partager.'}
                </p>
                {isMember && (
                  <Button onClick={() => setPostFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le premier post
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Join Form Dialog */}
      <Dialog open={joinFormOpen} onOpenChange={setJoinFormOpen}>
        <DialogContent className="max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle>Rejoindre la communauté</DialogTitle>
            <DialogDescription>
              Remplissez le formulaire pour demander à rejoindre la communauté Emarzona
            </DialogDescription>
          </DialogHeader>
          <CommunityMemberForm
            onSuccess={() => {
              setJoinFormOpen(false);
              toast({
                title: 'Demande envoyée',
                description: 'Votre demande d\'adhésion a été envoyée. Vous serez notifié une fois approuvé.',
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Post Form Dialog */}
      <Dialog open={postFormOpen} onOpenChange={setPostFormOpen}>
        <DialogContent className="max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle>Nouveau post</DialogTitle>
            <DialogDescription>
              Partagez quelque chose avec la communauté
            </DialogDescription>
          </DialogHeader>
          <CommunityPostForm
            onSuccess={() => {
              setPostFormOpen(false);
              toast({
                title: 'Post publié',
                description: 'Votre post a été publié avec succès.',
              });
            }}
            onCancel={() => setPostFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

