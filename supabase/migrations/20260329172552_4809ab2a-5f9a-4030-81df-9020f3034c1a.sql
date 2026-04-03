
-- =============================================
-- BATCH 2: Email Marketing System + Community
-- =============================================

-- 1. email_templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  category text DEFAULT 'transactional',
  product_type text,
  subject jsonb DEFAULT '{}',
  html_content jsonb DEFAULT '{}',
  text_content jsonb DEFAULT '{}',
  variables text[] DEFAULT '{}',
  sendgrid_template_id text,
  from_email text DEFAULT 'noreply@emarzona.com',
  from_name text DEFAULT 'Emarzona',
  reply_to text,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  sent_count integer DEFAULT 0,
  open_rate numeric DEFAULT 0,
  click_rate numeric DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage email templates" ON public.email_templates FOR ALL USING (
  store_id IS NULL OR EXISTS (SELECT 1 FROM stores WHERE stores.id = email_templates.store_id AND stores.user_id = auth.uid())
);
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. email_campaigns
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text DEFAULT 'newsletter',
  template_id uuid REFERENCES public.email_templates(id),
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  send_at_timezone text DEFAULT 'Africa/Dakar',
  recurrence text DEFAULT 'once',
  recurrence_end_at timestamptz,
  audience_type text DEFAULT 'segment',
  segment_id uuid,
  audience_filters jsonb DEFAULT '{}',
  estimated_recipients integer DEFAULT 0,
  ab_test_enabled boolean DEFAULT false,
  ab_test_variants jsonb DEFAULT '{}',
  ab_test_winner text,
  metrics jsonb DEFAULT '{"sent":0,"delivered":0,"opened":0,"clicked":0,"bounced":0,"unsubscribed":0,"revenue":0}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage campaigns" ON public.email_campaigns FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = email_campaigns.store_id AND stores.user_id = auth.uid())
);
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. email_sequences
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'draft',
  is_active boolean DEFAULT false,
  total_enrolled integer DEFAULT 0,
  total_completed integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage sequences" ON public.email_sequences FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = email_sequences.store_id AND stores.user_id = auth.uid())
);
CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON public.email_sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. email_sequence_steps
CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.email_templates(id),
  step_order integer NOT NULL DEFAULT 0,
  delay_days integer NOT NULL DEFAULT 1,
  delay_hours integer DEFAULT 0,
  subject text,
  content text,
  conditions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  sent_count integer DEFAULT 0,
  open_rate numeric DEFAULT 0,
  click_rate numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sequence steps inherit sequence access" ON public.email_sequence_steps FOR ALL USING (
  EXISTS (SELECT 1 FROM email_sequences es JOIN stores s ON s.id = es.store_id WHERE es.id = email_sequence_steps.sequence_id AND s.user_id = auth.uid())
);
CREATE TRIGGER update_email_sequence_steps_updated_at BEFORE UPDATE ON public.email_sequence_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. email_segments
CREATE TABLE IF NOT EXISTS public.email_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  conditions jsonb DEFAULT '[]',
  match_type text DEFAULT 'all',
  subscriber_count integer DEFAULT 0,
  is_dynamic boolean DEFAULT true,
  is_active boolean DEFAULT true,
  last_calculated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage segments" ON public.email_segments FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = email_segments.store_id AND stores.user_id = auth.uid())
);
CREATE TRIGGER update_email_segments_updated_at BEFORE UPDATE ON public.email_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. email_logs
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.email_templates(id),
  template_slug text,
  campaign_id uuid REFERENCES public.email_campaigns(id),
  recipient_email text NOT NULL,
  recipient_name text,
  user_id uuid,
  subject text,
  product_type text,
  product_id uuid,
  order_id uuid,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  variables jsonb DEFAULT '{}',
  sendgrid_message_id text,
  sendgrid_status text DEFAULT 'queued',
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  open_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  error_message text,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners view email logs" ON public.email_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = email_logs.store_id AND stores.user_id = auth.uid())
);
CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON public.email_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. email_workflows
CREATE TABLE IF NOT EXISTS public.email_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL DEFAULT 'event',
  trigger_config jsonb DEFAULT '{}',
  steps jsonb DEFAULT '[]',
  is_active boolean DEFAULT false,
  status text DEFAULT 'draft',
  total_runs integer DEFAULT 0,
  success_rate numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage workflows" ON public.email_workflows FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = email_workflows.store_id AND stores.user_id = auth.uid())
);
CREATE TRIGGER update_email_workflows_updated_at BEFORE UPDATE ON public.email_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. email_ab_tests
CREATE TABLE IF NOT EXISTS public.email_ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text DEFAULT 'draft',
  variant_a jsonb DEFAULT '{}',
  variant_b jsonb DEFAULT '{}',
  test_percentage integer DEFAULT 20,
  winning_metric text DEFAULT 'open_rate',
  winner text,
  results jsonb DEFAULT '{}',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners manage ab tests" ON public.email_ab_tests FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = email_ab_tests.store_id AND stores.user_id = auth.uid())
);
CREATE TRIGGER update_email_ab_tests_updated_at BEFORE UPDATE ON public.email_ab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. email_preferences
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transactional_emails boolean DEFAULT true,
  marketing_emails boolean DEFAULT true,
  notification_emails boolean DEFAULT true,
  order_updates boolean DEFAULT true,
  product_updates boolean DEFAULT true,
  promotional_emails boolean DEFAULT true,
  newsletter boolean DEFAULT true,
  email_frequency text DEFAULT 'real-time',
  preferred_language text DEFAULT 'fr',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own email prefs" ON public.email_preferences FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON public.email_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. email_unsubscribes
CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid,
  reason text,
  unsubscribe_type text DEFAULT 'all',
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.email_campaigns(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners view unsubscribes" ON public.email_unsubscribes FOR SELECT USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = email_unsubscribes.store_id AND stores.user_id = auth.uid())
);
CREATE POLICY "Anyone can unsubscribe" ON public.email_unsubscribes FOR INSERT WITH CHECK (true);

-- 11. community_members
CREATE TABLE IF NOT EXISTS public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  profession text,
  company text,
  bio text,
  profile_image_url text,
  country text NOT NULL DEFAULT '',
  city text,
  website text,
  linkedin_url text,
  twitter_url text,
  github_url text,
  status text NOT NULL DEFAULT 'pending',
  role text NOT NULL DEFAULT 'member',
  badges text[] DEFAULT '{}',
  join_date timestamptz NOT NULL DEFAULT now(),
  last_active timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Community members viewable" ON public.community_members FOR SELECT USING (status = 'approved');
CREATE POLICY "Users manage own member profile" ON public.community_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins manage community" ON public.community_members FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_community_members_updated_at BEFORE UPDATE ON public.community_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. community_posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.community_members(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  content_type text DEFAULT 'text',
  category text,
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  is_pinned boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts viewable" ON public.community_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Authors manage own posts" ON public.community_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM community_members cm WHERE cm.id = community_posts.author_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Admins manage all posts" ON public.community_posts FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. community_comments
CREATE TABLE IF NOT EXISTS public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.community_members(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.community_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'published',
  likes_count integer DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published comments viewable" ON public.community_comments FOR SELECT USING (status = 'published');
CREATE POLICY "Authors manage own comments" ON public.community_comments FOR ALL USING (
  EXISTS (SELECT 1 FROM community_members cm WHERE cm.id = community_comments.author_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Admins manage all comments" ON public.community_comments FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON public.community_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. community_reactions
CREATE TABLE IF NOT EXISTS public.community_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.community_members(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.community_comments(id) ON DELETE CASCADE,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, post_id, reaction_type),
  UNIQUE(member_id, comment_id, reaction_type)
);

ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions viewable" ON public.community_reactions FOR SELECT USING (true);
CREATE POLICY "Members manage own reactions" ON public.community_reactions FOR ALL USING (
  EXISTS (SELECT 1 FROM community_members cm WHERE cm.id = community_reactions.member_id AND cm.user_id = auth.uid())
);
