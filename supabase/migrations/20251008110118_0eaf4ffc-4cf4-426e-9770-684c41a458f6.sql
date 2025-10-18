-- Créer la table pour les Pixels utilisateurs
CREATE TABLE public.user_pixels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pixel_type TEXT NOT NULL CHECK (pixel_type IN ('facebook', 'google', 'tiktok', 'pinterest', 'custom')),
  pixel_id TEXT NOT NULL,
  pixel_name TEXT,
  pixel_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour les événements de tracking
CREATE TABLE public.pixel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pixel_id UUID NOT NULL REFERENCES public.user_pixels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('pageview', 'add_to_cart', 'purchase', 'lead')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur user_pixels
ALTER TABLE public.user_pixels ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres Pixels
CREATE POLICY "Users can view their own pixels"
ON public.user_pixels
FOR SELECT
USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent créer leurs propres Pixels
CREATE POLICY "Users can create their own pixels"
ON public.user_pixels
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent modifier leurs propres Pixels
CREATE POLICY "Users can update their own pixels"
ON public.user_pixels
FOR UPDATE
USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres Pixels
CREATE POLICY "Users can delete their own pixels"
ON public.user_pixels
FOR DELETE
USING (auth.uid() = user_id);

-- Activer RLS sur pixel_events
ALTER TABLE public.pixel_events ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres événements
CREATE POLICY "Users can view their own pixel events"
ON public.pixel_events
FOR SELECT
USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent créer leurs propres événements
CREATE POLICY "Users can create their own pixel events"
ON public.pixel_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at sur user_pixels
CREATE TRIGGER update_user_pixels_updated_at
BEFORE UPDATE ON public.user_pixels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_user_pixels_user_id ON public.user_pixels(user_id);
CREATE INDEX idx_user_pixels_active ON public.user_pixels(user_id, is_active);
CREATE INDEX idx_pixel_events_pixel_id ON public.pixel_events(pixel_id);
CREATE INDEX idx_pixel_events_user_id ON public.pixel_events(user_id);
CREATE INDEX idx_pixel_events_created_at ON public.pixel_events(created_at DESC);