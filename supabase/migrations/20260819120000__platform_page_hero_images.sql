-- Hero image overrides for public marketing pages (Solutions / Features).
-- Intentionally does NOT alter storage.objects (causes deadlocks on hosted Postgres).
-- Uploads reuse existing platform-assets admin policies.

CREATE TABLE IF NOT EXISTS public.platform_page_hero_images (
  slug text PRIMARY KEY,
  image_url text NOT NULL,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_page_hero_images_slug_format CHECK (
    slug ~ '^(solutions|features)\.[a-z0-9-]+$'
  ),
  CONSTRAINT platform_page_hero_images_url_len CHECK (
    char_length(image_url) BETWEEN 1 AND 2048
  )
);

COMMENT ON TABLE public.platform_page_hero_images IS
  'Admin overrides for marketing page hero images. Missing slug = bundled default.';

ALTER TABLE public.platform_page_hero_images ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_page_hero_images'
      AND policyname = 'platform_page_hero_images_select_public'
  ) THEN
    CREATE POLICY platform_page_hero_images_select_public
      ON public.platform_page_hero_images
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_page_hero_images'
      AND policyname = 'platform_page_hero_images_insert_admin'
  ) THEN
    CREATE POLICY platform_page_hero_images_insert_admin
      ON public.platform_page_hero_images
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_platform_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_page_hero_images'
      AND policyname = 'platform_page_hero_images_update_admin'
  ) THEN
    CREATE POLICY platform_page_hero_images_update_admin
      ON public.platform_page_hero_images
      FOR UPDATE
      TO authenticated
      USING (public.is_platform_admin())
      WITH CHECK (public.is_platform_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_page_hero_images'
      AND policyname = 'platform_page_hero_images_delete_admin'
  ) THEN
    CREATE POLICY platform_page_hero_images_delete_admin
      ON public.platform_page_hero_images
      FOR DELETE
      TO authenticated
      USING (public.is_platform_admin());
  END IF;
END $$;

GRANT SELECT ON public.platform_page_hero_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.platform_page_hero_images TO authenticated;
