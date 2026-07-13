-- Supabase Storage Setup for STEMPal
-- Run this in the Supabase SQL Editor AFTER creating buckets manually

-- Allow authenticated users to upload to profiles bucket
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profiles');

CREATE POLICY "Anyone can view profile pictures"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profiles');

CREATE POLICY "Users can update own profile pictures"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own profile pictures"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to upload to pdfs bucket
CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects FOR INSERT TO authenticated
USING (bucket_id = 'pdfs');

CREATE POLICY "Users can view own PDFs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own PDFs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
