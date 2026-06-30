
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin','master','client');
CREATE TYPE public.master_status AS ENUM ('free','working','offline');
CREATE TYPE public.order_status AS ENUM ('pending','accepted','enroute','in_progress','completed','cancelled','disputed');
CREATE TYPE public.payment_method AS ENUM ('card','cash');
CREATE TYPE public.escrow_status AS ENUM ('none','held','released','disputed','refunded');
CREATE TYPE public.tx_kind AS ENUM ('hold','release_master','release_platform','cash_debt','payout','topup','instant_fee');
CREATE TYPE public.msg_kind AS ENUM ('text','voice','media','price_card','system');

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  phone text,
  rating numeric DEFAULT 5.0,
  status public.master_status DEFAULT 'offline',
  locked_address text,
  locked_lat double precision,
  locked_lng double precision,
  primary_category_slug text,
  verified boolean DEFAULT false,
  has_vehicle boolean DEFAULT false,
  tools_inventory text,
  experience_years int DEFAULT 0,
  wallet_balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles self upsert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

-- categories & subcategories
CREATE TABLE public.categories (
  slug text PRIMARY KEY,
  name_uk text NOT NULL,
  icon text NOT NULL,
  position int NOT NULL
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cats public" ON public.categories FOR SELECT USING (true);

CREATE TABLE public.subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug text NOT NULL REFERENCES public.categories(slug) ON DELETE CASCADE,
  name_uk text NOT NULL,
  position int NOT NULL
);
GRANT SELECT ON public.subcategories TO anon, authenticated;
GRANT ALL ON public.subcategories TO service_role;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs public" ON public.subcategories FOR SELECT USING (true);

CREATE TABLE public.master_subcategories (
  master_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subcategory_id uuid NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
  PRIMARY KEY (master_id, subcategory_id)
);
GRANT SELECT, INSERT, DELETE ON public.master_subcategories TO authenticated;
GRANT SELECT ON public.master_subcategories TO anon;
GRANT ALL ON public.master_subcategories TO service_role;
ALTER TABLE public.master_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ms public read" ON public.master_subcategories FOR SELECT USING (true);
CREATE POLICY "ms self manage" ON public.master_subcategories FOR ALL USING (auth.uid() = master_id) WITH CHECK (auth.uid() = master_id);

CREATE TABLE public.portfolio_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url text NOT NULL,
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.portfolio_photos TO authenticated;
GRANT SELECT ON public.portfolio_photos TO anon;
GRANT ALL ON public.portfolio_photos TO service_role;
ALTER TABLE public.portfolio_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "port public read" ON public.portfolio_photos FOR SELECT USING (true);
CREATE POLICY "port self manage" ON public.portfolio_photos FOR ALL USING (auth.uid() = master_id) WITH CHECK (auth.uid() = master_id);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rev public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "rev author write" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = author_id);

-- orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  master_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL,
  category_slug text REFERENCES public.categories(slug),
  address text,
  lat double precision,
  lng double precision,
  status public.order_status DEFAULT 'pending',
  price numeric,
  payment_method public.payment_method DEFAULT 'card',
  escrow_status public.escrow_status DEFAULT 'none',
  notes text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders participant read" ON public.orders FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = master_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders client insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "orders participant update" ON public.orders FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = master_id OR public.has_role(auth.uid(),'admin'));

-- chats
CREATE TABLE public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  master_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dispute_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.chats TO authenticated;
GRANT ALL ON public.chats TO service_role;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chats participant read" ON public.chats FOR SELECT
  USING (auth.uid() IN (client_id, master_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "chats participant insert" ON public.chats FOR INSERT
  WITH CHECK (auth.uid() IN (client_id, master_id));
CREATE POLICY "chats participant update" ON public.chats FOR UPDATE
  USING (auth.uid() IN (client_id, master_id) OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text,
  media_url text,
  reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  kind public.msg_kind DEFAULT 'text',
  price numeric,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msgs chat participant read" ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND
    (auth.uid() IN (c.client_id, c.master_id) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "msgs chat participant write" ON public.messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND
    (auth.uid() IN (c.client_id, c.master_id) OR public.has_role(auth.uid(),'admin'))) AND sender_id = auth.uid());
CREATE POLICY "msgs sender update" ON public.messages FOR UPDATE USING (sender_id = auth.uid());

-- transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  master_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  kind public.tx_kind NOT NULL,
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx self read" ON public.transactions FOR SELECT
  USING (auth.uid() = master_id OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND auth.uid() = o.client_id));
CREATE POLICY "tx participant insert" ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- disputes
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL REFERENCES public.profiles(id),
  status text DEFAULT 'open',
  resolution text,
  admin_id uuid,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.disputes TO authenticated;
GRANT ALL ON public.disputes TO service_role;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disp read participant" ON public.disputes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
    AND (auth.uid() IN (o.client_id, o.master_id) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "disp insert participant" ON public.disputes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
    AND auth.uid() IN (o.client_id, o.master_id)));
CREATE POLICY "disp update admin" ON public.disputes FOR UPDATE
  USING (public.has_role(auth.uid(),'admin'));

-- handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.phone)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'client'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Debt auto-ban trigger: when wallet drops below -400, set status offline
CREATE OR REPLACE FUNCTION public.check_master_debt()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.wallet_balance < -400 AND NEW.status <> 'offline' THEN
    NEW.status := 'offline';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER debt_ban_trigger BEFORE UPDATE OF wallet_balance ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_master_debt();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
