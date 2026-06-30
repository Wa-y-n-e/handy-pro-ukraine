
-- 1. Restrict SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- has_role still callable by authenticated for use in RLS policies
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 2. Fix profiles SELECT exposure
DROP POLICY IF EXISTS "profiles public read" ON public.profiles;

CREATE POLICY "profiles self read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- Safe public view: excludes phone, wallet_balance, locked_address.
-- Exposes locked_lat/lng only for masters currently free (needed for map pins).
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  id, full_name, avatar_url, rating, status, verified,
  has_vehicle, tools_inventory, experience_years,
  primary_category_slug, created_at,
  CASE WHEN status = 'free' THEN locked_lat END AS locked_lat,
  CASE WHEN status = 'free' THEN locked_lng END AS locked_lng
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3. Prevent privilege escalation on profile self-update
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.wallet_balance := OLD.wallet_balance;
    NEW.verified := OLD.verified;
    NEW.rating := OLD.rating;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_profile_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_profile_cols ON public.profiles;
CREATE TRIGGER protect_profile_cols
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- 4. Lock down transactions inserts
DROP POLICY IF EXISTS "tx participant insert" ON public.transactions;
-- No direct INSERT policy: only SECURITY DEFINER RPCs or service_role can insert.

-- 5. RPC helpers for legitimate wallet/escrow operations
CREATE OR REPLACE FUNCTION public.wallet_topup(p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_new numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  UPDATE public.profiles
     SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount,
         status = CASE WHEN COALESCE(wallet_balance, 0) + p_amount >= 0 AND status = 'offline' THEN 'free' ELSE status END
   WHERE id = v_uid
  RETURNING wallet_balance INTO v_new;
  INSERT INTO public.transactions (master_id, kind, amount)
  VALUES (v_uid, 'topup', p_amount);
  RETURN v_new;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.wallet_topup(numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wallet_topup(numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.wallet_instant_withdraw()
RETURNS TABLE(payout numeric, fee numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_bal numeric;
  v_fee numeric;
  v_payout numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT wallet_balance INTO v_bal FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF v_bal IS NULL OR v_bal <= 0 THEN RAISE EXCEPTION 'No balance to withdraw'; END IF;
  v_fee := round(v_bal * 0.02, 2);
  v_payout := v_bal - v_fee;
  UPDATE public.profiles SET wallet_balance = 0 WHERE id = v_uid;
  INSERT INTO public.transactions (master_id, kind, amount)
    VALUES (v_uid, 'instant_fee', -v_fee), (v_uid, 'payout', -v_payout);
  payout := v_payout; fee := v_fee; RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.wallet_instant_withdraw() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wallet_instant_withdraw() TO authenticated;

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
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 1000000 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  SELECT * INTO v_chat FROM public.chats WHERE id = p_chat_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Chat not found'; END IF;
  IF v_chat.client_id <> v_uid THEN RAISE EXCEPTION 'Only the client can pay'; END IF;

  INSERT INTO public.orders (client_id, master_id, price, status, payment_method, escrow_status, address)
  VALUES (v_chat.client_id, v_chat.master_id, p_amount, 'accepted', 'card', 'held', '—')
  RETURNING id INTO v_order_id;

  UPDATE public.chats SET order_id = v_order_id WHERE id = p_chat_id;

  INSERT INTO public.transactions (order_id, master_id, kind, amount)
  VALUES (v_order_id, v_chat.master_id, 'hold', p_amount);

  INSERT INTO public.messages (chat_id, sender_id, kind, body)
  VALUES (p_chat_id, v_uid, 'system', '✅ Кошти ' || p_amount::text || ' ₴ заморожено на ескроу-рахунку');

  RETURN v_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.pay_escrow_hold(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pay_escrow_hold(uuid, numeric) TO authenticated;
