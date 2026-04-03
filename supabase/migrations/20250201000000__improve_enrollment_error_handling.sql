-- =====================================================
-- Migration : Amélioration de la gestion d'erreur pour l'enrollment
-- Date: 1er Février 2025
-- Description: Améliore le trigger d'auto-enrollment avec gestion d'erreur et notifications
-- =====================================================

-- Table pour tracker les échecs d'enrollment
CREATE TABLE IF NOT EXISTS public.course_enrollment_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_code TEXT,
  retry_count INTEGER DEFAULT 0,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enrollment_failures_order_id ON public.course_enrollment_failures(order_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_failures_resolved ON public.course_enrollment_failures(resolved);
CREATE INDEX IF NOT EXISTS idx_enrollment_failures_created_at ON public.course_enrollment_failures(created_at DESC);

-- Trigger updated_at
CREATE TRIGGER update_enrollment_failures_updated_at
  BEFORE UPDATE ON public.course_enrollment_failures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.course_enrollment_failures ENABLE ROW LEVEL SECURITY;

-- Les admins et propriétaires de store peuvent voir les échecs
CREATE POLICY "Store owners can view enrollment failures"
  ON public.course_enrollment_failures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = course_enrollment_failures.order_id
      AND s.user_id = auth.uid()
    )
  );

-- Fonction améliorée pour créer automatiquement l'enrollment après paiement
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
  v_error_message TEXT;
  v_error_code TEXT;
  v_retry_count INTEGER;
BEGIN
  -- Vérifier si le paiement est complété
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    
    -- Récupérer les order_items de type 'course' pour cette commande
    FOR v_order_item IN 
      SELECT * FROM order_items 
      WHERE order_id = NEW.id 
      AND product_type = 'course'
    LOOP
      BEGIN
        -- Récupérer le course_id depuis les métadonnées
        v_course_id := (v_order_item.metadata->>'course_id')::UUID;
        v_product_id := v_order_item.product_id;
        
        -- Vérifier que course_id est valide
        IF v_course_id IS NULL THEN
          RAISE WARNING 'Course ID manquant dans les métadonnées de order_item %', v_order_item.id;
          CONTINUE;
        END IF;
        
        -- Récupérer le customer pour obtenir l'user_id
        SELECT * INTO v_customer FROM customers WHERE id = NEW.customer_id;
        
        IF v_customer IS NULL THEN
          RAISE WARNING 'Customer non trouvé pour order %', NEW.id;
          CONTINUE;
        END IF;
        
        -- Trouver l'user_id depuis l'email du customer
        -- Amélioration: aussi chercher via customer.user_id si disponible
        SELECT id INTO v_user_id 
        FROM auth.users 
        WHERE email = v_customer.email
        LIMIT 1;
        
        -- Si user_id n'est pas trouvé via email, essayer de le récupérer depuis customer.user_id
        IF v_user_id IS NULL AND v_customer.user_id IS NOT NULL THEN
          v_user_id := v_customer.user_id;
        END IF;
        
        -- Si l'utilisateur n'existe toujours pas, enregistrer l'erreur
        IF v_user_id IS NULL THEN
          v_error_message := format('Utilisateur non trouvé pour email: %s', v_customer.email);
          v_error_code := 'USER_NOT_FOUND';
          
          -- Enregistrer l'échec
          INSERT INTO course_enrollment_failures (
            order_id,
            course_id,
            product_id,
            customer_email,
            error_message,
            error_code,
            retry_count
          ) VALUES (
            NEW.id,
            v_course_id,
            v_product_id,
            v_customer.email,
            v_error_message,
            v_error_code,
            0
          );
          
          -- Créer une notification pour l'admin (via la table notifications si elle existe)
          -- Note: Cette partie nécessite que la table notifications existe
          BEGIN
            INSERT INTO notifications (
              user_id,
              type,
              title,
              message,
              metadata
            )
            SELECT 
              s.user_id,
              'enrollment_failed',
              'Échec d''inscription automatique',
              format('L''inscription automatique a échoué pour la commande %s. Email: %s', NEW.order_number, v_customer.email),
              jsonb_build_object(
                'order_id', NEW.id,
                'course_id', v_course_id,
                'customer_email', v_customer.email,
                'error', v_error_message
              )
            FROM stores s
            JOIN products p ON p.store_id = s.id
            WHERE p.id = v_product_id
            LIMIT 1;
          EXCEPTION
            WHEN OTHERS THEN
              -- Si la table notifications n'existe pas, ignorer l'erreur
              NULL;
          END;
          
          CONTINUE;
        END IF;
        
        -- Vérifier si déjà inscrit
        IF EXISTS (
          SELECT 1 FROM course_enrollments 
          WHERE course_id = v_course_id 
          AND user_id = v_user_id
        ) THEN
          -- Déjà inscrit, pas d'erreur, juste continuer
          CONTINUE;
        END IF;
        
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
        
      EXCEPTION
        WHEN OTHERS THEN
          -- En cas d'erreur, enregistrer dans course_enrollment_failures
          v_error_message := SQLERRM;
          v_error_code := SQLSTATE;
          
          -- Vérifier si un échec existe déjà pour cette commande
          SELECT retry_count INTO v_retry_count
          FROM course_enrollment_failures
          WHERE order_id = NEW.id
          AND course_id = v_course_id
          AND resolved = false
          ORDER BY created_at DESC
          LIMIT 1;
          
          IF v_retry_count IS NULL THEN
            v_retry_count := 0;
          END IF;
          
          -- Enregistrer ou mettre à jour l'échec
          INSERT INTO course_enrollment_failures (
            order_id,
            course_id,
            product_id,
            user_id,
            customer_email,
            error_message,
            error_code,
            retry_count
          ) VALUES (
            NEW.id,
            v_course_id,
            v_product_id,
            v_user_id,
            COALESCE(v_customer.email, 'unknown'),
            v_error_message,
            v_error_code,
            v_retry_count
          )
          ON CONFLICT DO NOTHING;
          
          -- Créer une notification pour l'admin
          BEGIN
            INSERT INTO notifications (
              user_id,
              type,
              title,
              message,
              metadata
            )
            SELECT 
              s.user_id,
              'enrollment_failed',
              'Erreur d''inscription automatique',
              format('Erreur lors de l''inscription automatique pour la commande %s: %s', NEW.order_number, v_error_message),
              jsonb_build_object(
                'order_id', NEW.id,
                'course_id', v_course_id,
                'error', v_error_message,
                'error_code', v_error_code
              )
            FROM stores s
            JOIN products p ON p.store_id = s.id
            WHERE p.id = v_product_id
            LIMIT 1;
          EXCEPTION
            WHEN OTHERS THEN
              -- Si la table notifications n'existe pas, ignorer l'erreur
              NULL;
          END;
          
          -- Continuer avec le prochain order_item
          CONTINUE;
      END;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour réessayer l'enrollment manuellement
CREATE OR REPLACE FUNCTION retry_course_enrollment(p_failure_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_failure RECORD;
  v_user_id UUID;
  v_lessons_count INTEGER;
  v_enrollment_id UUID;
  v_result JSONB;
BEGIN
  -- Récupérer l'échec
  SELECT * INTO v_failure
  FROM course_enrollment_failures
  WHERE id = p_failure_id
  AND resolved = false;
  
  IF v_failure IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Échec non trouvé ou déjà résolu'
    );
  END IF;
  
  -- Trouver l'utilisateur
  IF v_failure.user_id IS NOT NULL THEN
    v_user_id := v_failure.user_id;
  ELSE
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_failure.customer_email
    LIMIT 1;
  END IF;
  
  IF v_user_id IS NULL THEN
    -- Mettre à jour le retry_count
    UPDATE course_enrollment_failures
    SET retry_count = retry_count + 1,
        updated_at = NOW()
    WHERE id = p_failure_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;
  
  -- Vérifier si déjà inscrit
  IF EXISTS (
    SELECT 1 FROM course_enrollments
    WHERE course_id = v_failure.course_id
    AND user_id = v_user_id
  ) THEN
    -- Marquer comme résolu
    UPDATE course_enrollment_failures
    SET resolved = true,
        resolved_at = NOW(),
        resolved_by = auth.uid()
    WHERE id = p_failure_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Utilisateur déjà inscrit'
    );
  END IF;
  
  -- Compter les leçons
  SELECT COUNT(*) INTO v_lessons_count
  FROM course_lessons
  WHERE course_id = v_failure.course_id;
  
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
    v_failure.course_id,
    v_failure.product_id,
    v_user_id,
    v_failure.order_id,
    'active',
    v_lessons_count,
    0,
    NOW()
  )
  RETURNING id INTO v_enrollment_id;
  
  -- Marquer comme résolu
  UPDATE course_enrollment_failures
  SET resolved = true,
      resolved_at = NOW(),
      resolved_by = auth.uid()
  WHERE id = p_failure_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', v_enrollment_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Mettre à jour le retry_count
    UPDATE course_enrollment_failures
    SET retry_count = retry_count + 1,
        error_message = SQLERRM,
        error_code = SQLSTATE,
        updated_at = NOW()
    WHERE id = p_failure_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Commentaires
COMMENT ON TABLE course_enrollment_failures IS 'Table pour tracker les échecs d''inscription automatique aux cours';
COMMENT ON FUNCTION auto_enroll_course_on_payment() IS 'Crée automatiquement l''enrollment pour les cours après paiement réussi avec gestion d''erreur améliorée';
COMMENT ON FUNCTION retry_course_enrollment(UUID) IS 'Réessaie manuellement l''enrollment pour un échec enregistré';

