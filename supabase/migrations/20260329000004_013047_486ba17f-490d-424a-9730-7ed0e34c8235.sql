
-- Fix: Restrict affiliate_clicks insert to authenticated or with valid affiliate_link_id
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Valid affiliate clicks can be inserted" ON public.affiliate_clicks;
CREATE POLICY "Valid affiliate clicks can be inserted" ON public.affiliate_clicks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM affiliate_links WHERE affiliate_links.id = affiliate_clicks.affiliate_link_id AND affiliate_links.is_active = true)
);
