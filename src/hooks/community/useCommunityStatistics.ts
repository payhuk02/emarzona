/**
 * Hooks pour les statistiques de la communauté
 * Date: 31 Janvier 2025
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CommunityStatistics } from '@/types/community';
import { logger } from '@/lib/logger';

export function useCommunityStatistics() {
  return useQuery({
    queryKey: ['community-statistics'],
    queryFn: async () => {
      // Fetch all statistics in parallel
      const [
        membersResult,
        activeMembersResult,
        pendingMembersResult,
        postsResult,
        publishedPostsResult,
        commentsResult,
        reactionsResult,
        membersByCountryResult,
        membersByProfessionResult,
        postsByCategoryResult,
      ] = await Promise.all([
        // Total members
        supabase
          .from('community_members')
          .select('id', { count: 'exact', head: true }),

        // Active members (approved)
        supabase
          .from('community_members')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved'),

        // Pending members
        supabase
          .from('community_members')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // Total posts
        supabase
          .from('community_posts')
          .select('id', { count: 'exact', head: true }),

        // Published posts
        supabase
          .from('community_posts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published'),

        // Total comments
        supabase
          .from('community_comments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published'),

        // Total reactions
        supabase
          .from('community_reactions')
          .select('id', { count: 'exact', head: true }),

        // Members by country
        supabase
          .from('community_members')
          .select('country')
          .eq('status', 'approved'),

        // Members by profession
        supabase
          .from('community_members')
          .select('profession')
          .eq('status', 'approved')
          .not('profession', 'is', null),

        // Posts by category
        supabase
          .from('community_posts')
          .select('category')
          .eq('status', 'published')
          .not('category', 'is', null),
      ]);

      // Process country distribution
      const countryMap = new Map<string, number>();
      (membersByCountryResult.data || []).forEach((member) => {
        const country = member.country || 'Unknown';
        countryMap.set(country, (countryMap.get(country) || 0) + 1);
      });
      const members_by_country = Array.from(countryMap.entries()).map(([country, count]) => ({
        country,
        count,
      }));

      // Process profession distribution
      const professionMap = new Map<string, number>();
      (membersByProfessionResult.data || []).forEach((member) => {
        const profession = member.profession || 'Unknown';
        professionMap.set(profession, (professionMap.get(profession) || 0) + 1);
      });
      const members_by_profession = Array.from(professionMap.entries()).map(([profession, count]) => ({
        profession,
        count,
      }));

      // Process category distribution
      const categoryMap = new Map<string, number>();
      (postsByCategoryResult.data || []).forEach((post) => {
        const category = post.category || 'Uncategorized';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });
      const posts_by_category = Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        count,
      }));

      // Recent activity
      const [recentPosts, recentComments, recentMembers] = await Promise.all([
        supabase
          .from('community_posts')
          .select('id, created_at, title, author_id')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(5),

        supabase
          .from('community_comments')
          .select('id, created_at, post_id, author_id')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(5),

        supabase
          .from('community_members')
          .select('id, created_at, first_name, last_name')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const recent_activity = [
        ...(recentPosts.data || []).map((post) => ({
          type: 'post' as const,
          description: `Nouveau post: ${post.title || 'Sans titre'}`,
          created_at: post.created_at,
        })),
        ...(recentComments.data || []).map((comment) => ({
          type: 'comment' as const,
          description: 'Nouveau commentaire',
          created_at: comment.created_at,
        })),
        ...(recentMembers.data || []).map((member) => ({
          type: 'member' as const,
          description: `Nouveau membre: ${member.first_name} ${member.last_name}`,
          created_at: member.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      const statistics: CommunityStatistics = {
        total_members: membersResult.count || 0,
        active_members: activeMembersResult.count || 0,
        pending_members: pendingMembersResult.count || 0,
        total_posts: postsResult.count || 0,
        published_posts: publishedPostsResult.count || 0,
        total_comments: commentsResult.count || 0,
        total_reactions: reactionsResult.count || 0,
        members_by_country,
        members_by_profession,
        posts_by_category,
        recent_activity,
      };

      return statistics;
    },
  });
}

