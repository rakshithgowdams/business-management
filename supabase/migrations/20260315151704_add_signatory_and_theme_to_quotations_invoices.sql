/*
  # Add Signatory Info and Theme to Quotations and Invoices

  ## Changes
  1. quotations table:
     - Add `theme_id` — selected preset theme ID
     - Add `custom_theme` — JSON of custom color overrides
     - Add `signatory_name` — name to display under Authorised Signatory
     - Add `signatory_designation` — designation/title to display under signatory name

  2. invoices table:
     - Add `signatory_name` — name to display under Authorised Signatory
     - Add `signatory_designation` — designation/title to display under signatory name

  ## Purpose
  Allows users to brand the signatory section of PDFs with their name and title.
  Quotations also get proper theme persistence like invoices already have.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'theme_id'
  ) THEN
    ALTER TABLE quotations ADD COLUMN theme_id text DEFAULT 'classic-bw';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'custom_theme'
  ) THEN
    ALTER TABLE quotations ADD COLUMN custom_theme jsonb DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'signatory_name'
  ) THEN
    ALTER TABLE quotations ADD COLUMN signatory_name text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'signatory_designation'
  ) THEN
    ALTER TABLE quotations ADD COLUMN signatory_designation text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'signatory_name'
  ) THEN
    ALTER TABLE invoices ADD COLUMN signatory_name text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'signatory_designation'
  ) THEN
    ALTER TABLE invoices ADD COLUMN signatory_designation text DEFAULT '';
  END IF;
END $$;
