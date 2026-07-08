-- Fix the customers table unique constraint
-- The 'customers_email_key' constraint prevents a single email from being a customer in multiple stores.
-- We drop it and replace it with a composite unique constraint on (store_id, email).

BEGIN;

-- Drop the global unique constraint on email
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_email_key;

-- Add a composite unique constraint so a customer is unique per store
ALTER TABLE public.customers ADD CONSTRAINT customers_store_id_email_key UNIQUE (store_id, email);

COMMIT;
