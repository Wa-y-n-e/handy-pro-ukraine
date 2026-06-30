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