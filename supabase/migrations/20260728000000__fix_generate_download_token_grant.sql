-- ============================================================================
-- MIGRATION: Fix generate_download_token execute permissions
-- Date: 2026-07-28
-- Description: Grant execute to anon and authenticated roles for digital download token generation
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.generate_download_token(UUID, TEXT, UUID, UUID, INTEGER) TO authenticated, anon;
