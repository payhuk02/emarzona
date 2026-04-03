-- Create customers table FIRST
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  notes TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table AFTER customers
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Store owners can view their customers"
ON public.customers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = customers.store_id
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can create customers"
ON public.customers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = customers.store_id
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can update their customers"
ON public.customers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = customers.store_id
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can delete their customers"
ON public.customers FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = customers.store_id
    AND stores.user_id = auth.uid()
  )
);

-- RLS Policies for orders
CREATE POLICY "Store owners can view their orders"
ON public.orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = orders.store_id
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can create orders"
ON public.orders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = orders.store_id
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can update their orders"
ON public.orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = orders.store_id
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can delete their orders"
ON public.orders FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = orders.store_id
    AND stores.user_id = auth.uid()
  )
);

-- RLS Policies for order_items
CREATE POLICY "Store owners can view order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    JOIN public.stores ON stores.id = orders.store_id
    WHERE orders.id = order_items.order_id
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can create order items"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    JOIN public.stores ON stores.id = orders.store_id
    WHERE orders.id = order_items.order_id
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can update order items"
ON public.order_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    JOIN public.stores ON stores.id = orders.store_id
    WHERE orders.id = order_items.order_id
    AND stores.user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can delete order items"
ON public.order_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    JOIN public.stores ON stores.id = orders.store_id
    WHERE orders.id = order_items.order_id
    AND stores.user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_customers_store_id ON public.customers(store_id);
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_num TEXT;
BEGIN
  order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN order_num;
END;
$$;