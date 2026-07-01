-- Public vitrine media. Writes remain restricted to the authenticated user's folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'profile-avatars',
    'profile-avatars',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  ),
  (
    'portfolio-photos',
    'portfolio-photos',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "profile avatars public read" ON storage.objects;
CREATE POLICY "profile avatars public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "profile avatars owner insert" ON storage.objects;
CREATE POLICY "profile avatars owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND owner_id = auth.uid()::text
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile avatars owner update" ON storage.objects;
CREATE POLICY "profile avatars owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND owner_id = auth.uid()::text
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND owner_id = auth.uid()::text
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile avatars owner delete" ON storage.objects;
CREATE POLICY "profile avatars owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND owner_id = auth.uid()::text
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "portfolio photos public read" ON storage.objects;
CREATE POLICY "portfolio photos public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'portfolio-photos');

DROP POLICY IF EXISTS "portfolio photos owner master insert" ON storage.objects;
CREATE POLICY "portfolio photos owner master insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio-photos'
    AND owner_id = auth.uid()::text
    AND public.has_role(auth.uid(), 'master')
    AND (storage.foldername(name))[1] = 'portfolio'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "portfolio photos owner master update" ON storage.objects;
CREATE POLICY "portfolio photos owner master update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'portfolio-photos'
    AND owner_id = auth.uid()::text
    AND public.has_role(auth.uid(), 'master')
    AND (storage.foldername(name))[1] = 'portfolio'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'portfolio-photos'
    AND owner_id = auth.uid()::text
    AND public.has_role(auth.uid(), 'master')
    AND (storage.foldername(name))[1] = 'portfolio'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "portfolio photos owner master delete" ON storage.objects;
CREATE POLICY "portfolio photos owner master delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'portfolio-photos'
    AND owner_id = auth.uid()::text
    AND public.has_role(auth.uid(), 'master')
    AND (storage.foldername(name))[1] = 'portfolio'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
