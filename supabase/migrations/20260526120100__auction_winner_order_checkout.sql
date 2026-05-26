-- H-03 : commande Moneroo pour l'enchérisseur gagnant

ALTER TABLE public.artist_product_auctions
  ADD COLUMN IF NOT EXISTS winning_bid_id UUID REFERENCES public.auction_bids(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS winner_checkout_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS winner_payment_deadline TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_auctions_winner_order
  ON public.artist_product_auctions(winner_checkout_order_id)
  WHERE winner_checkout_order_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_auction_winner_order(p_auction_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction public.artist_product_auctions%ROWTYPE;
  v_winning_bid public.auction_bids%ROWTYPE;
  v_ap public.artist_products%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_customer_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_user_email TEXT;
  v_user_name TEXT;
  v_final_amount NUMERIC(10, 2);
  v_is_store_owner BOOLEAN;
BEGIN
  SELECT * INTO v_auction
  FROM public.artist_product_auctions
  WHERE id = p_auction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enchère introuvable';
  END IF;

  IF v_auction.winner_checkout_order_id IS NOT NULL THEN
    RETURN v_auction.winner_checkout_order_id;
  END IF;

  SELECT ab.* INTO v_winning_bid
  FROM public.auction_bids ab
  WHERE ab.auction_id = p_auction_id
    AND ab.status = 'winning'
  ORDER BY ab.bid_amount DESC, ab.created_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT ab.* INTO v_winning_bid
    FROM public.auction_bids ab
    WHERE ab.auction_id = p_auction_id
      AND ab.status IN ('active', 'winning')
    ORDER BY ab.bid_amount DESC, ab.created_at ASC
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = v_auction.store_id AND s.user_id = auth.uid()
    ) INTO v_is_store_owner;

    IF v_winning_bid.bidder_id IS DISTINCT FROM auth.uid() AND NOT COALESCE(v_is_store_owner, false) THEN
      RAISE EXCEPTION 'Seul l''enchérisseur gagnant peut créer cette commande';
    END IF;
  END IF;

  IF v_auction.reserve_price IS NOT NULL AND v_winning_bid.bid_amount < v_auction.reserve_price THEN
    RETURN NULL;
  END IF;

  v_final_amount := GREATEST(COALESCE(v_auction.current_bid, 0), v_winning_bid.bid_amount);

  SELECT * INTO v_ap FROM public.artist_products WHERE id = v_auction.artist_product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Œuvre associée introuvable';
  END IF;

  SELECT * INTO v_product FROM public.products WHERE id = v_ap.product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit associé introuvable';
  END IF;

  SELECT au.email, COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
  INTO v_user_email, v_user_name
  FROM auth.users au
  WHERE au.id = v_winning_bid.bidder_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Email de l''enchérisseur gagnant introuvable';
  END IF;

  SELECT c.id INTO v_customer_id
  FROM public.customers c
  WHERE c.store_id = v_auction.store_id AND c.email = v_user_email
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (store_id, email, name, user_id)
    VALUES (v_auction.store_id, v_user_email, COALESCE(v_user_name, v_user_email), v_winning_bid.bidder_id)
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
    SET user_id = COALESCE(user_id, v_winning_bid.bidder_id),
        name = COALESCE(NULLIF(TRIM(name), ''), v_user_name)
    WHERE id = v_customer_id;
  END IF;

  SELECT public.generate_order_number() INTO v_order_number;
  IF v_order_number IS NULL THEN
    v_order_number := 'AUC-' || to_char(now(), 'YYYYMMDDHH24MISS');
  END IF;

  INSERT INTO public.orders (
    store_id,
    customer_id,
    order_number,
    total_amount,
    currency,
    payment_status,
    status,
    payment_type,
    metadata
  )
  VALUES (
    v_auction.store_id,
    v_customer_id,
    v_order_number,
    v_final_amount,
    COALESCE(v_winning_bid.currency, 'XOF'),
    'pending',
    'pending',
    'full',
    jsonb_build_object(
      'source', 'auction',
      'auction_id', p_auction_id,
      'winning_bid_id', v_winning_bid.id,
      'bidder_id', v_winning_bid.bidder_id,
      'artwork_title', v_ap.artwork_title,
      'artist_name', v_ap.artist_name
    )
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id,
    product_id,
    product_type,
    product_name,
    quantity,
    unit_price,
    total_price,
    item_metadata
  )
  VALUES (
    v_order_id,
    v_ap.product_id,
    'artist',
    COALESCE(v_product.name, v_auction.auction_title),
    1,
    v_final_amount,
    v_final_amount,
    jsonb_build_object(
      'artist_product_id', v_ap.id,
      'auction_id', p_auction_id,
      'winning_bid_id', v_winning_bid.id,
      'source', 'auction'
    )
  );

  UPDATE public.artist_product_auctions
  SET
    winning_bid_id = v_winning_bid.id,
    winner_checkout_order_id = v_order_id,
    winner_payment_deadline = COALESCE(winner_payment_deadline, now() + INTERVAL '72 hours'),
    status = 'sold',
    updated_at = now()
  WHERE id = p_auction_id;

  RETURN v_order_id;
END;
$$;

COMMENT ON FUNCTION public.create_auction_winner_order IS
'Crée une commande pending pour l''enchérisseur gagnant (prix = enchère courante). Idempotent si commande déjà créée.';

GRANT EXECUTE ON FUNCTION public.create_auction_winner_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_auction_winner_order(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.end_auction(p_auction_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_winning_bid_id UUID;
  v_order_id UUID;
  v_bid_amount NUMERIC(10, 2);
  v_reserve NUMERIC(10, 2);
BEGIN
  SELECT id INTO v_winning_bid_id
  FROM public.auction_bids
  WHERE auction_id = p_auction_id
    AND status IN ('active', 'winning')
  ORDER BY bid_amount DESC, created_at ASC
  LIMIT 1;

  IF v_winning_bid_id IS NOT NULL THEN
    SELECT bid_amount INTO v_bid_amount FROM public.auction_bids WHERE id = v_winning_bid_id;
    SELECT reserve_price INTO v_reserve FROM public.artist_product_auctions WHERE id = p_auction_id;

    IF v_reserve IS NOT NULL AND v_bid_amount < v_reserve THEN
      UPDATE public.artist_product_auctions
      SET status = 'ended', updated_at = now()
      WHERE id = p_auction_id;
      RETURN NULL;
    END IF;

    UPDATE public.auction_bids
    SET status = 'outbid'
    WHERE auction_id = p_auction_id
      AND status = 'active'
      AND id <> v_winning_bid_id;

    UPDATE public.auction_bids
    SET status = 'winning'
    WHERE id = v_winning_bid_id;

    UPDATE public.artist_product_auctions
    SET status = 'sold', updated_at = now()
    WHERE id = p_auction_id;
  ELSE
    UPDATE public.artist_product_auctions
    SET status = 'ended', updated_at = now()
    WHERE id = p_auction_id;
    RETURN NULL;
  END IF;

  BEGIN
    v_order_id := public.create_auction_winner_order(p_auction_id);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'create_auction_winner_order failed for %: %', p_auction_id, SQLERRM;
      v_order_id := NULL;
  END;

  RETURN v_winning_bid_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_auction_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction_id UUID;
BEGIN
  UPDATE public.artist_product_auctions
  SET status = 'active', updated_at = now()
  WHERE status = 'scheduled'
    AND start_date <= now()
    AND end_date > now();

  FOR v_auction_id IN
    SELECT id
    FROM public.artist_product_auctions
    WHERE status = 'active'
      AND end_date < now()
  LOOP
    PERFORM public.end_auction(v_auction_id);
  END LOOP;
END;
$$;
