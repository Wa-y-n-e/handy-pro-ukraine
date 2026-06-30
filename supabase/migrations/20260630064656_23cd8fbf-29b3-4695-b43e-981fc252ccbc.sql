
-- Drop the definer view; switch to column-level grants instead
DROP VIEW IF EXISTS public.public_profiles;

-- Replace self-only SELECT with a broader policy; column grants enforce confidentiality
DROP POLICY IF EXISTS "profiles self read" ON public.profiles;

CREATE POLICY "profiles read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Restrict which columns authenticated/anon can read
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, full_name, avatar_url, rating, status, verified,
  has_vehicle, tools_inventory, experience_years,
  primary_category_slug, locked_lat, locked_lng, created_at
) ON public.profiles TO authenticated;

-- service_role keeps full access (granted by default ALL); ensure it
GRANT ALL ON public.profiles TO service_role;

-- RPC for the owner to fetch their full profile (includes phone, wallet_balance, locked_address)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
