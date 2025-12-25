-- ============================================================
-- EMAILING AVANCÉ - FONDATIONS (Phase 1)
-- Date: 1er Février 2025
-- Description: Tables de base pour campagnes, segments et séquences d'emails
-- ============================================================

-- ============================================================
-- 1. TABLE: email_campaigns
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Type & Template
  type TEXT NOT NULL CHECK (type IN ('newsletter', 'promotional', 'transactional', 'abandon_cart', 'nurture')),
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  
  -- Scheduling
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  send_at_timezone TEXT DEFAULT 'Africa/Dakar',
  recurrence TEXT CHECK (recurrence IN ('once', 'daily', 'weekly', 'monthly')),
  recurrence_end_at TIMESTAMPTZ,
  
  -- Audience
  audience_type TEXT NOT NULL CHECK (audience_type IN ('segment', 'list', 'filter')),
  segment_id UUID, -- Will reference email_segments after creation
  audience_filters JSONB DEFAULT '{}'::jsonb,
  estimated_recipients INTEGER,
  
  -- A/B Testing
  ab_test_enabled BOOLEAN DEFAULT FALSE,
  ab_test_variants JSONB, -- [{subject, template_id, send_percentage}]
  ab_test_winner TEXT CHECK (ab_test_winner IN ('variant_a', 'variant_b')),
  
  -- Métriques
  metrics JSONB DEFAULT '{
    "sent": 0,
    "delivered": 0,
    "opened": 0,
    "clicked": 0,
    "bounced": 0,
    "unsubscribed": 0,
    "revenue": 0
  }'::jsonb,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_campaigns_store_id ON public.email_campaigns(store_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON public.email_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_campaigns_type ON public.email_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_segment_id ON public.email_campaigns(segment_id) WHERE segment_id IS NOT NULL;

-- Comments
COMMENT ON TABLE public.email_campaigns IS 'Campagnes email marketing avec scheduling et A/B testing';
COMMENT ON COLUMN public.email_campaigns.type IS 'Type de campagne: newsletter, promotional, transactional, abandon_cart, nurture';
COMMENT ON COLUMN public.email_campaigns.status IS 'Statut: draft, scheduled, sending, paused, completed, cancelled';
COMMENT ON COLUMN public.email_campaigns.metrics IS 'Métriques de performance de la campagne';

-- ============================================================
-- 2. TABLE: email_segments
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Type
  type TEXT NOT NULL CHECK (type IN ('static', 'dynamic')),
  
  -- Critères de segmentation
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb, -- {filters, conditions, rules}
  
  -- Stats
  member_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_segments_store_id ON public.email_segments(store_id);
CREATE INDEX IF NOT EXISTS idx_email_segments_type ON public.email_segments(type);
CREATE INDEX IF NOT EXISTS idx_email_segments_last_calculated_at ON public.email_segments(last_calculated_at) WHERE last_calculated_at IS NOT NULL;

-- Comments
COMMENT ON TABLE public.email_segments IS 'Segments d''audience pour campagnes email (statiques ou dynamiques)';
COMMENT ON COLUMN public.email_segments.type IS 'Type: static (liste manuelle) ou dynamic (calculé via critères)';
COMMENT ON COLUMN public.email_segments.criteria IS 'Critères de segmentation en JSON: filters, conditions, rules';

-- ============================================================
-- 3. TABLE: email_sequences
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Trigger
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('event', 'time', 'behavior')),
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  
  -- Métriques
  enrolled_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_sequences_store_id ON public.email_sequences(store_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_status ON public.email_sequences(status);
CREATE INDEX IF NOT EXISTS idx_email_sequences_trigger_type ON public.email_sequences(trigger_type);

-- Comments
COMMENT ON TABLE public.email_sequences IS 'Séquences d''emails automatisées (drip campaigns)';
COMMENT ON COLUMN public.email_sequences.trigger_type IS 'Type de trigger: event, time, behavior';
COMMENT ON COLUMN public.email_sequences.trigger_config IS 'Configuration du trigger en JSON';

-- ============================================================
-- 4. TABLE: email_sequence_steps
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  
  -- Order dans la séquence
  step_order INTEGER NOT NULL,
  
  -- Email
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  
  -- Timing
  delay_type TEXT NOT NULL CHECK (delay_type IN ('immediate', 'minutes', 'hours', 'days')),
  delay_value INTEGER NOT NULL DEFAULT 0,
  
  -- Conditions (optionnel)
  conditions JSONB DEFAULT '{}'::jsonb, -- {if: {condition}, then: send, else: skip}
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_sequence_steps_sequence_id ON public.email_sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_steps_step_order ON public.email_sequence_steps(sequence_id, step_order);

-- Unique constraint: un seul step_order par sequence_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_sequence_steps_unique_order 
  ON public.email_sequence_steps(sequence_id, step_order);

-- Comments
COMMENT ON TABLE public.email_sequence_steps IS 'Étapes d''une séquence d''emails';
COMMENT ON COLUMN public.email_sequence_steps.delay_type IS 'Type de délai: immediate, minutes, hours, days';
COMMENT ON COLUMN public.email_sequence_steps.conditions IS 'Conditions d''envoi optionnelles';

-- ============================================================
-- 5. TABLE: email_sequence_enrollments
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  
  -- Progression
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT '{}'::integer[],
  
  -- Dates
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  next_email_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  context JSONB DEFAULT '{}'::jsonb, -- Données contextuelles (order_id, product_id, etc.)
  
  -- Unique: un utilisateur ne peut être inscrit qu'une fois par séquence
  CONSTRAINT unique_sequence_user UNIQUE (sequence_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_sequence_id ON public.email_sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_user_id ON public.email_sequence_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_status ON public.email_sequence_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_next_email_at ON public.email_sequence_enrollments(next_email_at) WHERE next_email_at IS NOT NULL;

-- Comments
COMMENT ON TABLE public.email_sequence_enrollments IS 'Inscriptions d''utilisateurs aux séquences d''emails';
COMMENT ON COLUMN public.email_sequence_enrollments.status IS 'Statut: active, paused, completed, cancelled';
COMMENT ON COLUMN public.email_sequence_enrollments.context IS 'Données contextuelles pour personnalisation';

-- ============================================================
-- 6. TABLE: email_user_tags
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Tag
  tag TEXT NOT NULL,
  
  -- Dates
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL = auto
  
  -- Metadata
  context JSONB DEFAULT '{}'::jsonb,
  
  -- Unique: un tag unique par utilisateur/store
  CONSTRAINT unique_user_store_tag UNIQUE (user_id, store_id, tag)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_user_tags_user_id ON public.email_user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_email_user_tags_store_id ON public.email_user_tags(store_id);
CREATE INDEX IF NOT EXISTS idx_email_user_tags_tag ON public.email_user_tags(tag);
CREATE INDEX IF NOT EXISTS idx_email_user_tags_user_store ON public.email_user_tags(user_id, store_id);

-- Comments
COMMENT ON TABLE public.email_user_tags IS 'Tags pour segmentation et personnalisation des utilisateurs';
COMMENT ON COLUMN public.email_user_tags.added_by IS 'NULL si ajouté automatiquement, sinon user_id de celui qui a ajouté';

-- ============================================================
-- 7. TABLE: email_unsubscribes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Type de désabonnement
  unsubscribe_type TEXT NOT NULL CHECK (unsubscribe_type IN ('all', 'marketing', 'newsletter', 'transactional')),
  
  -- Raison
  reason TEXT,
  
  -- Dates
  unsubscribed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Unique: un email ne peut avoir qu'un type de désabonnement unique
  CONSTRAINT unique_email_unsubscribe_type UNIQUE (email, unsubscribe_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON public.email_unsubscribes(email);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_user_id ON public.email_unsubscribes(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_type ON public.email_unsubscribes(unsubscribe_type);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_campaign_id ON public.email_unsubscribes(campaign_id) WHERE campaign_id IS NOT NULL;

-- Comments
COMMENT ON TABLE public.email_unsubscribes IS 'Liste des désabonnements email';
COMMENT ON COLUMN public.email_unsubscribes.unsubscribe_type IS 'Type: all, marketing, newsletter, transactional';

-- ============================================================
-- 8. ADD FOREIGN KEY FOR email_campaigns.segment_id
-- ============================================================

-- Ajouter la contrainte de clé étrangère après création de email_segments
ALTER TABLE public.email_campaigns
ADD CONSTRAINT fk_email_campaigns_segment_id 
FOREIGN KEY (segment_id) REFERENCES public.email_segments(id) ON DELETE SET NULL;

-- ============================================================
-- 9. TRIGGERS: updated_at automatique
-- ============================================================

-- Fonction update_updated_at (déjà existante normalement, mais au cas où)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS trigger_email_campaigns_updated_at ON public.email_campaigns;
CREATE TRIGGER trigger_email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_email_segments_updated_at ON public.email_segments;
CREATE TRIGGER trigger_email_segments_updated_at
  BEFORE UPDATE ON public.email_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_email_sequences_updated_at ON public.email_sequences;
CREATE TRIGGER trigger_email_sequences_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activer RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. POLICIES: email_campaigns
-- ============================================================

-- Les vendeurs peuvent gérer leurs propres campagnes
CREATE POLICY "Store owners can manage own campaigns"
  ON public.email_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = email_campaigns.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage all campaigns"
  ON public.email_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- ============================================================
-- 12. POLICIES: email_segments
-- ============================================================

-- Les vendeurs peuvent gérer leurs propres segments
CREATE POLICY "Store owners can manage own segments"
  ON public.email_segments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = email_segments.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage all segments"
  ON public.email_segments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- ============================================================
-- 13. POLICIES: email_sequences
-- ============================================================

-- Les vendeurs peuvent gérer leurs propres séquences
CREATE POLICY "Store owners can manage own sequences"
  ON public.email_sequences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = email_sequences.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage all sequences"
  ON public.email_sequences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- ============================================================
-- 14. POLICIES: email_sequence_steps
-- ============================================================

-- Les vendeurs peuvent gérer les étapes de leurs séquences
CREATE POLICY "Store owners can manage own sequence steps"
  ON public.email_sequence_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.email_sequences
      JOIN public.stores ON stores.id = email_sequences.store_id
      WHERE email_sequences.id = email_sequence_steps.sequence_id
      AND stores.user_id = auth.uid()
    )
  );

-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage all sequence steps"
  ON public.email_sequence_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- ============================================================
-- 15. POLICIES: email_sequence_enrollments
-- ============================================================

-- Les utilisateurs peuvent voir leurs propres enrollments
CREATE POLICY "Users can view own enrollments"
  ON public.email_sequence_enrollments
  FOR SELECT
  USING (user_id = auth.uid());

-- Les vendeurs peuvent voir les enrollments de leurs séquences
CREATE POLICY "Store owners can view enrollments of own sequences"
  ON public.email_sequence_enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.email_sequences
      JOIN public.stores ON stores.id = email_sequences.store_id
      WHERE email_sequences.id = email_sequence_enrollments.sequence_id
      AND stores.user_id = auth.uid()
    )
  );

-- Le service peut insérer des enrollments (via service role)
CREATE POLICY "Service can insert enrollments"
  ON public.email_sequence_enrollments
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS

-- ============================================================
-- 16. POLICIES: email_user_tags
-- ============================================================

-- Les utilisateurs peuvent voir leurs propres tags
CREATE POLICY "Users can view own tags"
  ON public.email_user_tags
  FOR SELECT
  USING (user_id = auth.uid());

-- Les vendeurs peuvent gérer les tags de leurs utilisateurs
CREATE POLICY "Store owners can manage tags in own store"
  ON public.email_user_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = email_user_tags.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Le service peut insérer des tags (via service role)
CREATE POLICY "Service can insert tags"
  ON public.email_user_tags
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS

-- ============================================================
-- 17. POLICIES: email_unsubscribes
-- ============================================================

-- Tout le monde peut insérer un désabonnement
CREATE POLICY "Anyone can unsubscribe"
  ON public.email_unsubscribes
  FOR INSERT
  WITH CHECK (true);

-- Les admins peuvent voir tous les désabonnements
CREATE POLICY "Admins can view all unsubscribes"
  ON public.email_unsubscribes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Les utilisateurs peuvent voir leurs propres désabonnements
CREATE POLICY "Users can view own unsubscribes"
  ON public.email_unsubscribes
  FOR SELECT
  USING (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================

