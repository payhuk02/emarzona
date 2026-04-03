-- Create promotions table
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL,
  min_purchase_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, code)
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promotions
CREATE POLICY "Store owners can view their promotions"
ON public.promotions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = promotions.store_id
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can create promotions"
ON public.promotions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = promotions.store_id
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can update their promotions"
ON public.promotions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = promotions.store_id
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can delete their promotions"
ON public.promotions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = promotions.store_id
    AND stores.user_id = auth.uid()
  )
);

-- Create index for better performance
CREATE INDEX idx_promotions_store_id ON public.promotions(store_id);
CREATE INDEX idx_promotions_code ON public.promotions(code);

-- Create trigger for updated_at
CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();