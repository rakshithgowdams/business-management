/*
  # Add preview_video_url to video_templates and custom_camera_movements

  1. Changes
    - `video_templates`: Add `preview_video_url` (text, nullable) — URL of a reference/preview video attached to the template
    - `custom_camera_movements`: Add `preview_video_url` (text, nullable) — URL of a video demonstrating the camera movement

  2. Notes
    - Both columns are nullable (existing records are unaffected)
    - Videos are stored in the media storage bucket and the public URL saved here
    - These URLs are displayed as previews in the Kling 3.0 Studio and the Settings managers
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_templates' AND column_name = 'preview_video_url'
  ) THEN
    ALTER TABLE video_templates ADD COLUMN preview_video_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_camera_movements' AND column_name = 'preview_video_url'
  ) THEN
    ALTER TABLE custom_camera_movements ADD COLUMN preview_video_url text;
  END IF;
END $$;
