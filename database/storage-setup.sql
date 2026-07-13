-- Supabase Storage Policies for STEMPal
-- Run this in the SQL Editor

-- Drop any conflicting auto-created policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Give users access to own folder 1j0r1cc_0" ON storage.objects;
  DROP POLICY IF EXISTS "Give users access to own folder 1j0r1cc_1" ON storage.objects;
  DROP POLICY IF EXISTS "Give users access to own folder 1j0r1cc_2" ON storage.objects;
  DROP POLICY IF EXISTS "Give users access to own folder 1j0r1cc_3" ON storage.objects;
  DROP POLICY IF EXISTS "Give public access to profiles 1j0r1cc_4" ON storage.objects;
  DROP POLICY IF EXISTS "Give public access to pdfs 1j0r1cc_5" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Profiles bucket: anyone can view, authenticated can upload their own
CREATE POLICY "profiles_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'profiles');

CREATE POLICY "profiles_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profiles');

CREATE POLICY "profiles_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- PDFs bucket: authenticated can view/upload/delete their own
CREATE POLICY "pdfs_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pdfs');

CREATE POLICY "pdfs_select" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "pdfs_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
