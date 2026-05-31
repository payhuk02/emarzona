-- Rich text + email design themes for admin broadcasts
BEGIN;

ALTER TABLE public.admin_broadcasts
  ADD COLUMN IF NOT EXISTS message_html TEXT,
  ADD COLUMN IF NOT EXISTS email_design TEXT NOT NULL DEFAULT 'premium'
    CHECK (email_design IN ('classic', 'premium', 'announcement', 'minimal'));

COMMENT ON COLUMN public.admin_broadcasts.message_html IS 'Contenu HTML (email riche)';
COMMENT ON COLUMN public.admin_broadcasts.email_design IS 'Thème visuel email: classic, premium, announcement, minimal';

COMMIT;
