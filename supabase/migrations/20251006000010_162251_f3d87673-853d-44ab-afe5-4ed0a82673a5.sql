-- Harmless comments to trigger type regeneration for all existing tables
COMMENT ON TABLE public.stores IS 'Stores table for user storefronts';
COMMENT ON TABLE public.products IS 'Products table with digital goods metadata';
COMMENT ON TABLE public.customers IS 'Customers belonging to a store';
COMMENT ON TABLE public.orders IS 'Orders placed in a store';
COMMENT ON TABLE public.order_items IS 'Line items for orders';
COMMENT ON TABLE public.payments IS 'Payments associated with orders or customers';
COMMENT ON TABLE public.promotions IS 'Promotional codes and rules';
COMMENT ON TABLE public.reviews IS 'Product reviews by users';