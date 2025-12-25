/**
 * Types pour la Communauté
 * Date: 31 Janvier 2025
 */

export type CommunityMemberStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type CommunityMemberRole = 'member' | 'moderator' | 'admin';
export type PostStatus = 'draft' | 'published' | 'archived' | 'deleted' | 'moderated';
export type PostContentType = 'text' | 'markdown' | 'html';
export type CommentStatus = 'published' | 'deleted' | 'moderated';
export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry' | 'support';
export type NotificationType = 'post_like' | 'post_comment' | 'comment_reply' | 'new_follower' | 'post_mention' | 'post_approved' | 'post_rejected';

export interface CommunityMember {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  profession?: string | null;
  company?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
  country: string;
  city?: string | null;
  website?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  github_url?: string | null;
  status: CommunityMemberStatus;
  role: CommunityMemberRole;
  badges: string[];
  join_date: string;
  last_active?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  title?: string | null;
  content: string;
  content_type: PostContentType;
  category?: string | null;
  tags: string[];
  status: PostStatus;
  is_pinned: boolean;
  is_featured: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  deleted_at?: string | null;
  // Relations
  author?: CommunityMember;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id?: string | null;
  content: string;
  status: CommentStatus;
  likes_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Relations
  author?: CommunityMember;
  post?: CommunityPost;
  replies?: CommunityComment[];
}

export interface CommunityReaction {
  id: string;
  member_id: string;
  post_id?: string | null;
  comment_id?: string | null;
  reaction_type: ReactionType;
  created_at: string;
  // Relations
  member?: CommunityMember;
}

export interface CommunityFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  // Relations
  follower?: CommunityMember;
  following?: CommunityMember;
}

export interface CommunityNotification {
  id: string;
  member_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
}

// Form types
export interface CommunityMemberFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profession?: string;
  company?: string;
  bio?: string;
  profile_image_url?: string;
  country: string;
  city?: string;
  website?: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
}

export interface CommunityPostFormData {
  title?: string;
  content: string;
  content_type: PostContentType;
  category?: string;
  tags: string[];
  status: PostStatus;
}

export interface CommunityCommentFormData {
  content: string;
  parent_comment_id?: string;
}

// Filter types
export interface CommunityMembersFilter {
  status?: CommunityMemberStatus[];
  role?: CommunityMemberRole[];
  country?: string;
  search?: string;
}

export interface CommunityPostsFilter {
  status?: PostStatus[];
  category?: string;
  tags?: string[];
  author_id?: string;
  search?: string;
  is_pinned?: boolean;
  is_featured?: boolean;
}

// Statistics
export interface CommunityStatistics {
  total_members: number;
  active_members: number;
  pending_members: number;
  total_posts: number;
  published_posts: number;
  total_comments: number;
  total_reactions: number;
  members_by_country: Array<{ country: string; count: number }>;
  members_by_profession: Array<{ profession: string; count: number }>;
  posts_by_category: Array<{ category: string; count: number }>;
  recent_activity: Array<{
    type: 'post' | 'comment' | 'member';
    description: string;
    created_at: string;
  }>;
}

