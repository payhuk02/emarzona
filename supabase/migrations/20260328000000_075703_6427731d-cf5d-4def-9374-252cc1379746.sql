
-- Allow admins to view all stores (for admin dashboard)
CREATE POLICY "Admins can view all stores"
  ON public.stores FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
