-- ============================================================
-- RLS Phase 1 : Tables CRITIQUES
-- Date: 2025-01-30
-- 
-- Activation RLS et création de politiques pour les tables les plus critiques
-- Priorité : URGENTE - Données sensibles (commandes, paiements, messages)
-- ============================================================

-- ============================================================
-- 1. ORDERS - Commandes
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- SELECT : Clients voient leurs commandes, propriétaires voient les commandes de leur boutique, admins voient tout
CREATE POLICY "orders_select_policy"
  ON orders FOR SELECT
  USING (
    -- Client voit ses propres commandes (via email)
    customer_id IN (
      SELECT id FROM customers 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR
    -- Propriétaire de boutique voit les commandes de sa boutique
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    -- Admin voit tout
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Seulement utilisateurs authentifiés (via application)
CREATE POLICY "orders_insert_policy"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE : Propriétaires de boutique ou admins
CREATE POLICY "orders_update_policy"
  ON orders FOR UPDATE
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Seulement admins
CREATE POLICY "orders_delete_policy"
  ON orders FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 2. ORDER_ITEMS - Articles de commande
-- ============================================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- SELECT : Même logique que orders
CREATE POLICY "order_items_select_policy"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id IN (
        SELECT id FROM customers 
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
         OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- INSERT : Via application lors de la création de commande
CREATE POLICY "order_items_insert_policy"
  ON order_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND order_id IN (
      SELECT id FROM orders
      WHERE customer_id IN (
        SELECT id FROM customers 
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- UPDATE : Propriétaires de boutique ou admins
CREATE POLICY "order_items_update_policy"
  ON order_items FOR UPDATE
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- DELETE : Seulement admins
CREATE POLICY "order_items_delete_policy"
  ON order_items FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 3. PAYMENTS - Paiements
-- ============================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- SELECT : Clients voient leurs paiements, propriétaires voient les paiements de leur boutique, admins voient tout
CREATE POLICY "payments_select_policy"
  ON payments FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR
    order_id IN (
      SELECT id FROM orders
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Via application lors du paiement
CREATE POLICY "payments_insert_policy"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE : Seulement admins ou système
CREATE POLICY "payments_update_policy"
  ON payments FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Seulement admins
CREATE POLICY "payments_delete_policy"
  ON payments FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 4. TRANSACTIONS - Transactions financières
-- ============================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- SELECT : Même logique que payments
CREATE POLICY "transactions_select_policy"
  ON transactions FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Via application
CREATE POLICY "transactions_insert_policy"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE : Seulement admins
CREATE POLICY "transactions_update_policy"
  ON transactions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Seulement admins
CREATE POLICY "transactions_delete_policy"
  ON transactions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 5. CART_ITEMS - Panier
-- ============================================================
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- SELECT : Utilisateur voit son propre panier
CREATE POLICY "cart_items_select_policy"
  ON cart_items FOR SELECT
  USING (user_id = auth.uid());

-- INSERT : Utilisateur peut ajouter à son panier
CREATE POLICY "cart_items_insert_policy"
  ON cart_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE : Utilisateur peut modifier son panier
CREATE POLICY "cart_items_update_policy"
  ON cart_items FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE : Utilisateur peut supprimer de son panier
CREATE POLICY "cart_items_delete_policy"
  ON cart_items FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 6. WISHLIST_ITEMS - Liste de souhaits
-- NOTE: Table non trouvée dans les migrations. Section commentée.
-- Si la table existe, décommenter cette section.
-- ============================================================
-- ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- SELECT : Utilisateur voit sa propre liste
-- CREATE POLICY "wishlist_items_select_policy"
--   ON wishlist_items FOR SELECT
--   USING (user_id = auth.uid());

-- INSERT : Utilisateur peut ajouter à sa liste
-- CREATE POLICY "wishlist_items_insert_policy"
--   ON wishlist_items FOR INSERT
--   WITH CHECK (user_id = auth.uid());

-- UPDATE : Utilisateur peut modifier sa liste
-- CREATE POLICY "wishlist_items_update_policy"
--   ON wishlist_items FOR UPDATE
--   USING (user_id = auth.uid());

-- DELETE : Utilisateur peut supprimer de sa liste
-- CREATE POLICY "wishlist_items_delete_policy"
--   ON wishlist_items FOR DELETE
--   USING (user_id = auth.uid());

-- ============================================================
-- 7. NOTIFICATIONS - Notifications
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SELECT : Utilisateur voit ses propres notifications
CREATE POLICY "notifications_select_policy"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- INSERT : Via application (système)
CREATE POLICY "notifications_insert_policy"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE : Utilisateur peut marquer comme lu
CREATE POLICY "notifications_update_policy"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE : Utilisateur peut supprimer ses notifications
CREATE POLICY "notifications_delete_policy"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 8. MESSAGES - Messages privés
-- NOTE: Table "messages" non trouvée dans la base de données.
-- Les tables existantes sont: vendor_messages, shipping_service_messages
-- Si la table messages existe, décommenter cette section.
-- ============================================================
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- SELECT : Utilisateur voit les messages des conversations où il participe
-- CREATE POLICY "messages_select_policy"
--   ON messages FOR SELECT
--   USING (
--     sender_id = auth.uid()
--     OR
--     conversation_id IN (
--       SELECT id FROM conversations
--       WHERE customer_user_id = auth.uid()
--          OR store_user_id = auth.uid()
--          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--     )
--   );

-- INSERT : Utilisateur peut envoyer des messages
-- CREATE POLICY "messages_insert_policy"
--   ON messages FOR INSERT
--   WITH CHECK (sender_id = auth.uid());

-- UPDATE : Seulement l'expéditeur peut modifier
-- CREATE POLICY "messages_update_policy"
--   ON messages FOR UPDATE
--   USING (sender_id = auth.uid());

-- DELETE : Expéditeur ou participants de la conversation peuvent supprimer
-- CREATE POLICY "messages_delete_policy"
--   ON messages FOR DELETE
--   USING (
--     sender_id = auth.uid()
--     OR
--     conversation_id IN (
--       SELECT id FROM conversations
--       WHERE customer_user_id = auth.uid()
--          OR store_user_id = auth.uid()
--     )
--     OR
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- ============================================================
-- 9. CONVERSATIONS - Conversations
-- NOTE: Table "conversations" non trouvée dans la base de données.
-- Les tables existantes sont: vendor_conversations, shipping_service_conversations
-- Si la table conversations existe, décommenter cette section.
-- ============================================================
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- SELECT : Utilisateur voit les conversations où il participe (client ou propriétaire de boutique)
-- CREATE POLICY "conversations_select_policy"
--   ON conversations FOR SELECT
--   USING (
--     customer_user_id = auth.uid()
--     OR
--     store_user_id = auth.uid()
--     OR
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- INSERT : Clients ou propriétaires de boutique peuvent créer des conversations
-- CREATE POLICY "conversations_insert_policy"
--   ON conversations FOR INSERT
--   WITH CHECK (
--     customer_user_id = auth.uid()
--     OR
--     store_user_id = auth.uid()
--   );

-- UPDATE : Participants peuvent modifier
-- CREATE POLICY "conversations_update_policy"
--   ON conversations FOR UPDATE
--   USING (
--     customer_user_id = auth.uid()
--     OR
--     store_user_id = auth.uid()
--     OR
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- DELETE : Participants ou admins peuvent supprimer
-- CREATE POLICY "conversations_delete_policy"
--   ON conversations FOR DELETE
--   USING (
--     customer_user_id = auth.uid()
--     OR
--     store_user_id = auth.uid()
--     OR
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- ============================================================
-- 10. API_KEYS - Clés API
-- ============================================================
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- SELECT : Propriétaires voient leurs clés, admins voient tout
CREATE POLICY "api_keys_select_policy"
  ON api_keys FOR SELECT
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Propriétaires peuvent créer des clés
CREATE POLICY "api_keys_insert_policy"
  ON api_keys FOR INSERT
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

-- UPDATE : Propriétaires ou admins
CREATE POLICY "api_keys_update_policy"
  ON api_keys FOR UPDATE
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Propriétaires ou admins
CREATE POLICY "api_keys_delete_policy"
  ON api_keys FOR DELETE
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 11. WEBHOOKS - Webhooks
-- ============================================================
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- SELECT : Propriétaires voient leurs webhooks, admins voient tout
CREATE POLICY "webhooks_select_policy"
  ON webhooks FOR SELECT
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Propriétaires peuvent créer des webhooks
CREATE POLICY "webhooks_insert_policy"
  ON webhooks FOR INSERT
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

-- UPDATE : Propriétaires ou admins
CREATE POLICY "webhooks_update_policy"
  ON webhooks FOR UPDATE
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Propriétaires ou admins
CREATE POLICY "webhooks_delete_policy"
  ON webhooks FOR DELETE
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 12. SHIPMENTS - Expéditions
-- ============================================================
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- SELECT : Clients voient leurs expéditions, propriétaires voient les expéditions de leur boutique
CREATE POLICY "shipments_select_policy"
  ON shipments FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id IN (
        SELECT id FROM customers 
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
         OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- INSERT : Via application lors de la création d'expédition
CREATE POLICY "shipments_insert_policy"
  ON shipments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE : Propriétaires ou admins
CREATE POLICY "shipments_update_policy"
  ON shipments FOR UPDATE
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- DELETE : Seulement admins
CREATE POLICY "shipments_delete_policy"
  ON shipments FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 13. PRODUCT_RETURNS - Retours produits
-- ============================================================
ALTER TABLE product_returns ENABLE ROW LEVEL SECURITY;

-- SELECT : Clients voient leurs retours, propriétaires voient les retours de leur boutique
CREATE POLICY "product_returns_select_policy"
  ON product_returns FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Clients peuvent créer des retours
CREATE POLICY "product_returns_insert_policy"
  ON product_returns FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- UPDATE : Propriétaires ou admins
CREATE POLICY "product_returns_update_policy"
  ON product_returns FOR UPDATE
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Seulement admins
CREATE POLICY "product_returns_delete_policy"
  ON product_returns FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 14. SERVICE_BOOKINGS - Réservations de services
-- ============================================================
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

-- SELECT : Clients voient leurs réservations, propriétaires voient les réservations de leur boutique
CREATE POLICY "service_bookings_select_policy"
  ON service_bookings FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT : Clients peuvent créer des réservations
CREATE POLICY "service_bookings_insert_policy"
  ON service_bookings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE : Clients, propriétaires ou admins
CREATE POLICY "service_bookings_update_policy"
  ON service_bookings FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE : Clients peuvent annuler, propriétaires ou admins peuvent supprimer
CREATE POLICY "service_bookings_delete_policy"
  ON service_bookings FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    product_id IN (
      SELECT id FROM products
      WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    )
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Commentaires pour documentation
-- ============================================================
COMMENT ON POLICY "orders_select_policy" ON orders IS 'Clients voient leurs commandes, propriétaires voient les commandes de leur boutique, admins voient tout';
COMMENT ON POLICY "payments_select_policy" ON payments IS 'Clients voient leurs paiements, propriétaires voient les paiements de leur boutique, admins voient tout';
COMMENT ON POLICY "notifications_select_policy" ON notifications IS 'Utilisateurs voient seulement leurs propres notifications';
-- COMMENT ON POLICY "messages_select_policy" ON messages IS 'Utilisateurs voient les messages où ils sont expéditeur ou destinataire';
COMMENT ON POLICY "api_keys_select_policy" ON api_keys IS 'Propriétaires voient leurs clés API, admins voient tout';

