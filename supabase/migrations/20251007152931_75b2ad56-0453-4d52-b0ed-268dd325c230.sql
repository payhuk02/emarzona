-- Ajouter la clé étrangère manquante entre platform_commissions et stores
ALTER TABLE public.platform_commissions
ADD CONSTRAINT fk_platform_commissions_store 
FOREIGN KEY (store_id) 
REFERENCES public.stores(id) 
ON DELETE CASCADE;