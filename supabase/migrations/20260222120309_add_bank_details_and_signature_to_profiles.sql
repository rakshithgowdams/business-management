/*
  # Add bank details and signature to profiles

  1. Modified Tables
    - `profiles`
      - `bank_account_name` (text) - Bank account holder name
      - `bank_account_number` (text) - Bank account number
      - `bank_ifsc_code` (text) - IFSC code
      - `bank_name` (text) - Name of the bank
      - `signature_url` (text) - Storage path for uploaded signature image

  2. Important Notes
    - Bank details are optional and shown on invoices/quotations when toggled on
    - Signature is uploaded to the avatars storage bucket
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bank_account_name') THEN
    ALTER TABLE profiles ADD COLUMN bank_account_name text DEFAULT '' NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bank_account_number') THEN
    ALTER TABLE profiles ADD COLUMN bank_account_number text DEFAULT '' NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bank_ifsc_code') THEN
    ALTER TABLE profiles ADD COLUMN bank_ifsc_code text DEFAULT '' NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bank_name') THEN
    ALTER TABLE profiles ADD COLUMN bank_name text DEFAULT '' NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'signature_url') THEN
    ALTER TABLE profiles ADD COLUMN signature_url text DEFAULT '' NOT NULL;
  END IF;
END $$;
