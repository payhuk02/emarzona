import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BlogEngagement {
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  allow_comments: boolean;
  user_liked: boolean;
}

export interface BlogComment {
  id: string;
  parent_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
  is_mine?: boolean;
  status?: string;
}

const engagementKey = (postId: string) => ['platform-blog-engagement', postId] as const;
const commentsKey = (postId: string) => ['platform-blog-comments', postId] as const;

export function usePlatformBlogEngagement(postId: string | undefined) {
  return useQuery({
    queryKey: engagementKey(postId ?? ''),
    enabled: Boolean(postId),
    queryFn: async (): Promise<BlogEngagement> => {
      const { data, error } = await supabase.rpc('get_platform_blog_engagement', {
        p_post_id: postId!,
      });
      if (error) throw error;
      return data as BlogEngagement;
    },
    staleTime: 30_000,
  });
}

export function usePlatformBlogComments(postId: string | undefined) {
  return useQuery({
    queryKey: commentsKey(postId ?? ''),
    enabled: Boolean(postId),
    queryFn: async (): Promise<BlogComment[]> => {
      const { data, error } = await supabase.rpc('get_platform_blog_comments', {
        p_post_id: postId!,
        p_limit: 50,
        p_offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as BlogComment[];
    },
    staleTime: 20_000,
  });
}

export function useToggleBlogLike(postId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('toggle_platform_blog_like', {
        p_post_id: postId!,
      });
      if (error) throw error;
      return data as BlogEngagement;
    },
    onSuccess: data => {
      if (postId) {
        queryClient.setQueryData(engagementKey(postId), data);
        void queryClient.invalidateQueries({ queryKey: ['public-platform-blog-posts'] });
      }
    },
  });
}

export function useAddBlogComment(postId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      body: string;
      authorName?: string;
      parentId?: string | null;
    }) => {
      const { data, error } = await supabase.rpc('add_platform_blog_comment', {
        p_post_id: postId!,
        p_body: payload.body,
        p_author_name: payload.authorName ?? null,
        p_parent_id: payload.parentId ?? null,
      });
      if (error) throw error;
      return data as { comment: BlogComment; engagement: BlogEngagement };
    },
    onSuccess: result => {
      if (!postId) return;
      queryClient.setQueryData(engagementKey(postId), result.engagement);
      if (result.comment.status === 'approved') {
        void queryClient.invalidateQueries({ queryKey: commentsKey(postId) });
      }
    },
  });
}

export type BlogShareChannel =
  | 'copy'
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'whatsapp'
  | 'native'
  | 'email';

export function useRecordBlogShare(postId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (channel: BlogShareChannel) => {
      const { data, error } = await supabase.rpc('record_platform_blog_share', {
        p_post_id: postId!,
        p_channel: channel,
      });
      if (error) throw error;
      return data as BlogEngagement;
    },
    onSuccess: data => {
      if (postId) queryClient.setQueryData(engagementKey(postId), data);
    },
  });
}
