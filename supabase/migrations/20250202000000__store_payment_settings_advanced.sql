-- Migration: Paramètres de paiement avancés pour les boutiques
-- Date: 2025-02-02
-- Description: Ajoute les paramètres avancés de paiement (montants min/max, devises, paiement partiel, etc.)

-- ============================================================
-- PARAMÈTRES DE PAIEMENT AVANCÉS
-- ============================================================
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS minimum_order_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS maximum_order_amount NUMERIC,
ADD COLUMN IF NOT EXISTS accepted_currencies TEXT[] DEFAULT ARRAY['XOF']::TEXT[],
ADD COLUMN IF NOT EXISTS allow_partial_payment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV-',
ADD COLUMN IF NOT EXISTS invoice_numbering TEXT DEFAULT 'sequential' CHECK (invoice_numbering IN ('sequential', 'random')),
ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC;

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_stores_accepted_currencies ON public.stores USING GIN(accepted_currencies);

-- Commentaires pour documentation
COMMENT ON COLUMN public.stores.minimum_order_amount IS 'Montant minimum de commande requis (0 = pas de minimum)';
COMMENT ON COLUMN public.stores.maximum_order_amount IS 'Montant maximum de commande autorisé (NULL = pas de maximum)';
COMMENT ON COLUMN public.stores.accepted_currencies IS 'Liste des devises acceptées (XOF, EUR, USD, XAF, etc.)';
COMMENT ON COLUMN public.stores.allow_partial_payment IS 'Autorise les paiements partiels pour les commandes';
COMMENT ON COLUMN public.stores.payment_terms IS 'Conditions de paiement personnalisées (ex: "Paiement à la livraison", "30 jours net")';
COMMENT ON COLUMN public.stores.invoice_prefix IS 'Préfixe pour les numéros de facture (ex: "INV-", "FAC-")';
COMMENT ON COLUMN public.stores.invoice_numbering IS 'Type de numérotation des factures (sequential ou random)';
COMMENT ON COLUMN public.stores.free_shipping_threshold IS 'Montant de commande minimum pour livraison gratuite (NULL = pas de livraison gratuite)';

