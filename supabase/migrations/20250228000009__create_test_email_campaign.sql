-- =========================================================
-- Script de Test : Création d'une Campagne Email de Test
-- Date : 30 Janvier 2025
-- Description : Crée une campagne email de test pour valider le cycle complet
-- =========================================================

-- IMPORTANT: Ce script est destiné aux tests uniquement
-- Exécutez-le dans Supabase SQL Editor pour créer une campagne de test

-- =========================================================
-- ÉTAPE 1 : Créer un Template Email de Test (si nécessaire)
-- =========================================================

DO $$
DECLARE
  test_template_id UUID;
  test_store_id UUID;
  test_campaign_id UUID;
  scheduled_time TIMESTAMPTZ;
BEGIN
  -- Récupérer le premier store disponible
  SELECT id INTO test_store_id
  FROM public.stores
  LIMIT 1;
  
  IF test_store_id IS NULL THEN
    RAISE EXCEPTION 'Aucun store trouvé. Créez d''abord un store.';
  END IF;
  
  RAISE NOTICE 'Store ID utilisé: %', test_store_id;
  
  -- Vérifier si un template de test existe déjà
  SELECT id INTO test_template_id
  FROM public.email_templates
  WHERE slug = 'test-campaign-template'
  LIMIT 1;
  
  -- Créer le template s'il n'existe pas
  IF test_template_id IS NULL THEN
    INSERT INTO public.email_templates (
      slug,
      name,
      category,
      subject,
      html_content,
      text_content,
      variables,
      from_email,
      from_name,
      is_active,
      is_default
    ) VALUES (
      'test-campaign-template',
      'Template de Test - Campagne Email',
      'marketing',
      '{"fr": "Test de Campagne Email - Emarzona", "en": "Email Campaign Test - Emarzona"}'::jsonb,
      '{"fr": "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\"><h1 style=\"color: #333;\">Test de Campagne Email</h1><p>Bonjour {{user_name}},</p><p>Ceci est un email de test pour valider le système d''emailing d''Emarzona.</p><p>Si vous recevez cet email, cela signifie que le système fonctionne correctement !</p><p style=\"margin-top: 30px; color: #666; font-size: 12px;\">Cet email a été envoyé automatiquement par le système de test.</p></body></html>", "en": "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\"><h1 style=\"color: #333;\">Email Campaign Test</h1><p>Hello {{user_name}},</p><p>This is a test email to validate the Emarzona emailing system.</p><p>If you receive this email, it means the system is working correctly!</p><p style=\"margin-top: 30px; color: #666; font-size: 12px;\">This email was automatically sent by the test system.</p></body></html>"}'::jsonb,
      '{"fr": "Test de Campagne Email\n\nBonjour {{user_name}},\n\nCeci est un email de test pour valider le système d''emailing d''Emarzona.\n\nSi vous recevez cet email, cela signifie que le système fonctionne correctement !\n\nCet email a été envoyé automatiquement par le système de test.", "en": "Email Campaign Test\n\nHello {{user_name}},\n\nThis is a test email to validate the Emarzona emailing system.\n\nIf you receive this email, it means the system is working correctly!\n\nThis email was automatically sent by the test system."}'::jsonb,
      '["{{user_name}}"]'::jsonb,
      'noreply@emarzona.com',
      'Emarzona Test',
      TRUE,
      FALSE
    )
    RETURNING id INTO test_template_id;
    
    RAISE NOTICE 'Template de test créé avec l''ID: %', test_template_id;
  ELSE
    RAISE NOTICE 'Template de test existant trouvé avec l''ID: %', test_template_id;
  END IF;
  
  -- =========================================================
  -- ÉTAPE 2 : Créer une Campagne de Test Programmé
  -- =========================================================
  
  -- Programmer la campagne dans 5 minutes
  scheduled_time := NOW() + INTERVAL '5 minutes';
  
  -- Supprimer les anciennes campagnes de test (optionnel)
  DELETE FROM public.email_campaigns
  WHERE name LIKE 'TEST - %'
    AND store_id = test_store_id;
  
  -- Créer la campagne de test
  INSERT INTO public.email_campaigns (
    store_id,
    name,
    description,
    type,
    template_id,
    status,
    scheduled_at,
    send_at_timezone,
    audience_type,
    audience_filters,
    estimated_recipients,
    ab_test_enabled,
    metrics
  ) VALUES (
    test_store_id,
    'TEST - Campagne Email Automatique',
    'Campagne de test créée automatiquement pour valider le système d''emailing. Cette campagne sera envoyée automatiquement par le cron job.',
    'promotional',
    test_template_id,
    'scheduled',
    scheduled_time,
    'Africa/Dakar',
    'filter',
    '{"test": true}'::jsonb,
    1, -- Estimation: 1 destinataire (vous)
    FALSE,
    '{
      "sent": 0,
      "delivered": 0,
      "opened": 0,
      "clicked": 0,
      "bounced": 0,
      "unsubscribed": 0,
      "revenue": 0
    }'::jsonb
  )
  RETURNING id INTO test_campaign_id;
  
  RAISE NOTICE '=========================================================';
  RAISE NOTICE '✅ Campagne de test créée avec succès !';
  RAISE NOTICE '=========================================================';
  RAISE NOTICE 'Campagne ID: %', test_campaign_id;
  RAISE NOTICE 'Template ID: %', test_template_id;
  RAISE NOTICE 'Store ID: %', test_store_id;
  RAISE NOTICE 'Programmée pour: %', scheduled_time;
  RAISE NOTICE '=========================================================';
  RAISE NOTICE 'Le cron job s''exécute toutes les 5 minutes.';
  RAISE NOTICE 'La campagne sera traitée automatiquement.';
  RAISE NOTICE '=========================================================';
  
END $$;

-- =========================================================
-- VÉRIFICATION : Afficher la campagne créée
-- =========================================================

SELECT 
  id,
  name,
  description,
  type,
  status,
  scheduled_at,
  send_at_timezone,
  audience_type,
  estimated_recipients,
  template_id,
  metrics,
  created_at
FROM public.email_campaigns
WHERE name LIKE 'TEST - %'
ORDER BY created_at DESC
LIMIT 1;

