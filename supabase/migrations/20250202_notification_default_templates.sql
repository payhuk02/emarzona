-- ================================================================
-- Notification System - Default Templates
-- Date: 2 Février 2025
-- Description: Templates par défaut pour tous les types de notifications
-- ================================================================

-- Templates Email par défaut (Français)
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  -- Produits Digitaux
  ('digital_product_purchased', 'Produit Digital Acheté', 'email', 'fr', 
   '✅ Votre achat : {{product_name}}',
   'Bonjour {{user_name}},\n\nVotre achat de "{{product_name}}" a été confirmé.\n\nVous pouvez maintenant télécharger votre produit depuis votre compte.\n\n{{action_url}}',
   '<h2>✅ Votre achat : {{product_name}}</h2><p>Bonjour {{user_name}},</p><p>Votre achat de "<strong>{{product_name}}</strong>" a été confirmé.</p><p>Vous pouvez maintenant télécharger votre produit depuis votre compte.</p><p><a href="{{action_url}}">Télécharger maintenant</a></p>',
   ARRAY['user_name', 'product_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('digital_product_download_ready', 'Téléchargement Prêt', 'email', 'fr',
   '📥 Votre produit est prêt à être téléchargé',
   'Bonjour {{user_name}},\n\nVotre produit "{{product_name}}" est maintenant prêt à être téléchargé.\n\n{{action_url}}',
   '<h2>📥 Votre produit est prêt</h2><p>Bonjour {{user_name}},</p><p>Votre produit "<strong>{{product_name}}</strong>" est maintenant prêt à être téléchargé.</p><p><a href="{{action_url}}">Télécharger</a></p>',
   ARRAY['user_name', 'product_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('digital_product_version_update', 'Mise à Jour Version', 'email', 'fr',
   '🆕 Nouvelle version disponible : {{product_name}}',
   'Bonjour {{user_name}},\n\nUne nouvelle version de "{{product_name}}" est disponible (v{{version}}).\n\n{{changelog}}\n\n{{action_url}}',
   '<h2>🆕 Nouvelle version disponible</h2><p>Bonjour {{user_name}},</p><p>Une nouvelle version de "<strong>{{product_name}}</strong>" est disponible (v{{version}}).</p><p>{{changelog}}</p><p><a href="{{action_url}}">Télécharger la mise à jour</a></p>',
   ARRAY['user_name', 'product_name', 'version', 'changelog', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('digital_product_license_expiring', 'Licence Expire Bientôt', 'email', 'fr',
   '⏰ Votre licence expire bientôt',
   'Bonjour {{user_name}},\n\nVotre licence pour "{{product_name}}" expire dans {{days_left}} jour(s).\n\nRenouvelez maintenant pour continuer à utiliser le produit.\n\n{{action_url}}',
   '<h2>⏰ Votre licence expire bientôt</h2><p>Bonjour {{user_name}},</p><p>Votre licence pour "<strong>{{product_name}}</strong>" expire dans <strong>{{days_left}} jour(s)</strong>.</p><p>Renouvelez maintenant pour continuer à utiliser le produit.</p><p><a href="{{action_url}}">Renouveler</a></p>',
   ARRAY['user_name', 'product_name', 'days_left', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('digital_product_license_expired', 'Licence Expirée', 'email', 'fr',
   '❌ Votre licence a expiré',
   'Bonjour {{user_name}},\n\nVotre licence pour "{{product_name}}" a expiré.\n\nRenouvelez maintenant pour continuer à utiliser le produit.\n\n{{action_url}}',
   '<h2>❌ Votre licence a expiré</h2><p>Bonjour {{user_name}},</p><p>Votre licence pour "<strong>{{product_name}}</strong>" a expiré.</p><p>Renouvelez maintenant pour continuer à utiliser le produit.</p><p><a href="{{action_url}}">Renouveler</a></p>',
   ARRAY['user_name', 'product_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

  -- Produits Physiques
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_order_placed', 'Commande Passée', 'email', 'fr',
   '✅ Commande confirmée #{{order_number}}',
   'Bonjour {{user_name}},\n\nVotre commande #{{order_number}} a été confirmée.\n\nTotal : {{total}} {{currency}}\n\nNous vous tiendrons informé de l''avancement de votre commande.',
   '<h2>✅ Commande confirmée</h2><p>Bonjour {{user_name}},</p><p>Votre commande <strong>#{{order_number}}</strong> a été confirmée.</p><p><strong>Total :</strong> {{total}} {{currency}}</p><p>Nous vous tiendrons informé de l''avancement de votre commande.</p><p><a href="{{action_url}}">Voir la commande</a></p>',
   ARRAY['user_name', 'order_number', 'total', 'currency', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_order_confirmed', 'Commande Confirmée', 'email', 'fr',
   '✅ Commande confirmée #{{order_number}}',
   'Bonjour {{user_name}},\n\nVotre commande #{{order_number}} a été confirmée et est en préparation.\n\n{{action_url}}',
   '<h2>✅ Commande confirmée</h2><p>Bonjour {{user_name}},</p><p>Votre commande <strong>#{{order_number}}</strong> a été confirmée et est en préparation.</p><p><a href="{{action_url}}">Suivre la commande</a></p>',
   ARRAY['user_name', 'order_number', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_order_shipped', 'Commande Expédiée', 'email', 'fr',
   '📦 Votre commande a été expédiée',
   'Bonjour {{user_name}},\n\nVotre commande #{{order_number}} a été expédiée.\n\nNuméro de suivi : {{tracking_number}}\n\n{{action_url}}',
   '<h2>📦 Votre commande a été expédiée</h2><p>Bonjour {{user_name}},</p><p>Votre commande <strong>#{{order_number}}</strong> a été expédiée.</p><p><strong>Numéro de suivi :</strong> {{tracking_number}}</p><p><a href="{{action_url}}">Suivre l''expédition</a></p>',
   ARRAY['user_name', 'order_number', 'tracking_number', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_order_delivered', 'Commande Livrée', 'email', 'fr',
   '🎉 Votre commande a été livrée',
   'Bonjour {{user_name}},\n\nVotre commande #{{order_number}} a été livrée.\n\nNous espérons que vous serez satisfait de votre achat !\n\n{{action_url}}',
   '<h2>🎉 Votre commande a été livrée</h2><p>Bonjour {{user_name}},</p><p>Votre commande <strong>#{{order_number}}</strong> a été livrée.</p><p>Nous espérons que vous serez satisfait de votre achat !</p><p><a href="{{action_url}}">Voir la commande</a></p>',
   ARRAY['user_name', 'order_number', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_order_cancelled', 'Commande Annulée', 'email', 'fr',
   '❌ Commande annulée #{{order_number}}',
   'Bonjour {{user_name}},\n\nVotre commande #{{order_number}} a été annulée.\n\nRaison : {{reason}}\n\n{{action_url}}',
   '<h2>❌ Commande annulée</h2><p>Bonjour {{user_name}},</p><p>Votre commande <strong>#{{order_number}}</strong> a été annulée.</p><p><strong>Raison :</strong> {{reason}}</p><p><a href="{{action_url}}">Voir les détails</a></p>',
   ARRAY['user_name', 'order_number', 'reason', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_low_stock', 'Stock Faible', 'email', 'fr',
   '⚠️ Stock faible : {{product_name}}',
   'Bonjour {{user_name}},\n\nLe produit "{{product_name}}" a un stock faible ({{stock_quantity}} unités restantes).\n\n{{action_url}}',
   '<h2>⚠️ Stock faible</h2><p>Bonjour {{user_name}},</p><p>Le produit "<strong>{{product_name}}</strong>" a un stock faible (<strong>{{stock_quantity}} unités restantes</strong>).</p><p><a href="{{action_url}}">Voir le produit</a></p>',
   ARRAY['user_name', 'product_name', 'stock_quantity', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_out_of_stock', 'Rupture de Stock', 'email', 'fr',
   '❌ Rupture de stock : {{product_name}}',
   'Bonjour {{user_name}},\n\nLe produit "{{product_name}}" est en rupture de stock.\n\n{{action_url}}',
   '<h2>❌ Rupture de stock</h2><p>Bonjour {{user_name}},</p><p>Le produit "<strong>{{product_name}}</strong>" est en rupture de stock.</p><p><a href="{{action_url}}">Voir le produit</a></p>',
   ARRAY['user_name', 'product_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('physical_product_back_in_stock', 'Retour en Stock', 'email', 'fr',
   '✅ {{product_name}} est de retour en stock',
   'Bonjour {{user_name}},\n\nLe produit "{{product_name}}" est de retour en stock !\n\n{{action_url}}',
   '<h2>✅ Retour en stock</h2><p>Bonjour {{user_name}},</p><p>Le produit "<strong>{{product_name}}</strong>" est de retour en stock !</p><p><a href="{{action_url}}">Acheter maintenant</a></p>',
   ARRAY['user_name', 'product_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

  -- Services
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('service_booking_confirmed', 'Réservation Confirmée', 'email', 'fr',
   '✅ Réservation confirmée',
   'Bonjour {{user_name}},\n\nVotre réservation pour "{{service_name}}" a été confirmée.\n\nDate : {{booking_date}}\nHeure : {{booking_time}}\n\n{{action_url}}',
   '<h2>✅ Réservation confirmée</h2><p>Bonjour {{user_name}},</p><p>Votre réservation pour "<strong>{{service_name}}</strong>" a été confirmée.</p><p><strong>Date :</strong> {{booking_date}}<br><strong>Heure :</strong> {{booking_time}}</p><p><a href="{{action_url}}">Voir la réservation</a></p>',
   ARRAY['user_name', 'service_name', 'booking_date', 'booking_time', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('service_booking_reminder', 'Rappel Réservation', 'email', 'fr',
   '⏰ Rappel : Votre réservation approche',
   'Bonjour {{user_name}},\n\nRappel : Votre réservation pour "{{service_name}}" est prévue le {{booking_date}} à {{booking_time}}.\n\n{{action_url}}',
   '<h2>⏰ Rappel de réservation</h2><p>Bonjour {{user_name}},</p><p>Rappel : Votre réservation pour "<strong>{{service_name}}</strong>" est prévue le <strong>{{booking_date}}</strong> à <strong>{{booking_time}}</strong>.</p><p><a href="{{action_url}}">Voir la réservation</a></p>',
   ARRAY['user_name', 'service_name', 'booking_date', 'booking_time', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('service_booking_cancelled', 'Réservation Annulée', 'email', 'fr',
   '❌ Réservation annulée',
   'Bonjour {{user_name}},\n\nVotre réservation pour "{{service_name}}" a été annulée.\n\nRaison : {{reason}}\n\n{{action_url}}',
   '<h2>❌ Réservation annulée</h2><p>Bonjour {{user_name}},</p><p>Votre réservation pour "<strong>{{service_name}}</strong>" a été annulée.</p><p><strong>Raison :</strong> {{reason}}</p><p><a href="{{action_url}}">Voir les détails</a></p>',
   ARRAY['user_name', 'service_name', 'reason', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('service_booking_completed', 'Réservation Terminée', 'email', 'fr',
   '✅ Réservation terminée',
   'Bonjour {{user_name}},\n\nVotre réservation pour "{{service_name}}" a été terminée.\n\nMerci d''avoir utilisé nos services !\n\n{{action_url}}',
   '<h2>✅ Réservation terminée</h2><p>Bonjour {{user_name}},</p><p>Votre réservation pour "<strong>{{service_name}}</strong>" a été terminée.</p><p>Merci d''avoir utilisé nos services !</p><p><a href="{{action_url}}">Laisser un avis</a></p>',
   ARRAY['user_name', 'service_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('service_payment_required', 'Paiement Requis', 'email', 'fr',
   '💳 Paiement requis pour votre réservation',
   'Bonjour {{user_name}},\n\nUn paiement est requis pour votre réservation "{{service_name}}".\n\nMontant : {{amount}} {{currency}}\n\n{{action_url}}',
   '<h2>💳 Paiement requis</h2><p>Bonjour {{user_name}},</p><p>Un paiement est requis pour votre réservation "<strong>{{service_name}}</strong>".</p><p><strong>Montant :</strong> {{amount}} {{currency}}</p><p><a href="{{action_url}}">Payer maintenant</a></p>',
   ARRAY['user_name', 'service_name', 'amount', 'currency', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

  -- Cours
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('course_enrollment', 'Inscription au Cours', 'email', 'fr',
   '🎓 Inscription confirmée : {{course_name}}',
   'Bonjour {{user_name}},\n\nVotre inscription au cours "{{course_name}}" a été confirmée.\n\nCommencez votre apprentissage dès maintenant !\n\n{{action_url}}',
   '<h2>🎓 Inscription confirmée</h2><p>Bonjour {{user_name}},</p><p>Votre inscription au cours "<strong>{{course_name}}</strong>" a été confirmée.</p><p>Commencez votre apprentissage dès maintenant !</p><p><a href="{{action_url}}">Accéder au cours</a></p>',
   ARRAY['user_name', 'course_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('course_lesson_complete', 'Leçon Terminée', 'email', 'fr',
   '✅ Leçon terminée : {{lesson_name}}',
   'Bonjour {{user_name}},\n\nFélicitations ! Vous avez terminé la leçon "{{lesson_name}}".\n\nContinuez votre apprentissage !\n\n{{action_url}}',
   '<h2>✅ Leçon terminée</h2><p>Bonjour {{user_name}},</p><p>Félicitations ! Vous avez terminé la leçon "<strong>{{lesson_name}}</strong>".</p><p>Continuez votre apprentissage !</p><p><a href="{{action_url}}">Leçon suivante</a></p>',
   ARRAY['user_name', 'lesson_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('course_complete', 'Cours Terminé', 'email', 'fr',
   '🎉 Félicitations ! Cours terminé',
   'Bonjour {{user_name}},\n\nFélicitations ! Vous avez terminé le cours "{{course_name}}".\n\nVous avez accompli un excellent travail !\n\n{{action_url}}',
   '<h2>🎉 Félicitations !</h2><p>Bonjour {{user_name}},</p><p>Félicitations ! Vous avez terminé le cours "<strong>{{course_name}}</strong>".</p><p>Vous avez accompli un excellent travail !</p><p><a href="{{action_url}}">Voir le certificat</a></p>',
   ARRAY['user_name', 'course_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('course_certificate_ready', 'Certificat Prêt', 'email', 'fr',
   '🏆 Votre certificat est prêt',
   'Bonjour {{user_name}},\n\nVotre certificat pour le cours "{{course_name}}" est maintenant disponible.\n\n{{action_url}}',
   '<h2>🏆 Votre certificat est prêt</h2><p>Bonjour {{user_name}},</p><p>Votre certificat pour le cours "<strong>{{course_name}}</strong>" est maintenant disponible.</p><p><a href="{{action_url}}">Télécharger le certificat</a></p>',
   ARRAY['user_name', 'course_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('course_new_content', 'Nouveau Contenu', 'email', 'fr',
   '🆕 Nouveau contenu disponible',
   'Bonjour {{user_name}},\n\nDu nouveau contenu est disponible dans le cours "{{course_name}}".\n\n{{content_description}}\n\n{{action_url}}',
   '<h2>🆕 Nouveau contenu disponible</h2><p>Bonjour {{user_name}},</p><p>Du nouveau contenu est disponible dans le cours "<strong>{{course_name}}</strong>".</p><p>{{content_description}}</p><p><a href="{{action_url}}">Voir le nouveau contenu</a></p>',
   ARRAY['user_name', 'course_name', 'content_description', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('course_quiz_passed', 'Quiz Réussi', 'email', 'fr',
   '✅ Quiz réussi : {{quiz_name}}',
   'Bonjour {{user_name}},\n\nFélicitations ! Vous avez réussi le quiz "{{quiz_name}}" avec un score de {{score}}%.\n\n{{action_url}}',
   '<h2>✅ Quiz réussi</h2><p>Bonjour {{user_name}},</p><p>Félicitations ! Vous avez réussi le quiz "<strong>{{quiz_name}}</strong>" avec un score de <strong>{{score}}%</strong>.</p><p><a href="{{action_url}}">Voir les résultats</a></p>',
   ARRAY['user_name', 'quiz_name', 'score', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('course_quiz_failed', 'Quiz Échoué', 'email', 'fr',
   '❌ Quiz échoué : {{quiz_name}}',
   'Bonjour {{user_name}},\n\nVous n''avez pas réussi le quiz "{{quiz_name}}" (score : {{score}}%).\n\nVous pouvez réessayer !\n\n{{action_url}}',
   '<h2>❌ Quiz échoué</h2><p>Bonjour {{user_name}},</p><p>Vous n''avez pas réussi le quiz "<strong>{{quiz_name}}</strong>" (score : <strong>{{score}}%</strong>).</p><p>Vous pouvez réessayer !</p><p><a href="{{action_url}}">Réessayer</a></p>',
   ARRAY['user_name', 'quiz_name', 'score', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

  -- Artistes
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('artist_product_purchased', 'Produit Artiste Acheté', 'email', 'fr',
   '✅ Votre achat : {{product_name}}',
   'Bonjour {{user_name}},\n\nVotre achat de "{{product_name}}" de {{artist_name}} a été confirmé.\n\n{{action_url}}',
   '<h2>✅ Votre achat</h2><p>Bonjour {{user_name}},</p><p>Votre achat de "<strong>{{product_name}}</strong>" de <strong>{{artist_name}}</strong> a été confirmé.</p><p><a href="{{action_url}}">Voir le produit</a></p>',
   ARRAY['user_name', 'product_name', 'artist_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('artist_product_certificate_ready', 'Certificat d''Authenticité Prêt', 'email', 'fr',
   '🏆 Certificat d''authenticité disponible',
   'Bonjour {{user_name}},\n\nVotre certificat d''authenticité pour "{{product_name}}" est maintenant disponible.\n\n{{action_url}}',
   '<h2>🏆 Certificat d''authenticité disponible</h2><p>Bonjour {{user_name}},</p><p>Votre certificat d''authenticité pour "<strong>{{product_name}}</strong>" est maintenant disponible.</p><p><a href="{{action_url}}">Télécharger le certificat</a></p>',
   ARRAY['user_name', 'product_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('artist_product_edition_sold_out', 'Édition Épuisée', 'email', 'fr',
   '⚠️ Édition épuisée : {{product_name}}',
   'Bonjour {{user_name}},\n\nL''édition "{{edition_name}}" de "{{product_name}}" est maintenant épuisée.\n\n{{action_url}}',
   '<h2>⚠️ Édition épuisée</h2><p>Bonjour {{user_name}},</p><p>L''édition "<strong>{{edition_name}}</strong>" de "<strong>{{product_name}}</strong>" est maintenant épuisée.</p><p><a href="{{action_url}}">Voir d''autres éditions</a></p>',
   ARRAY['user_name', 'product_name', 'edition_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('artist_product_shipping_update', 'Mise à Jour Expédition', 'email', 'fr',
   '📦 Mise à jour d''expédition',
   'Bonjour {{user_name}},\n\nMise à jour concernant l''expédition de "{{product_name}}".\n\n{{shipping_status}}\n\n{{action_url}}',
   '<h2>📦 Mise à jour d''expédition</h2><p>Bonjour {{user_name}},</p><p>Mise à jour concernant l''expédition de "<strong>{{product_name}}</strong>".</p><p>{{shipping_status}}</p><p><a href="{{action_url}}">Suivre l''expédition</a></p>',
   ARRAY['user_name', 'product_name', 'shipping_status', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

  -- Général
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('order_payment_received', 'Paiement Reçu', 'email', 'fr',
   '✅ Paiement reçu',
   'Bonjour {{user_name}},\n\nVotre paiement de {{amount}} {{currency}} a été confirmé.\n\n{{action_url}}',
   '<h2>✅ Paiement reçu</h2><p>Bonjour {{user_name}},</p><p>Votre paiement de <strong>{{amount}} {{currency}}</strong> a été confirmé.</p><p><a href="{{action_url}}">Voir la transaction</a></p>',
   ARRAY['user_name', 'amount', 'currency', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('order_payment_failed', 'Paiement Échoué', 'email', 'fr',
   '❌ Paiement échoué',
   'Bonjour {{user_name}},\n\nVotre paiement de {{amount}} {{currency}} a échoué.\n\nRaison : {{reason}}\n\n{{action_url}}',
   '<h2>❌ Paiement échoué</h2><p>Bonjour {{user_name}},</p><p>Votre paiement de <strong>{{amount}} {{currency}}</strong> a échoué.</p><p><strong>Raison :</strong> {{reason}}</p><p><a href="{{action_url}}">Réessayer</a></p>',
   ARRAY['user_name', 'amount', 'currency', 'reason', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('order_refund_processed', 'Remboursement Traité', 'email', 'fr',
   '💰 Remboursement traité',
   'Bonjour {{user_name}},\n\nVotre remboursement de {{amount}} {{currency}} a été traité.\n\n{{action_url}}',
   '<h2>💰 Remboursement traité</h2><p>Bonjour {{user_name}},</p><p>Votre remboursement de <strong>{{amount}} {{currency}}</strong> a été traité.</p><p><a href="{{action_url}}">Voir les détails</a></p>',
   ARRAY['user_name', 'amount', 'currency', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('affiliate_commission_earned', 'Commission Gagnée', 'email', 'fr',
   '💰 Commission gagnée',
   'Bonjour {{user_name}},\n\nVous avez gagné une commission de {{amount}} {{currency}}.\n\n{{action_url}}',
   '<h2>💰 Commission gagnée</h2><p>Bonjour {{user_name}},</p><p>Vous avez gagné une commission de <strong>{{amount}} {{currency}}</strong>.</p><p><a href="{{action_url}}">Voir les détails</a></p>',
   ARRAY['user_name', 'amount', 'currency', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('affiliate_commission_paid', 'Commission Payée', 'email', 'fr',
   '✅ Commission payée',
   'Bonjour {{user_name}},\n\nVotre commission de {{amount}} {{currency}} a été payée.\n\n{{action_url}}',
   '<h2>✅ Commission payée</h2><p>Bonjour {{user_name}},</p><p>Votre commission de <strong>{{amount}} {{currency}}</strong> a été payée.</p><p><a href="{{action_url}}">Voir les détails</a></p>',
   ARRAY['user_name', 'amount', 'currency', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('product_review_received', 'Avis Reçu', 'email', 'fr',
   '⭐ Nouvel avis reçu',
   'Bonjour {{user_name}},\n\nUn nouvel avis a été laissé sur votre produit "{{product_name}}".\n\nNote : {{rating}}/5\n\n{{action_url}}',
   '<h2>⭐ Nouvel avis reçu</h2><p>Bonjour {{user_name}},</p><p>Un nouvel avis a été laissé sur votre produit "<strong>{{product_name}}</strong>".</p><p><strong>Note :</strong> {{rating}}/5</p><p><a href="{{action_url}}">Voir l''avis</a></p>',
   ARRAY['user_name', 'product_name', 'rating', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('system_announcement', 'Annonce Système', 'email', 'fr',
   '📢 {{title}}',
   'Bonjour {{user_name}},\n\n{{message}}\n\n{{action_url}}',
   '<h2>📢 {{title}}</h2><p>Bonjour {{user_name}},</p><p>{{message}}</p><p><a href="{{action_url}}">En savoir plus</a></p>',
   ARRAY['user_name', 'title', 'message', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

-- Note: Les templates SMS et Push seront créés dans une migration séparée si nécessaire
-- Pour l'instant, nous créons uniquement les templates email en français

