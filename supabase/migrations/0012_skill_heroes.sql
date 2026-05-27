-- Manual setup required: create a public bucket named 'skill-heroes' in
-- Supabase Storage with a 5 MB per-file size limit. This cannot be done
-- via SQL migrations — use the Supabase Dashboard or CLI:
--   supabase storage create skill-heroes --public --file-size-limit 5242880

ALTER TABLE skills
  ADD COLUMN IF NOT EXISTS hero_image_url  TEXT,
  ADD COLUMN IF NOT EXISTS hero_loop_url   TEXT,
  ADD COLUMN IF NOT EXISTS hero_poster_url TEXT;

-- Storage RLS policies for the skill-heroes bucket.
-- Objects are namespaced under the uploading user's auth.uid() so users
-- can only modify their own uploads while the bucket is publicly readable.

CREATE POLICY "skill_heroes_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'skill-heroes');

CREATE POLICY "skill_heroes_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'skill-heroes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "skill_heroes_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'skill-heroes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "skill_heroes_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'skill-heroes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
