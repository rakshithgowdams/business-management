/*
  # Create media-assets storage bucket

  1. New Storage Bucket
    - `media-assets` (public) for storing generated images, videos, audio, music
    - Public read access so assets can be displayed in the app
  
  2. Table Changes
    - Add `storage_path` column to `media_assets` to track the Supabase Storage path
  
  3. Security
    - Users can upload files to their own folder (user_id prefix)
    - Users can read any public file
    - Users can only update/delete their own files
    - File size limit: 50MB
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('media-assets', 'media-assets', true, 52428800)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media_assets' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE media_assets ADD COLUMN storage_path text;
  END IF;
END $$;

CREATE POLICY "Users can upload media to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view media assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'media-assets');

CREATE POLICY "Users can update own media files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'media-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'media-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own media files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
