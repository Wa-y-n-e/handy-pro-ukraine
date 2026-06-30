-- Stabilize the committed MVP contract without changing product scope.

-- Never trust signup metadata for administrator assignment. Role promotion remains
-- a service-side operation; users may only choose client or master at signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  v_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' = 'master' THEN 'master'::public.app_role
    ELSE 'client'::public.app_role
  END;

  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.phone)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_master_debt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.wallet_balance <= -400 AND NEW.status <> 'offline' THEN
    NEW.status := 'offline';
  END IF;
  RETURN NEW;
END;
$$;

-- Direct profile reads expose only public columns. Full self data remains behind
-- get_my_profile(), while map coordinates are returned by the filtered master RPC.
DROP POLICY IF EXISTS "profiles public read" ON public.profiles;
DROP POLICY IF EXISTS "profiles read" ON public.profiles;
DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
DROP POLICY IF EXISTS "profiles admin read" ON public.profiles;
DROP POLICY IF EXISTS "profiles safe authenticated read" ON public.profiles;
CREATE POLICY "profiles safe authenticated read" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles self upsert" ON public.profiles;
CREATE POLICY "profiles self insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
CREATE POLICY "profiles self update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, full_name, avatar_url, rating, status, verified,
  has_vehicle, tools_inventory, experience_years,
  primary_category_slug, created_at
) ON public.profiles TO authenticated;

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = false) AS
SELECT
  id, full_name, avatar_url, rating, status, verified,
  primary_category_slug, has_vehicle, tools_inventory, experience_years, created_at,
  CASE WHEN status = 'free' THEN locked_lat ELSE NULL END AS locked_lat,
  CASE WHEN status = 'free' THEN locked_lng ELSE NULL END AS locked_lng
FROM public.profiles;
GRANT SELECT ON public.profiles_public TO authenticated;
REVOKE SELECT ON public.profiles_public FROM anon;

-- Normal users cannot mutate role rows, even if they know their own user id.
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;

-- Chats are participant-private. Admin access is limited to active arbitration.
DROP POLICY IF EXISTS "chats participant read" ON public.chats;
CREATE POLICY "chats participant or dispute admin read" ON public.chats
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (client_id, master_id)
    OR (dispute_active AND public.has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "chats participant insert" ON public.chats;
CREATE POLICY "chats participant insert" ON public.chats
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (client_id, master_id)
    AND client_id <> master_id
    AND public.has_role(master_id, 'master')
  );

DROP POLICY IF EXISTS "chats participant update" ON public.chats;
CREATE POLICY "chats participant opens dispute" ON public.chats
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (client_id, master_id))
  WITH CHECK (auth.uid() IN (client_id, master_id) AND dispute_active);

REVOKE UPDATE ON public.chats FROM authenticated;
GRANT UPDATE (dispute_active) ON public.chats TO authenticated;

-- Message reads and writes follow chat membership. Admin access is only active
-- while a dispute is open; RPCs can still write system messages as definer code.
DROP POLICY IF EXISTS "msgs chat participant read" ON public.messages;
CREATE POLICY "messages participant or dispute admin read" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = messages.chat_id
        AND (
          auth.uid() IN (c.client_id, c.master_id)
          OR (c.dispute_active AND public.has_role(auth.uid(), 'admin'))
        )
    )
  );

DROP POLICY IF EXISTS "msgs chat participant write" ON public.messages;
CREATE POLICY "messages participant or dispute admin insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = messages.chat_id
        AND (
          auth.uid() IN (c.client_id, c.master_id)
          OR (c.dispute_active AND public.has_role(auth.uid(), 'admin'))
        )
        AND (COALESCE(messages.kind, 'text') <> 'price_card' OR messages.sender_id = c.master_id)
        AND (COALESCE(messages.kind, 'text') <> 'system' OR c.dispute_active)
    )
  );

DROP POLICY IF EXISTS "msgs sender update" ON public.messages;
REVOKE UPDATE ON public.messages FROM authenticated;

-- Participants may only move an active order into dispute through direct table
-- access. All other lifecycle changes are handled by validated RPCs.
DROP POLICY IF EXISTS "orders client insert" ON public.orders;
REVOKE INSERT ON public.orders FROM authenticated;

DROP POLICY IF EXISTS "orders participant update" ON public.orders;
DROP POLICY IF EXISTS "orders participant dispute update" ON public.orders;
CREATE POLICY "orders participant dispute update" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (client_id, master_id)
    AND status NOT IN ('completed', 'cancelled')
  )
  WITH CHECK (
    auth.uid() IN (client_id, master_id)
    AND status = 'disputed'
    AND escrow_status = 'disputed'
  );

DROP POLICY IF EXISTS "orders admin update" ON public.orders;
CREATE POLICY "orders admin update" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE UPDATE ON public.orders FROM authenticated;
GRANT UPDATE (status, escrow_status) ON public.orders TO authenticated;

-- Reviews are public, but creation is only possible through leave_order_review().
DROP POLICY IF EXISTS "rev author write" ON public.reviews;
REVOKE INSERT, UPDATE, DELETE ON public.reviews FROM authenticated;
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_order_author
  ON public.reviews(order_id, author_id) WHERE order_id IS NOT NULL;

-- Portfolio ownership also requires the master role.
DROP POLICY IF EXISTS "port self manage" ON public.portfolio_photos;
DROP POLICY IF EXISTS "portfolio owner master insert" ON public.portfolio_photos;
CREATE POLICY "portfolio owner master insert" ON public.portfolio_photos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = master_id AND public.has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "portfolio owner master delete" ON public.portfolio_photos;
CREATE POLICY "portfolio owner master delete" ON public.portfolio_photos
  FOR DELETE TO authenticated
  USING (auth.uid() = master_id AND public.has_role(auth.uid(), 'master'));

REVOKE UPDATE ON public.portfolio_photos FROM authenticated;

-- Wallet ledger entries are RPC/service generated only.
DROP POLICY IF EXISTS "tx participant insert" ON public.transactions;
REVOKE INSERT, UPDATE, DELETE ON public.transactions FROM authenticated;

-- Disputes can be opened by an order participant only after the order enters
-- disputed state. Resolution remains RPC-only and admin-gated.
DROP POLICY IF EXISTS "disp read participant" ON public.disputes;
CREATE POLICY "disputes participant or admin read" ON public.disputes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = disputes.order_id
        AND (
          auth.uid() IN (o.client_id, o.master_id)
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

DROP POLICY IF EXISTS "disp insert participant" ON public.disputes;
CREATE POLICY "disputes participant insert" ON public.disputes
  FOR INSERT TO authenticated
  WITH CHECK (
    opened_by = auth.uid()
    AND status = 'open'
    AND resolution IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = disputes.order_id
        AND auth.uid() IN (o.client_id, o.master_id)
        AND o.status = 'disputed'
    )
  );

DROP POLICY IF EXISTS "disp update admin" ON public.disputes;
REVOKE UPDATE, DELETE ON public.disputes FROM authenticated;

-- Support requests are owner-readable and administrator-managed.
DROP POLICY IF EXISTS "support requests own insert" ON public.support_requests;
CREATE POLICY "support requests own insert" ON public.support_requests
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "support requests own read" ON public.support_requests;
CREATE POLICY "support requests own read" ON public.support_requests
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "support requests admin update" ON public.support_requests;
CREATE POLICY "support requests admin update" ON public.support_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only free, solvent masters with valid coordinates are visible on the map.
CREATE OR REPLACE FUNCTION public.get_available_masters(
  p_category_slug text DEFAULT NULL,
  p_subcategory_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  rating numeric,
  status public.master_status,
  verified boolean,
  primary_category_slug text,
  locked_lat double precision,
  locked_lng double precision,
  review_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    p.id, p.full_name, p.avatar_url, p.rating, p.status, p.verified,
    p.primary_category_slug, p.locked_lat, p.locked_lng,
    COUNT(DISTINCT rv.id) AS review_count
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'master'
  LEFT JOIN public.reviews rv ON rv.target_id = p.id
  WHERE auth.uid() IS NOT NULL
    AND p.status = 'free'
    AND COALESCE(p.wallet_balance, 0) > -400
    AND p.locked_lat IS NOT NULL
    AND p.locked_lng IS NOT NULL
    AND p.locked_lat BETWEEN -90 AND 90
    AND p.locked_lng BETWEEN -180 AND 180
    AND (p_category_slug IS NULL OR p.primary_category_slug = p_category_slug)
    AND (
      p_subcategory_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.master_subcategories ms
        WHERE ms.master_id = p.id AND ms.subcategory_id = p_subcategory_id
      )
    )
  GROUP BY p.id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_available_masters(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_available_masters(text, uuid) TO authenticated;

-- Cash acceptance is tied to a price card authored by the chat's master.
CREATE OR REPLACE FUNCTION public.accept_cash_offer(p_chat_id uuid, p_amount numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_chat public.chats%ROWTYPE;
  v_order_id uuid;
  v_address text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 1000000 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  SELECT * INTO v_chat FROM public.chats WHERE id = p_chat_id FOR UPDATE;
  IF NOT FOUND OR v_chat.client_id <> v_uid THEN RAISE EXCEPTION 'Only the client can accept an offer'; END IF;
  IF v_chat.order_id IS NOT NULL THEN RAISE EXCEPTION 'This chat already has an order'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.chat_id = p_chat_id
      AND m.sender_id = v_chat.master_id
      AND m.kind = 'price_card'
      AND m.price = p_amount
  ) THEN RAISE EXCEPTION 'Matching price card not found'; END IF;

  SELECT locked_address INTO v_address FROM public.profiles WHERE id = v_uid;
  INSERT INTO public.orders (client_id, master_id, price, status, payment_method, escrow_status, address)
  VALUES (v_chat.client_id, v_chat.master_id, p_amount, 'accepted', 'cash', 'none', COALESCE(v_address, '-'))
  RETURNING id INTO v_order_id;

  UPDATE public.chats SET order_id = v_order_id WHERE id = p_chat_id;
  INSERT INTO public.messages (chat_id, sender_id, kind, body)
  VALUES (p_chat_id, v_uid, 'system', 'Cash order confirmed: ' || p_amount::text || ' UAH');

  RETURN v_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_cash_offer(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_cash_offer(uuid, numeric) TO authenticated;

-- MVP simulation only: this records an escrow hold in the internal ledger. It
-- does not charge a card or communicate with an acquiring provider.
CREATE OR REPLACE FUNCTION public.pay_escrow_hold(p_chat_id uuid, p_amount numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_chat public.chats%ROWTYPE;
  v_order_id uuid;
  v_address text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 1000000 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  SELECT * INTO v_chat FROM public.chats WHERE id = p_chat_id FOR UPDATE;
  IF NOT FOUND OR v_chat.client_id <> v_uid THEN RAISE EXCEPTION 'Only the client can pay'; END IF;
  IF v_chat.order_id IS NOT NULL THEN RAISE EXCEPTION 'This chat already has an order'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.chat_id = p_chat_id
      AND m.sender_id = v_chat.master_id
      AND m.kind = 'price_card'
      AND m.price = p_amount
  ) THEN RAISE EXCEPTION 'Matching price card not found'; END IF;

  SELECT locked_address INTO v_address FROM public.profiles WHERE id = v_uid;
  INSERT INTO public.orders (client_id, master_id, price, status, payment_method, escrow_status, address)
  VALUES (v_chat.client_id, v_chat.master_id, p_amount, 'accepted', 'card', 'held', COALESCE(v_address, '-'))
  RETURNING id INTO v_order_id;

  UPDATE public.chats SET order_id = v_order_id WHERE id = p_chat_id;
  INSERT INTO public.transactions (order_id, master_id, kind, amount)
  VALUES (v_order_id, v_chat.master_id, 'hold', p_amount);
  INSERT INTO public.messages (chat_id, sender_id, kind, body)
  VALUES (p_chat_id, v_uid, 'system', 'Simulated escrow hold: ' || p_amount::text || ' UAH');

  RETURN v_order_id;
END;
$$;

COMMENT ON FUNCTION public.pay_escrow_hold(uuid, numeric)
  IS 'MVP simulated escrow ledger operation; no real card acquiring or external funds movement.';
REVOKE EXECUTE ON FUNCTION public.pay_escrow_hold(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pay_escrow_hold(uuid, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_commission numeric;
  v_master_share numeric;
  v_chat_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.master_id IS NULL OR v_order.price IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.status = 'completed' THEN RETURN; END IF;
  IF v_order.payment_method IS NULL THEN RAISE EXCEPTION 'Order payment method is missing'; END IF;

  v_commission := round(v_order.price * 0.10, 2);
  v_master_share := v_order.price - v_commission;

  IF v_order.payment_method = 'card' THEN
    IF v_order.client_id <> v_uid THEN RAISE EXCEPTION 'Only the client can accept completed card work'; END IF;
    IF v_order.status <> 'in_progress' THEN RAISE EXCEPTION 'Card order is not in progress'; END IF;
    IF v_order.escrow_status <> 'held' THEN RAISE EXCEPTION 'Escrow is not held'; END IF;

    UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + v_master_share
    WHERE id = v_order.master_id;
    INSERT INTO public.transactions (order_id, master_id, kind, amount) VALUES
      (p_order_id, v_order.master_id, 'release_master', v_master_share),
      (p_order_id, v_order.master_id, 'release_platform', v_commission);
    UPDATE public.orders
    SET status = 'completed', escrow_status = 'released', completed_at = now()
    WHERE id = p_order_id;
  ELSE
    IF v_order.master_id <> v_uid THEN RAISE EXCEPTION 'Only the master can complete a cash order'; END IF;
    IF v_order.status NOT IN ('accepted', 'in_progress') THEN RAISE EXCEPTION 'Cash order cannot be completed'; END IF;

    UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) - v_commission
    WHERE id = v_order.master_id;
    INSERT INTO public.transactions (order_id, master_id, kind, amount)
    VALUES (p_order_id, v_order.master_id, 'cash_debt', -v_commission);
    UPDATE public.orders
    SET status = 'completed', escrow_status = 'none', completed_at = now()
    WHERE id = p_order_id;
  END IF;

  UPDATE public.profiles
  SET status = CASE
    WHEN COALESCE(wallet_balance, 0) <= -400 THEN 'offline'::public.master_status
    ELSE 'free'::public.master_status
  END
  WHERE id = v_order.master_id;

  SELECT id INTO v_chat_id FROM public.chats WHERE order_id = p_order_id LIMIT 1;
  IF v_chat_id IS NOT NULL THEN
    INSERT INTO public.messages (chat_id, sender_id, kind, body)
    VALUES (v_chat_id, v_uid, 'system', 'Order completed');
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_order(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_dispute(p_chat_id uuid, p_resolution text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_chat public.chats%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_commission numeric;
  v_master_share numeric;
BEGIN
  IF NOT public.has_role(v_uid, 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_resolution NOT IN ('refund_client', 'release_master') THEN RAISE EXCEPTION 'Invalid resolution'; END IF;

  SELECT * INTO v_chat FROM public.chats WHERE id = p_chat_id FOR UPDATE;
  IF NOT FOUND OR v_chat.order_id IS NULL OR NOT v_chat.dispute_active THEN RAISE EXCEPTION 'Active dispute not found'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = v_chat.order_id FOR UPDATE;
  IF NOT FOUND OR v_order.master_id IS NULL OR v_order.status <> 'disputed' THEN RAISE EXCEPTION 'Order is not disputed'; END IF;
  IF v_order.payment_method IS NULL THEN RAISE EXCEPTION 'Order payment method is missing'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.order_id = v_order.id AND d.status = 'open'
  ) THEN RAISE EXCEPTION 'Open dispute not found'; END IF;
  PERFORM d.id
  FROM public.disputes d
  WHERE d.order_id = v_order.id AND d.status = 'open'
  FOR UPDATE;

  v_commission := round(COALESCE(v_order.price, 0) * 0.10, 2);
  v_master_share := COALESCE(v_order.price, 0) - v_commission;

  IF p_resolution = 'release_master' THEN
    IF v_order.payment_method = 'card' THEN
      IF v_order.escrow_status <> 'disputed' OR NOT EXISTS (
        SELECT 1 FROM public.transactions t
        WHERE t.order_id = v_order.id AND t.kind = 'hold'
      ) THEN RAISE EXCEPTION 'Simulated escrow hold not found'; END IF;

      UPDATE public.profiles
      SET wallet_balance = COALESCE(wallet_balance, 0) + v_master_share
      WHERE id = v_order.master_id;
      INSERT INTO public.transactions (order_id, master_id, kind, amount) VALUES
        (v_order.id, v_order.master_id, 'release_master', v_master_share),
        (v_order.id, v_order.master_id, 'release_platform', v_commission);
      UPDATE public.orders
      SET status = 'completed', escrow_status = 'released', completed_at = now()
      WHERE id = v_order.id;
    ELSE
      UPDATE public.profiles
      SET wallet_balance = COALESCE(wallet_balance, 0) - v_commission
      WHERE id = v_order.master_id;
      INSERT INTO public.transactions (order_id, master_id, kind, amount)
      VALUES (v_order.id, v_order.master_id, 'cash_debt', -v_commission);
      UPDATE public.orders
      SET status = 'completed', escrow_status = 'none', completed_at = now()
      WHERE id = v_order.id;
    END IF;
  ELSE
    UPDATE public.orders
    SET status = 'cancelled',
        escrow_status = CASE
          WHEN payment_method = 'card' THEN 'refunded'::public.escrow_status
          ELSE 'none'::public.escrow_status
        END
    WHERE id = v_order.id;
  END IF;

  UPDATE public.profiles
  SET status = CASE
    WHEN COALESCE(wallet_balance, 0) <= -400 THEN 'offline'::public.master_status
    ELSE 'free'::public.master_status
  END
  WHERE id = v_order.master_id;

  UPDATE public.disputes
  SET status = 'resolved', resolution = p_resolution, admin_id = v_uid
  WHERE order_id = v_order.id AND status = 'open';
  UPDATE public.chats SET dispute_active = false WHERE id = p_chat_id;
  INSERT INTO public.messages (chat_id, sender_id, kind, body)
  VALUES (
    p_chat_id,
    v_uid,
    'system',
    CASE WHEN p_resolution = 'release_master'
      THEN 'Dispute resolved: master paid'
      ELSE 'Dispute resolved: client refunded'
    END
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_dispute(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_dispute(uuid, text) TO authenticated;

-- Private chat-media objects use the chat id as the first path component.
DROP POLICY IF EXISTS "chat media participant read" ON storage.objects;
CREATE POLICY "chat media participant read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          THEN ((storage.foldername(name))[1])::uuid
        ELSE NULL
      END
      AND auth.uid() IN (c.client_id, c.master_id)
    )
  );

DROP POLICY IF EXISTS "chat media participant insert" ON storage.objects;
CREATE POLICY "chat media participant insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media'
    AND owner_id = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.chats c
      WHERE c.id = CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          THEN ((storage.foldername(name))[1])::uuid
        ELSE NULL
      END
      AND auth.uid() IN (c.client_id, c.master_id)
    )
  );

DROP POLICY IF EXISTS "chat media owner delete" ON storage.objects;
CREATE POLICY "chat media owner or admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (owner_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );
