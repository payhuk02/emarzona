-- Epic 1.1 — buckets payants doivent être private
DO $$
DECLARE
  v_row RECORD;
  v_fail INT := 0;
BEGIN
  FOR v_row IN
    SELECT b.id, b.public
    FROM storage.buckets b
    WHERE b.id IN ('products', 'digital-files', 'course-content', 'attachments')
    ORDER BY b.id
  LOOP
    IF v_row.public THEN
      RAISE WARNING '❌ bucket % is PUBLIC', v_row.id;
      v_fail := v_fail + 1;
    ELSE
      RAISE NOTICE '✓ bucket % is private', v_row.id;
    END IF;
  END LOOP;

  IF v_fail > 0 THEN
    RAISE EXCEPTION 'audit-storage-public failed: % public paid bucket(s)', v_fail;
  END IF;

  RAISE NOTICE '✓ audit-storage-public: all checked buckets are private';
END $$;
