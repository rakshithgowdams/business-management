/*
  # Create website-assets storage bucket

  Stores logo images and other assets for website builder projects.
  - Bucket: website-assets (public)
  - RLS: authenticated users can upload/read their own files
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-assets',
  'website-assets',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload website assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'website-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view website assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'website-assets');

CREATE POLICY "Users can delete own website assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'website-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
