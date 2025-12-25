-- Migration: Fonction de vérification de cohérence des données
-- Date: 31 Janvier 2025
-- Description: Crée une fonction pour vérifier la cohérence entre transactions, orders et payments

-- Fonction pour vérifier la cohérence des données
CREATE OR REPLACE FUNCTION public.check_transaction_consistency()
RETURNS TABLE(
  issue_type TEXT,
  transaction_id UUID,
  order_id UUID,
  payment_id UUID,
  description TEXT,
  severity TEXT
) AS $$
BEGIN
  -- Vérifier les transactions sans order_id mais avec order_id dans metadata
  RETURN QUERY
  SELECT 
    'transaction_missing_order'::TEXT,
    t.id,
    t.order_id,
    t.payment_id,
    'Transaction completed but order_id is NULL'::TEXT,
    'high'::TEXT
  FROM transactions t
  WHERE t.status = 'completed'
    AND t.order_id IS NULL
    AND t.metadata->>'order_id' IS NOT NULL;

  -- Vérifier les transactions avec order_id mais l'order n'existe pas
  RETURN QUERY
  SELECT 
    'transaction_invalid_order'::TEXT,
    t.id,
    t.order_id,
    t.payment_id,
    'Transaction references non-existent order'::TEXT,
    'high'::TEXT
  FROM transactions t
  WHERE t.order_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = t.order_id);

  -- Vérifier les incohérences de montant
  RETURN QUERY
  SELECT 
    'amount_mismatch'::TEXT,
    t.id,
    t.order_id,
    t.payment_id,
    format('Transaction amount (%s) does not match order total (%s)', t.amount, o.total_amount)::TEXT,
    'medium'::TEXT
  FROM transactions t
  JOIN orders o ON o.id = t.order_id
  WHERE t.status = 'completed'
    AND ABS(t.amount - o.total_amount) > 0.01;

  -- Vérifier les transactions complétées mais l'order n'est pas payé
  RETURN QUERY
  SELECT 
    'order_not_paid'::TEXT,
    t.id,
    t.order_id,
    t.payment_id,
    'Transaction completed but order payment_status is not paid'::TEXT,
    'high'::TEXT
  FROM transactions t
  JOIN orders o ON o.id = t.order_id
  WHERE t.status = 'completed'
    AND o.payment_status != 'paid';

  -- Vérifier les commissions sans transaction associée
  RETURN QUERY
  SELECT 
    'commission_missing_transaction'::TEXT,
    NULL::UUID,
    ac.order_id,
    ac.payment_id,
    format('Affiliate commission for order %s has no associated transaction', ac.order_id)::TEXT,
    'medium'::TEXT
  FROM affiliate_commissions ac
  WHERE ac.payment_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM transactions t 
      WHERE t.id = ac.payment_id OR t.order_id = ac.order_id
    );

  -- Vérifier les commissions de referral sans transaction associée
  RETURN QUERY
  SELECT 
    'referral_commission_missing_transaction'::TEXT,
    NULL::UUID,
    rc.order_id,
    rc.payment_id,
    format('Referral commission for order %s has no associated transaction', rc.order_id)::TEXT,
    'medium'::TEXT
  FROM referral_commissions rc
  WHERE rc.payment_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM transactions t 
      WHERE t.id = rc.payment_id OR t.order_id = rc.order_id
    );

  -- Vérifier les transactions avec status completed mais pas de completed_at
  RETURN QUERY
  SELECT 
    'missing_completed_at'::TEXT,
    t.id,
    t.order_id,
    t.payment_id,
    'Transaction status is completed but completed_at is NULL'::TEXT,
    'low'::TEXT
  FROM transactions t
  WHERE t.status = 'completed'
    AND t.completed_at IS NULL;

  -- Vérifier les transactions avec status failed mais pas de failed_at
  RETURN QUERY
  SELECT 
    'missing_failed_at'::TEXT,
    t.id,
    t.order_id,
    t.payment_id,
    'Transaction status is failed but failed_at is NULL'::TEXT,
    'low'::TEXT
  FROM transactions t
  WHERE t.status = 'failed'
    AND t.failed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer un rapport de cohérence
CREATE OR REPLACE FUNCTION public.generate_consistency_report()
RETURNS JSONB AS $$
DECLARE
  v_report JSONB;
  v_issues JSONB;
BEGIN
  -- Collecter tous les problèmes
  SELECT jsonb_agg(
    jsonb_build_object(
      'issue_type', issue_type,
      'transaction_id', transaction_id,
      'order_id', order_id,
      'payment_id', payment_id,
      'description', description,
      'severity', severity
    )
  )
  INTO v_issues
  FROM check_transaction_consistency();

  -- Construire le rapport
  v_report := jsonb_build_object(
    'generated_at', NOW(),
    'total_issues', jsonb_array_length(COALESCE(v_issues, '[]'::jsonb)),
    'issues_by_severity', (
      SELECT jsonb_build_object(
        'high', COUNT(*) FILTER (WHERE severity = 'high'),
        'medium', COUNT(*) FILTER (WHERE severity = 'medium'),
        'low', COUNT(*) FILTER (WHERE severity = 'low')
      )
      FROM check_transaction_consistency()
    ),
    'issues', COALESCE(v_issues, '[]'::jsonb)
  );

  RETURN v_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON FUNCTION public.check_transaction_consistency IS 'Vérifie la cohérence des données entre transactions, orders et payments';
COMMENT ON FUNCTION public.generate_consistency_report IS 'Génère un rapport JSON de toutes les incohérences détectées';







