/*
  # Create template-images Storage Bucket

  ## Purpose
  Dedicated public storage bucket for image template reference images.
  Replaces the generic 'media' bucket usage for template thumbnails so
  they are always served from a stable, public Supabase URL.

  ## Changes
  - Creates 'template-images' bucket (public)
  - Storage policies: authenticated users can upload/update/delete their own files
  - Public read access for all files (needed so images render in the UI without auth headers)
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'template-images',
  'template-images',
  true,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Template images public read'
  ) THEN
    CREATE POLICY "Template images public read"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'template-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Template images authenticated insert'
  ) THEN
    CREATE POLICY "Template images authenticated insert"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'template-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Template images authenticated update'
  ) THEN
    CREATE POLICY "Template images authenticated update"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'template-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Template images authenticated delete'
  ) THEN
    CREATE POLICY "Template images authenticated delete"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'template-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;
