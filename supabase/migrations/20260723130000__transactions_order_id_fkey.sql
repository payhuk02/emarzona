-- Enable PostgREST embeds: transactions → orders
-- (admin reconciliation used order:orders(...) but no FK existed → 400)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_order_id_fkey'
      AND conrelid = 'public.transactions'::regclass
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_order_id_fkey
      FOREIGN KEY (order_id)
      REFERENCES public.orders(id)
      ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON CONSTRAINT transactions_order_id_fkey ON public.transactions IS
  'Allows PostgREST embeds order:orders(...) for admin transaction views';

NOTIFY pgrst, 'reload schema';
