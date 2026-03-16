/*
  # Add business logo URL to profiles

  1. Modified Tables
    - `profiles`
      - Added `business_logo_url` (text) - stores the storage path of the business logo
  
  2. Important Notes
    - This field stores the Supabase storage path (not a full URL)
    - Used in invoice and quotation PDF generation
    - Logo is uploaded to the existing 'avatars' bucket
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'business_logo_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN business_logo_url text DEFAULT '' NOT NULL;
  END IF;
END $$;
