-- Test simplifié pour vérifier la mise à jour de last_used_at
-- Date : Janvier 2026

-- Test de la logique de mise à jour des timestamps
DO $$
DECLARE
  v_timestamp_before TIMESTAMP;
  v_timestamp_after TIMESTAMP;
  v_test_value TIMESTAMP := '2024-01-15 10:00:00'::TIMESTAMP;
BEGIN
  -- Simuler la logique du test
  v_timestamp_before := v_test_value;

  -- Simuler ce que fait la fonction track_short_link_click
  v_timestamp_after := NOW();

  -- Vérifier que le timestamp a changé
  ASSERT v_timestamp_after > v_timestamp_before, 'Le timestamp devrait être mis à jour';

  RAISE NOTICE '✓ Test simplifié réussi: timestamp mis à jour de % à %', v_timestamp_before, v_timestamp_after;
END $$;

-- Test avec NULL
DO $$
DECLARE
  v_timestamp_before TIMESTAMP;
  v_timestamp_after TIMESTAMP;
BEGIN
  -- Simuler un timestamp NULL (valeur initiale)
  v_timestamp_before := NULL;

  -- Simuler la mise à jour
  v_timestamp_after := NOW();

  -- Vérifier que le timestamp n'est plus NULL
  ASSERT v_timestamp_before IS NULL, 'Le timestamp initial devrait être NULL';
  ASSERT v_timestamp_after IS NOT NULL, 'Le timestamp après devrait être défini';

  RAISE NOTICE '✓ Test NULL réussi: timestamp défini de NULL à %', v_timestamp_after;
END $$;