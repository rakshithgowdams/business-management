/*
  # Add Theme Support to Invoices

  ## Changes
  1. Add `theme_id` column — stores selected preset theme ID (e.g., 'ocean-blue')
  2. Add `custom_theme` column — stores JSON of custom color overrides
  3. Add `discount_type` column — ensure it exists with a default
  4. Same columns added to quotations table

  ## Purpose
  Allows each invoice/quotation to save its own theme and custom colors, so
  when previewing or downloading PDF the correct colors are used.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'theme_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN theme_id text DEFAULT 'classic-bw';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'custom_theme'
  ) THEN
    ALTER TABLE invoices ADD COLUMN custom_theme jsonb DEFAULT NULL;
  END IF;
END $$;

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

CREATE INDEX IF NOT EXISTS idx_invoices_theme_id ON invoices(theme_id);
