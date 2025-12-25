/**
 * Carte d'affichage d'un post de la communauté
 * Date: 31 Janvier 2025
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Pin, 
  Star,
  Eye,
  ThumbsUp,
  Smile,
  Frown,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToggleReaction } from '@/hooks/community/useCommunityReactions';
import { useCurrentUserPostReaction } from '@/hooks/community/useCommunityReactions';
import { useNavigate } from 'react-router-dom';
import type { CommunityPost } from '@/types/community';
import { cn } from '@/lib/utils';

interface CommunityPostCardProps {
  post: CommunityPost;
  onDelete?: (postId: string) => void;
  onPin?: (postId: string, isPinned: boolean) => void;
  onFeature?: (postId: string, isFeatured: boolean) => void;
  showActions?: boolean;
}

export function CommunityPostCard({
  post,
  onDelete,
  onPin,
  onFeature,
  showActions = false,
}: CommunityPostCardProps) {
  const navigate = useNavigate();
  const { data: userReaction } = useCurrentUserPostReaction(post.id);
  const toggleReaction = useToggleReaction();

  const handleReaction = async (reactionType: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry' | 'support') => {
    await toggleReaction.mutateAsync({ postId: post.id, reactionType });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const reactionIcons = {
    like: ThumbsUp,
    love: Heart,
    laugh: Smile,
    wow: AlertCircle,
    sad: Frown,
    angry: AlertCircle,
    support: Heart,
  };

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-300",
      post.is_pinned && "border-primary border-2",
      post.is_featured && "bg-gradient-to-br from-primary/5 to-primary/10"
    )}>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
              <AvatarImage src={post.author?.profile_image_url || undefined} />
              <AvatarFallback>
                {post.author ? getInitials(post.author.first_name, post.author.last_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm sm:text-base truncate">
                  {post.author ? `${post.author.first_name} ${post.author.last_name}` : 'Membre'}
                </h3>
                {post.author?.profession && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {post.author.profession}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}</span>
                {post.is_pinned && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    <Pin className="h-3 w-3 mr-1" />
                    Épinglé
                  </Badge>
                )}
                {post.is_featured && (
                  <Badge variant="default" className="text-xs shrink-0">
                    <Star className="h-3 w-3 mr-1" />
                    En vedette
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Actions pour le post ${post.title || post.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onPin && (
                  <DropdownMenuItem onClick={() => onPin(post.id, !post.is_pinned)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {post.is_pinned ? 'Désépingler' : 'Épingler'}
                  </DropdownMenuItem>
                )}
                {onFeature && (
                  <DropdownMenuItem onClick={() => onFeature(post.id, !post.is_featured)}>
                    <Star className="h-4 w-4 mr-2" />
                    {post.is_featured ? 'Retirer de la vedette' : 'Mettre en vedette'}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(post.id)}
                    className="text-destructive"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
        {post.title && (
          <h4 className="text-base sm:text-lg font-semibold">{post.title}</h4>
        )}
        
        <div className="prose prose-sm max-w-none dark:prose-invert text-sm sm:text-base">
          {post.content_type === 'markdown' ? (
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          ) : (
            <p className="whitespace-pre-wrap break-words">{post.content}</p>
          )}
        </div>

        {(post.category || (post.tags && post.tags.length > 0)) && (
          <div className="flex flex-wrap gap-2">
            {post.category && (
              <Badge variant="outline" className="text-xs">{post.category}</Badge>
            )}
            {post.tags && post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 sm:pt-4 border-t">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <Button
              variant={userReaction?.reaction_type === 'like' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleReaction('like')}
              disabled={toggleReaction.isPending}
              className="min-h-[36px] sm:min-h-[40px]"
            >
              <ThumbsUp className={cn(
                "h-4 w-4 sm:mr-2",
                userReaction?.reaction_type === 'like' && "fill-current"
              )} />
              <span>{post.likes_count || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/community/posts/${post.id}`)}
              className="min-h-[36px] sm:min-h-[40px]"
            >
              <MessageCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{post.comments_count || 0}</span>
              <span className="sm:hidden">{post.comments_count || 0}</span>
            </Button>

            <Button variant="ghost" size="sm" className="min-h-[36px] sm:min-h-[40px]">
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{post.views_count || 0}</span>
              <span className="sm:hidden">{post.views_count || 0}</span>
            </Button>
          </div>

          <Button variant="ghost" size="sm" className="min-h-[36px] sm:min-h-[40px] w-full sm:w-auto">
            <Share2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Partager</span>
            <span className="sm:hidden">Partager</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

