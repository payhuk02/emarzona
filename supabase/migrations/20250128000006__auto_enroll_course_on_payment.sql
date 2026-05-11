-- =====================================================
-- Migration : Auto-enrollment pour cours après paiement
-- Date: 28 Janvier 2025
-- Description: Crée automatiquement l'enrollment après paiement réussi
-- =====================================================

-- Fonction pour créer automatiquement l'enrollment après paiement
CREATE OR REPLACE FUNCTION auto_enroll_course_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_order_item RECORD;
  v_course_id UUID;
  v_product_id UUID;
  v_user_id UUID;
  v_customer RECORD;
  v_lessons_count INTEGER;
  v_enrollment_id UUID;
BEGIN
  -- Vérifier si le paiement est complété
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    
    -- Récupérer les order_items de type 'course' pour cette commande
    FOR v_order_item IN 
      SELECT * FROM order_items 
      WHERE order_id = NEW.id 
      AND product_type = 'course'
    LOOP
      -- Récupérer le course_id depuis les métadonnées
      v_course_id := (v_order_item.metadata->>'course_id')::UUID;
      v_product_id := v_order_item.product_id;
      
      -- Récupérer le customer pour obtenir l'user_id
      SELECT * INTO v_customer FROM customers WHERE id = NEW.customer_id;
      
      -- Trouver l'user_id depuis l'email du customer
      SELECT id INTO v_user_id 
      FROM auth.users 
      WHERE email = v_customer.email;
      
      -- Si l'utilisateur existe et n'est pas déjà inscrit
      IF v_user_id IS NOT NULL AND v_course_id IS NOT NULL THEN
        -- Vérifier si déjà inscrit
        IF NOT EXISTS (
          SELECT 1 FROM course_enrollments 
          WHERE course_id = v_course_id 
          AND user_id = v_user_id
        ) THEN
          -- Compter les leçons
          SELECT COUNT(*) INTO v_lessons_count
          FROM course_lessons
          WHERE course_id = v_course_id;
          
          -- Créer l'enrollment
          INSERT INTO course_enrollments (
            course_id,
            product_id,
            user_id,
            order_id,
            status,
            total_lessons,
            progress_percentage,
            enrollment_date
          ) VALUES (
            v_course_id,
            v_product_id,
            v_user_id,
            NEW.id,
            'active',
            v_lessons_count,
            0,
            NOW()
          )
          RETURNING id INTO v_enrollment_id;
          
          -- Log pour debugging
          RAISE NOTICE 'Auto-enrollment créé: enrollment_id=%, course_id=%, user_id=%', 
            v_enrollment_id, v_course_id, v_user_id;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_auto_enroll_course_on_payment ON orders;
CREATE TRIGGER trigger_auto_enroll_course_on_payment
  AFTER UPDATE OF payment_status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_enroll_course_on_payment();

-- Commentaire
COMMENT ON FUNCTION auto_enroll_course_on_payment() IS 'Crée automatiquement l''enrollment pour les cours après paiement réussi';
COMMENT ON TRIGGER trigger_auto_enroll_course_on_payment ON orders IS 'Déclenche l''auto-enrollment après paiement complété';

