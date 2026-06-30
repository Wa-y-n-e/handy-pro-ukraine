-- Complete the core Handy Pro flows without replacing existing user data.

-- Exact service dictionary from the product brief.
INSERT INTO public.categories (slug, name_uk, icon, position) VALUES
  ('plumbing', 'Сантехніка та опалення', 'wrench', 1),
  ('electric', 'Електромонтаж та альтернативне живлення', 'zap', 2),
  ('handyman', 'Дрібний побутовий ремонт («Чоловік на годину»)', 'hammer', 3),
  ('doors_windows', 'Двері, вікна та замки', 'door-open', 4),
  ('furniture', 'Збирання та ремонт меблів', 'sofa', 5),
  ('appliances', 'Ремонт побутової техніки', 'refrigerator', 6),
  ('micro_repair', 'Мікро-ремонт та зварювальні роботи', 'brick-wall', 7),
  ('garden', 'Сад, город та благоустрій', 'sprout', 8),
  ('labor', 'Різноробочі, підсобники та демонтаж', 'hard-hat', 9),
  ('heavy', 'Послуги спецтехніки (Оренда з оператором)', 'tractor', 10),
  ('internet', 'Інтернет, слаботочка та безпека', 'wifi', 11)
ON CONFLICT (slug) DO UPDATE SET
  name_uk = EXCLUDED.name_uk,
  icon = EXCLUDED.icon,
  position = EXCLUDED.position;

INSERT INTO public.subcategories (category_slug, name_uk, position)
SELECT seed.category_slug, seed.name_uk, seed.position
FROM (VALUES
  ('plumbing', 'Усунення протікань та засмічень (прочистка труб, сифонів)', 1),
  ('plumbing', 'Встановлення та ремонт змішувачів, кранів, душових кабін', 2),
  ('plumbing', 'Монтаж, чистка та обслуговування бойлерів', 3),
  ('plumbing', 'Ремонт унітазів, заміна арматури зливних бачків', 4),
  ('plumbing', 'Ремонт та обслуговування газових/твердопаливних котлів, колонок та конвекторів', 5),
  ('plumbing', 'Промивка систем опалення, заміна радіаторів та труб', 6),
  ('plumbing', 'Підключення пральних та посудомийних машин', 7),
  ('electric', 'Ремонт, перенесення та заміна розеток чи вимикачів', 1),
  ('electric', 'Монтаж люстр, бра, точкових світильників, світлодіодної стрічки', 2),
  ('electric', 'Пошук та усунення причин короткого замикання або зникнення світла', 3),
  ('electric', 'Збирання, заміна та ремонт електрощитків, автоматів, ПЗВ (УЗО)', 4),
  ('electric', 'Підключення та обслуговування бензинових/дизельних генераторів', 5),
  ('electric', 'Монтаж інверторів, зарядних станцій (EcoFlow, Bluetti) та систем резервного живлення будинку', 6),
  ('electric', 'Встановлення акумуляторів резервного живлення (LiFePO4, гелевих)', 7),
  ('electric', 'Прокладання нової або повна заміна старої проводки', 8),
  ('electric', 'Підключення важкої техніки (електроплит, духовок, витяжок)', 9),
  ('handyman', 'Навішування поличок, дзеркал, картин, кухонних рейлінгів', 1),
  ('handyman', 'Монтаж карнизів для штор, ролет та жалюзі', 2),
  ('handyman', 'Встановлення кронштейнів та монтаж телевізорів/моніторів на стіну', 3),
  ('handyman', 'Кріплення плінтусів, порожків, куточків', 4),
  ('handyman', 'Буріння отворів у бетоні, цеглі, кахлі під будь-які потреби', 5),
  ('doors_windows', 'Врізка, заміна та ремонт дверних замків, ручок, серцевин (личинок)', 1),
  ('doors_windows', 'Регулювання та ремонт пластикових вікон/дверей, заміна ущільнювача', 2),
  ('doors_windows', 'Встановлення та ремонт міжкімнатних та вхідних дверей', 3),
  ('doors_windows', 'Заміна або монтаж віконної фурнітури, доводчиків', 4),
  ('doors_windows', 'Виготовлення та встановлення москітних сіток', 5),
  ('furniture', 'Збирання шаф (у тому числі шаф-купе), комодів, ліжок, столів', 1),
  ('furniture', 'Монтаж та підгонка кухонних гарнітурів, вирізка отворів під мийку', 2),
  ('furniture', 'Ремонт та заміна меблевої фурнітури (петлі, направляючі для шухляд)', 3),
  ('furniture', 'Ремонт, укріплення та перетяжка м''яких меблів', 4),
  ('appliances', 'Ремонт пральних та посудомийних машин', 1),
  ('appliances', 'Ремонт, заправка фреоном холодильників та морозильних камер', 2),
  ('appliances', 'Ремонт дрібної техніки (мікрохвильовок, пилососів, кавомашин)', 3),
  ('appliances', 'Ремонт, чистка та заправка кондиціонерів', 4),
  ('appliances', 'Ремонт телевізорів та моніторів', 5),
  ('micro_repair', 'Підклеювання шпалер, що відійшли, або заміна окремих смуг', 1),
  ('micro_repair', 'Локальне шпаклювання та фарбування стін/стелі після пошкоджень', 2),
  ('micro_repair', 'Укладання або заміна кількох пошкоджених плиток (кахлю)', 3),
  ('micro_repair', 'Монтаж гіпсокартонних латок (закрити дірки в стінах/коробах)', 4),
  ('micro_repair', 'Зварювання та ремонт воріт, хвірток, парканів, петель', 5),
  ('micro_repair', 'Виготовлення дрібних металоконструкцій (каркаси, навіси, решітки на вікна)', 6),
  ('garden', 'Копання городу, підготовка грядок, земляні роботи на ділянці', 1),
  ('garden', 'Обрізка дерев, аварійних гілок, кущів та формування крони', 2),
  ('garden', 'Косіння трави, бур''янів, професійний догляд за газоном', 3),
  ('garden', 'Сезонне прибирання ділянки від листя, сухостою, гілок та сміття', 4),
  ('garden', 'Колка, розпил та акуратне укладання дров', 5),
  ('labor', 'Послуги підсобників на будівництво чи приватний ремонт (допомога майстру)', 1),
  ('labor', 'Демонтажні роботи (збити стару плитку, штукатурку, знести перегородку)', 2),
  ('labor', 'Збирання, винесення з поверху та вивіз будівельного сміття', 3),
  ('labor', 'Послуги вантажників (перенесення меблів, розвантаження будматеріалів)', 4),
  ('labor', 'Копання глибоких зливних ям, септиків, траншей під фундамент вручну', 5),
  ('heavy', 'Міні-екскаватори та бобкети (планування ділянок, копка траншей)', 1),
  ('heavy', 'Послуги маніпулятора та автокрана (перевезення та підйом важких вантажів)', 2),
  ('heavy', 'Самоскиди (доставка піску, щебню, чорнозему або вивіз тонн сміття)', 3),
  ('heavy', 'Буріння свердловин на воду та послуги ямобура (стовпи, палі)', 4),
  ('heavy', 'Асенізаторські послуги (викачка септиків, зливних ям, туалетів)', 5),
  ('internet', 'Налаштування Wi-Fi роутерів, прокладання інтернет-кабелю по квартирі/будинку', 1),
  ('internet', 'Встановлення, підключення та налаштування камер відеоспостереження', 2),
  ('internet', 'Монтаж систем бездротової сигналізації та датчиків безпеки (Ajax тощо)', 3),
  ('internet', 'Ремонт та підключення домофонів, розумних замків', 4)
) AS seed(category_slug, name_uk, position)
WHERE NOT EXISTS (
  SELECT 1 FROM public.subcategories existing
  WHERE existing.category_slug = seed.category_slug
    AND existing.name_uk = seed.name_uk
);

-- Profile reads expose only non-sensitive columns. Full self data remains behind get_my_profile().
DROP POLICY IF EXISTS "profiles read" ON public.profiles;
DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
DROP POLICY IF EXISTS "profiles admin read" ON public.profiles;
CREATE POLICY "profiles safe authenticated read"
  ON public.profiles FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, full_name, avatar_url, rating, status, verified,
  has_vehicle, tools_inventory, experience_years,
  primary_category_slug, locked_lat, locked_lng, created_at
) ON public.profiles TO authenticated;

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT
  id, full_name, avatar_url, rating, status, verified,
  primary_category_slug, has_vehicle, tools_inventory, experience_years, created_at,
  CASE WHEN status = 'free' THEN locked_lat ELSE NULL END AS locked_lat,
  CASE WHEN status = 'free' THEN locked_lng ELSE NULL END AS locked_lng
FROM public.profiles;
GRANT SELECT ON public.profiles_public TO authenticated;
REVOKE SELECT ON public.profiles_public FROM anon;

CREATE OR REPLACE FUNCTION public.get_public_profile(p_profile_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  rating numeric,
  status public.master_status,
  verified boolean,
  has_vehicle boolean,
  tools_inventory text,
  experience_years integer,
  primary_category_slug text,
  created_at timestamptz,
  role public.app_role,
  completed_jobs bigint,
  paid_jobs bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    p.id, p.full_name, p.avatar_url, p.rating, p.status, p.verified,
    p.has_vehicle, p.tools_inventory, p.experience_years,
    p.primary_category_slug, p.created_at,
    COALESCE(r.role, 'client'::public.app_role),
    COUNT(o.id) FILTER (WHERE o.status = 'completed'),
    COUNT(o.id) FILTER (
      WHERE o.status = 'completed'
        AND (o.payment_method = 'cash' OR o.escrow_status = 'released')
    )
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT ur.role FROM public.user_roles ur
    WHERE ur.user_id = p.id
    ORDER BY CASE ur.role WHEN 'admin' THEN 1 WHEN 'master' THEN 2 ELSE 3 END
    LIMIT 1
  ) r ON true
  LEFT JOIN public.orders o ON
    (COALESCE(r.role, 'client'::public.app_role) = 'master' AND o.master_id = p.id)
    OR (COALESCE(r.role, 'client'::public.app_role) <> 'master' AND o.client_id = p.id)
  WHERE auth.uid() IS NOT NULL AND p.id = p_profile_id
  GROUP BY p.id, r.role;
$$;
REVOKE EXECUTE ON FUNCTION public.get_public_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;

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
    AND p.locked_lat IS NOT NULL
    AND p.locked_lng IS NOT NULL
    AND (p_category_slug IS NULL OR p.primary_category_slug = p_category_slug)
    AND (
      p_subcategory_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.master_subcategories ms
        WHERE ms.master_id = p.id AND ms.subcategory_id = p_subcategory_id
      )
    )
  GROUP BY p.id;
$$;
REVOKE EXECUTE ON FUNCTION public.get_available_masters(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_available_masters(text, uuid) TO authenticated;

-- Column grants prevent direct balance/rating changes. SECURITY DEFINER wallet
-- functions bypass these grants, so legitimate escrow operations still work.
DROP TRIGGER IF EXISTS protect_profile_cols ON public.profiles;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  full_name, avatar_url, status, locked_address, locked_lat, locked_lng,
  primary_category_slug, has_vehicle, tools_inventory, experience_years
) ON public.profiles TO authenticated;

-- Voice requests from simplified mode are stored for the operator queue.
CREATE TABLE IF NOT EXISTS public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('voice', 'callback')),
  duration_seconds integer,
  note text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.support_requests TO authenticated;
GRANT ALL ON public.support_requests TO service_role;
DROP POLICY IF EXISTS "support requests own insert" ON public.support_requests;
CREATE POLICY "support requests own insert" ON public.support_requests
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "support requests own read" ON public.support_requests;
CREATE POLICY "support requests own read" ON public.support_requests
  FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "support requests admin update" ON public.support_requests;
CREATE POLICY "support requests admin update" ON public.support_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

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
  SELECT locked_address INTO v_address FROM public.profiles WHERE id = v_uid;
  INSERT INTO public.orders (client_id, master_id, price, status, payment_method, escrow_status, address)
  VALUES (v_chat.client_id, v_chat.master_id, p_amount, 'accepted', 'cash', 'none', COALESCE(v_address, '—'))
  RETURNING id INTO v_order_id;
  UPDATE public.chats SET order_id = v_order_id WHERE id = p_chat_id;
  INSERT INTO public.messages (chat_id, sender_id, kind, body)
  VALUES (p_chat_id, v_uid, 'system', 'Готівкове замовлення на ' || p_amount::text || ' ₴ підтверджено');
  RETURN v_order_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.accept_cash_offer(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_cash_offer(uuid, numeric) TO authenticated;

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
  SELECT locked_address INTO v_address FROM public.profiles WHERE id = v_uid;
  INSERT INTO public.orders (client_id, master_id, price, status, payment_method, escrow_status, address)
  VALUES (v_chat.client_id, v_chat.master_id, p_amount, 'accepted', 'card', 'held', COALESCE(v_address, '—'))
  RETURNING id INTO v_order_id;
  UPDATE public.chats SET order_id = v_order_id WHERE id = p_chat_id;
  INSERT INTO public.transactions (order_id, master_id, kind, amount)
  VALUES (v_order_id, v_chat.master_id, 'hold', p_amount);
  INSERT INTO public.messages (chat_id, sender_id, kind, body)
  VALUES (p_chat_id, v_uid, 'system', 'Кошти ' || p_amount::text || ' ₴ заморожено на ескроу-рахунку');
  RETURN v_order_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.pay_escrow_hold(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pay_escrow_hold(uuid, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_chat_read(p_chat_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = p_chat_id AND v_uid IN (c.client_id, c.master_id)
  ) THEN RAISE EXCEPTION 'Chat access denied'; END IF;
  UPDATE public.messages
  SET read_at = now()
  WHERE chat_id = p_chat_id AND sender_id <> v_uid AND read_at IS NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mark_chat_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_chat_read(uuid) TO authenticated;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_order_author
  ON public.reviews(order_id, author_id) WHERE order_id IS NOT NULL;
DROP POLICY IF EXISTS "rev author write" ON public.reviews;
REVOKE INSERT ON public.reviews FROM authenticated;

CREATE OR REPLACE FUNCTION public.leave_order_review(p_order_id uuid, p_rating integer, p_text text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_target uuid;
  v_review_id uuid;
BEGIN
  IF p_rating NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'Rating must be between 1 and 5'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND OR v_order.status <> 'completed' THEN RAISE EXCEPTION 'Only completed orders can be reviewed'; END IF;
  IF v_uid = v_order.client_id THEN v_target := v_order.master_id;
  ELSIF v_uid = v_order.master_id THEN v_target := v_order.client_id;
  ELSE RAISE EXCEPTION 'Order access denied';
  END IF;
  INSERT INTO public.reviews (order_id, target_id, author_id, rating, text)
  VALUES (p_order_id, v_target, v_uid, p_rating, NULLIF(trim(p_text), ''))
  RETURNING id INTO v_review_id;
  UPDATE public.profiles p
  SET rating = (
    SELECT round(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.target_id = v_target
  )
  WHERE p.id = v_target;
  RETURN v_review_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.leave_order_review(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leave_order_review(uuid, integer, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.start_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
  v_chat_id uuid;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.master_id <> v_uid THEN RAISE EXCEPTION 'Only the assigned master can start work'; END IF;
  IF v_order.status NOT IN ('accepted', 'enroute') THEN RAISE EXCEPTION 'Order cannot be started'; END IF;
  UPDATE public.orders SET status = 'in_progress' WHERE id = p_order_id;
  UPDATE public.profiles SET status = 'working' WHERE id = v_uid;
  SELECT id INTO v_chat_id FROM public.chats WHERE order_id = p_order_id LIMIT 1;
  IF v_chat_id IS NOT NULL THEN
    INSERT INTO public.messages (chat_id, sender_id, kind, body)
    VALUES (v_chat_id, v_uid, 'system', 'Майстер розпочав роботу');
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.start_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_order(uuid) TO authenticated;

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
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.master_id IS NULL OR v_order.price IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.status = 'completed' THEN RETURN; END IF;
  v_commission := round(v_order.price * 0.10, 2);
  v_master_share := v_order.price - v_commission;

  IF v_order.payment_method = 'card' THEN
    IF v_order.client_id <> v_uid THEN RAISE EXCEPTION 'Only the client can accept completed card work'; END IF;
    IF v_order.escrow_status <> 'held' THEN RAISE EXCEPTION 'Escrow is not held'; END IF;
    UPDATE public.profiles SET wallet_balance = wallet_balance + v_master_share WHERE id = v_order.master_id;
    INSERT INTO public.transactions (order_id, master_id, kind, amount) VALUES
      (p_order_id, v_order.master_id, 'release_master', v_master_share),
      (p_order_id, v_order.master_id, 'release_platform', v_commission);
    UPDATE public.orders SET status = 'completed', escrow_status = 'released', completed_at = now() WHERE id = p_order_id;
  ELSE
    IF v_order.master_id <> v_uid THEN RAISE EXCEPTION 'Only the master can complete a cash order'; END IF;
    UPDATE public.profiles SET wallet_balance = wallet_balance - v_commission WHERE id = v_order.master_id;
    INSERT INTO public.transactions (order_id, master_id, kind, amount)
    VALUES (p_order_id, v_order.master_id, 'cash_debt', -v_commission);
    UPDATE public.orders SET status = 'completed', completed_at = now() WHERE id = p_order_id;
  END IF;

  UPDATE public.profiles
  SET status = CASE WHEN wallet_balance < -400 THEN 'offline'::public.master_status ELSE 'free'::public.master_status END
  WHERE id = v_order.master_id;
  SELECT id INTO v_chat_id FROM public.chats WHERE order_id = p_order_id LIMIT 1;
  IF v_chat_id IS NOT NULL THEN
    INSERT INTO public.messages (chat_id, sender_id, kind, body)
    VALUES (v_chat_id, v_uid, 'system', 'Замовлення завершено. Дякуємо за роботу!');
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
  IF NOT FOUND OR v_chat.order_id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = v_chat.order_id FOR UPDATE;
  IF p_resolution = 'release_master' THEN
    v_commission := round(COALESCE(v_order.price, 0) * 0.10, 2);
    v_master_share := COALESCE(v_order.price, 0) - v_commission;
    UPDATE public.profiles SET wallet_balance = wallet_balance + v_master_share WHERE id = v_order.master_id;
    INSERT INTO public.transactions (order_id, master_id, kind, amount) VALUES
      (v_order.id, v_order.master_id, 'release_master', v_master_share),
      (v_order.id, v_order.master_id, 'release_platform', v_commission);
    UPDATE public.orders SET status = 'completed', escrow_status = 'released', completed_at = now() WHERE id = v_order.id;
  ELSE
    UPDATE public.orders SET status = 'cancelled', escrow_status = 'refunded' WHERE id = v_order.id;
  END IF;
  UPDATE public.disputes
  SET status = 'resolved', resolution = p_resolution, admin_id = v_uid
  WHERE order_id = v_order.id AND status = 'open';
  UPDATE public.chats SET dispute_active = false WHERE id = p_chat_id;
  INSERT INTO public.messages (chat_id, sender_id, kind, body)
  VALUES (
    p_chat_id, v_uid, 'system',
    CASE WHEN p_resolution = 'release_master'
      THEN 'Арбітраж завершено: кошти переказано майстру'
      ELSE 'Арбітраж завершено: кошти повернено клієнту'
    END
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.resolve_dispute(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_dispute(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.wallet_run_friday_payouts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payout_row record;
  payout_count integer := 0;
BEGIN
  FOR payout_row IN
    SELECT p.id, p.wallet_balance
    FROM public.profiles p
    WHERE p.wallet_balance > 0
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = p.id AND ur.role = 'master'
      )
    FOR UPDATE
  LOOP
    UPDATE public.profiles SET wallet_balance = 0 WHERE id = payout_row.id;
    INSERT INTO public.transactions (master_id, kind, amount)
    VALUES (payout_row.id, 'payout', -payout_row.wallet_balance);
    payout_count := payout_count + 1;
  END LOOP;
  RETURN payout_count;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.wallet_run_friday_payouts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_run_friday_payouts() TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
DECLARE
  existing_job bigint;
BEGIN
  SELECT jobid INTO existing_job FROM cron.job WHERE jobname = 'handy-pro-friday-payout' LIMIT 1;
  IF existing_job IS NOT NULL THEN PERFORM cron.unschedule(existing_job); END IF;
  PERFORM cron.schedule(
    'handy-pro-friday-payout',
    '0 9 * * 5',
    'SELECT public.wallet_run_friday_payouts()'
  );
END;
$$;

-- Private chat media bucket. Object paths begin with the chat id.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-media', 'chat-media', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/webm', 'audio/ogg'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "chat media participant read" ON storage.objects;
CREATE POLICY "chat media participant read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = ((storage.foldername(name))[1])::uuid
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
      SELECT 1 FROM public.chats c
      WHERE c.id = ((storage.foldername(name))[1])::uuid
        AND auth.uid() IN (c.client_id, c.master_id)
    )
  );
DROP POLICY IF EXISTS "chat media owner delete" ON storage.objects;
CREATE POLICY "chat media owner delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'chat-media' AND owner_id = auth.uid()::text);
