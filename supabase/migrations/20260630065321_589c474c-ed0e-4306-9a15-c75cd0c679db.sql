
DROP POLICY IF EXISTS "roles admin insert" ON public.user_roles;
DROP POLICY IF EXISTS "roles admin update" ON public.user_roles;
DROP POLICY IF EXISTS "roles admin delete" ON public.user_roles;

CREATE POLICY "roles admin insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles admin update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles admin delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "profiles read" ON public.profiles;
DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
DROP POLICY IF EXISTS "profiles admin read" ON public.profiles;

CREATE POLICY "profiles self read" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "profiles admin read" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT id, full_name, avatar_url, rating, status, verified, primary_category_slug
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;
