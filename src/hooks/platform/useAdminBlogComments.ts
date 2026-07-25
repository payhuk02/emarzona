import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toUserErrorMessage } from '@/lib/user-error-message';

export type AdminBlogCommentStatus = 'pending' | 'approved' | 'hidden';

export type AdminBlogComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string | null;
  body: string;
  status: AdminBlogCommentStatus;
  created_at: string;
  updated_at: string;
  post_title: string | null;
};

const ADMIN_COMMENTS_KEY = ['admin-platform-blog-comments'] as const;

type CommentRow = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string | null;
  body: string;
  status: string;
  created_at: string;
  updated_at: string;
  platform_blog_posts?: { title?: string | null } | { title?: string | null }[] | null;
};

/** Table absente des types.ts générés — cast jusqu'à regen supabase:types. */
type BlogCommentsClient = {
  from: (relation: 'platform_blog_comments') => {
    select: (columns: string) => {
      order: (
        column: string,
        opts: { ascending: boolean }
      ) => {
        limit: (
          count: number
        ) => Promise<{ data: CommentRow[] | null; error: { message: string } | null }>;
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
    insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
};

function blogComments() {
  return (supabase as unknown as BlogCommentsClient).from('platform_blog_comments');
}

function mapRow(row: CommentRow): AdminBlogComment {
  const post = Array.isArray(row.platform_blog_posts)
    ? row.platform_blog_posts[0]
    : row.platform_blog_posts;
  const status =
    row.status === 'pending' || row.status === 'approved' || row.status === 'hidden'
      ? row.status
      : 'pending';

  return {
    id: row.id,
    post_id: row.post_id,
    parent_id: row.parent_id,
    author_name: row.author_name,
    author_email: row.author_email,
    body: row.body,
    status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    post_title: post?.title ?? null,
  };
}

export function useAdminBlogComments() {
  return useQuery({
    queryKey: ADMIN_COMMENTS_KEY,
    queryFn: async (): Promise<AdminBlogComment[]> => {
      const { data, error } = await blogComments()
        .select(
          'id, post_id, parent_id, author_name, author_email, body, status, created_at, updated_at, platform_blog_posts(title)'
        )
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw new Error(toUserErrorMessage(error));
      return (data ?? []).map(mapRow);
    },
    staleTime: 15_000,
  });
}

export function useUpdateAdminBlogCommentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: AdminBlogCommentStatus }) => {
      const { error } = await blogComments()
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq('id', input.id);
      if (error) throw new Error(toUserErrorMessage(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_COMMENTS_KEY });
    },
  });
}

export function useReplyAdminBlogComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      postId: string;
      parentId: string;
      body: string;
      authorName: string;
    }) => {
      const { error } = await blogComments().insert({
        post_id: input.postId,
        parent_id: input.parentId,
        body: input.body.trim(),
        author_name: input.authorName,
        status: 'approved',
      });
      if (error) throw new Error(toUserErrorMessage(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_COMMENTS_KEY });
    },
  });
}
