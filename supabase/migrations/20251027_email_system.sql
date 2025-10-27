-- Migration: Système d'Email Marketing Universel
-- Date: 27 octobre 2025
-- Description: Templates d'emails et logs pour tous types de produits

-- ============================================================
-- TABLE: email_templates
-- Stocke les templates d'emails (transactionnels + marketing)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identification template
  slug TEXT NOT NULL UNIQUE, -- e.g., 'order-confirmation-digital', 'welcome-user'
  name TEXT NOT NULL, -- Nom descriptif
  category TEXT NOT NULL, -- 'transactional' | 'marketing' | 'notification'
  
  -- Type de produit (universel)
  product_type TEXT, -- 'digital' | 'physical' | 'service' | 'course' | NULL (tous)
  
  -- Contenu template
  subject JSONB NOT NULL, -- Multilingue : {"fr": "Sujet FR", "en": "Subject EN"}
  html_content JSONB NOT NULL, -- Multilingue : {"fr": "<html>...</html>", "en": "<html>...</html>"}
  text_content JSONB, -- Version texte (fallback)
  
  -- Variables dynamiques
  variables JSONB DEFAULT '[]'::jsonb, -- Liste des variables: ["{{user_name}}", "{{order_id}}"]
  
  -- Configuration SendGrid
  sendgrid_template_id TEXT, -- ID template SendGrid (si utilisé)
  from_email TEXT DEFAULT 'noreply@payhuk.com',
  from_name TEXT DEFAULT 'Payhuk',
  reply_to TEXT,
  
  -- Statut
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE, -- Template par défaut pour ce type
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Statistiques (denormalized pour performance)
  sent_count INTEGER DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0.00,
  click_rate DECIMAL(5,2) DEFAULT 0.00
);

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON public.email_templates(slug);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_product_type ON public.email_templates(product_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);

-- Contrainte unique : un seul template par défaut par catégorie + product_type
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_default 
  ON public.email_templates(category, product_type) 
  WHERE is_default = TRUE;

-- ============================================================
-- TABLE: email_logs
-- Historique des emails envoyés
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Template utilisé
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  template_slug TEXT, -- Backup si template supprimé
  
  -- Destinataire
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contenu envoyé
  subject TEXT NOT NULL,
  html_content TEXT,
  text_content TEXT,
  
  -- Contexte métier (universel)
  product_type TEXT, -- 'digital' | 'physical' | 'service' | 'course'
  product_id UUID,
  product_name TEXT,
  order_id UUID,
  store_id UUID,
  
  -- Metadata supplémentaire
  variables JSONB DEFAULT '{}'::jsonb, -- Variables utilisées
  
  -- SendGrid
  sendgrid_message_id TEXT UNIQUE, -- ID unique SendGrid
  sendgrid_status TEXT, -- 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed'
  
  -- Tracking
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  
  -- Statistiques
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Erreurs
  error_message TEXT,
  error_code TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_email_logs_template_id ON public.email_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_product_type ON public.email_logs(product_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_product_id ON public.email_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_order_id ON public.email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sendgrid_message_id ON public.email_logs(sendgrid_message_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_sendgrid_status ON public.email_logs(sendgrid_status);

-- ============================================================
-- TABLE: email_preferences
-- Préférences email des utilisateurs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Préférences par type
  transactional_emails BOOLEAN DEFAULT TRUE, -- Ne peut pas désactiver (légal)
  marketing_emails BOOLEAN DEFAULT TRUE,
  notification_emails BOOLEAN DEFAULT TRUE,
  
  -- Préférences spécifiques
  order_updates BOOLEAN DEFAULT TRUE,
  product_updates BOOLEAN DEFAULT TRUE,
  promotional_emails BOOLEAN DEFAULT TRUE,
  newsletter BOOLEAN DEFAULT TRUE,
  
  -- Fréquence
  email_frequency TEXT DEFAULT 'real-time', -- 'real-time' | 'daily' | 'weekly'
  
  -- Langue préférée
  preferred_language TEXT DEFAULT 'fr', -- 'fr' | 'en' | 'es' | 'pt'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON public.email_preferences(user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function: update_updated_at
-- Mise à jour automatique du timestamp updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS trigger_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER trigger_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_email_logs_updated_at ON public.email_logs;
CREATE TRIGGER trigger_email_logs_updated_at
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_email_preferences_updated_at ON public.email_preferences;
CREATE TRIGGER trigger_email_preferences_updated_at
  BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function: increment_template_sent_count
-- Incrémente le compteur d'envois d'un template
CREATE OR REPLACE FUNCTION public.increment_template_sent_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NOT NULL THEN
    UPDATE public.email_templates
    SET sent_count = sent_count + 1
    WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour compteur
DROP TRIGGER IF EXISTS trigger_increment_sent_count ON public.email_logs;
CREATE TRIGGER trigger_increment_sent_count
  AFTER INSERT ON public.email_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_template_sent_count();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activer RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- POLICIES: email_templates

-- Admins/Staff peuvent tout faire
CREATE POLICY "Admins can manage templates"
  ON public.email_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Tous peuvent voir les templates actifs (pour preview)
CREATE POLICY "Anyone can view active templates"
  ON public.email_templates
  FOR SELECT
  USING (is_active = TRUE);

-- POLICIES: email_logs

-- Admins peuvent voir tous les logs
CREATE POLICY "Admins can view all logs"
  ON public.email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Users peuvent voir leurs propres logs
CREATE POLICY "Users can view own logs"
  ON public.email_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Backend peut insérer des logs (via service role)
CREATE POLICY "Service role can insert logs"
  ON public.email_logs
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS

-- POLICIES: email_preferences

-- Users peuvent voir/modifier leurs propres préférences
CREATE POLICY "Users can manage own preferences"
  ON public.email_preferences
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Créer préférences par défaut au signup
CREATE POLICY "Users can insert own preferences"
  ON public.email_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- SEED DATA: Templates par défaut
-- ============================================================

-- Template: Welcome Email (Universel)
INSERT INTO public.email_templates (slug, name, category, product_type, subject, html_content, variables, is_active, is_default)
VALUES (
  'welcome-user',
  'Email de bienvenue utilisateur',
  'transactional',
  NULL, -- Universel
  '{"fr": "Bienvenue sur Payhuk ! 🎉", "en": "Welcome to Payhuk! 🎉"}',
  '{"fr": "<h1>Bienvenue {{user_name}} !</h1><p>Merci de rejoindre Payhuk...</p>", "en": "<h1>Welcome {{user_name}}!</h1><p>Thank you for joining Payhuk...</p>"}',
  '["{{user_name}}", "{{user_email}}"]'::jsonb,
  TRUE,
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Template: Order Confirmation - Digital
INSERT INTO public.email_templates (slug, name, category, product_type, subject, html_content, variables, is_active, is_default)
VALUES (
  'order-confirmation-digital',
  'Confirmation de commande - Produit Digital',
  'transactional',
  'digital',
  '{"fr": "Commande confirmée - Téléchargez votre produit 📥", "en": "Order Confirmed - Download Your Product 📥"}',
  '{"fr": "<h1>Merci {{user_name}} !</h1><p>Commande #{{order_id}}</p><p>Produit: {{product_name}}</p><p><a href=\"{{download_link}}\">Télécharger maintenant</a></p>", "en": "<h1>Thank you {{user_name}}!</h1><p>Order #{{order_id}}</p><p>Product: {{product_name}}</p><p><a href=\"{{download_link}}\">Download Now</a></p>"}',
  '["{{user_name}}", "{{order_id}}", "{{product_name}}", "{{download_link}}"]'::jsonb,
  TRUE,
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Template: Order Confirmation - Physical
INSERT INTO public.email_templates (slug, name, category, product_type, subject, html_content, variables, is_active, is_default)
VALUES (
  'order-confirmation-physical',
  'Confirmation de commande - Produit Physique',
  'transactional',
  'physical',
  '{"fr": "Commande confirmée - Expédition en cours 📦", "en": "Order Confirmed - Shipping Soon 📦"}',
  '{"fr": "<h1>Merci {{user_name}} !</h1><p>Commande #{{order_id}}</p><p>Produit: {{product_name}}</p><p>Livraison estimée: {{delivery_date}}</p><p>Adresse: {{shipping_address}}</p>", "en": "<h1>Thank you {{user_name}}!</h1><p>Order #{{order_id}}</p><p>Product: {{product_name}}</p><p>Estimated delivery: {{delivery_date}}</p><p>Address: {{shipping_address}}</p>"}',
  '["{{user_name}}", "{{order_id}}", "{{product_name}}", "{{delivery_date}}", "{{shipping_address}}"]'::jsonb,
  TRUE,
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Autres templates seront ajoutés via l'application ou migrations suivantes

COMMENT ON TABLE public.email_templates IS 'Templates d''emails universels pour tous types de produits';
COMMENT ON TABLE public.email_logs IS 'Historique des emails envoyés avec tracking';
COMMENT ON TABLE public.email_preferences IS 'Préférences email des utilisateurs';

