
DROP POLICY IF EXISTS "orders participant update" ON public.orders;
CREATE POLICY "orders participant update" ON public.orders
FOR UPDATE
USING (
  (auth.uid() = client_id AND master_id IS NOT NULL)
  OR (auth.uid() = master_id)
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (
    (auth.uid() = client_id)
    OR (auth.uid() = master_id)
    OR public.has_role(auth.uid(), 'admin')
  )
  AND client_id = (SELECT o.client_id FROM public.orders o WHERE o.id = orders.id)
  AND (
    public.has_role(auth.uid(), 'admin')
    OR master_id IS NOT DISTINCT FROM (SELECT o.master_id FROM public.orders o WHERE o.id = orders.id)
  )
);

DROP POLICY IF EXISTS "rev author write" ON public.reviews;
CREATE POLICY "rev author write" ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND auth.uid() <> target_id
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.status = 'completed'
      AND (
        (o.client_id = auth.uid() AND o.master_id = reviews.target_id)
        OR (o.master_id = auth.uid() AND o.client_id = reviews.target_id)
      )
  )
);
