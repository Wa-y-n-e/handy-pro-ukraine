
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT
  id, full_name, avatar_url, rating, status, verified,
  primary_category_slug, has_vehicle, tools_inventory, experience_years, created_at,
  CASE WHEN status = 'free' THEN locked_lat ELSE NULL END AS locked_lat,
  CASE WHEN status = 'free' THEN locked_lng ELSE NULL END AS locked_lng
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;
