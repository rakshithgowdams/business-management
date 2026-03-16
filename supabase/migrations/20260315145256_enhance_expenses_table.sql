/*
  # Enhance Expenses Table

  ## Changes
  1. Add `vendor` column — name of vendor/service (e.g., OpenRouter, Kie.ai, AWS)
  2. Add `project_id` column — optional FK to projects table
  3. Add `subscription_id` column — optional FK to subscriptions table
  4. Add `is_auto_imported` boolean flag — marks auto-imported entries
  5. Add `source_type` column — 'manual' | 'project' | 'subscription' | 'emi' | 'receipt_scan'
  6. Add `currency` column — multi-currency support
  7. Add indexes for new columns

  ## Purpose
  Enables auto-importing expenses from projects, subscriptions, EMI loans, and receipt scans,
  plus vendor-level tracking and multi-currency support.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'vendor'
  ) THEN
    ALTER TABLE expenses ADD COLUMN vendor text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'subscription_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'is_auto_imported'
  ) THEN
    ALTER TABLE expenses ADD COLUMN is_auto_imported boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE expenses ADD COLUMN source_type text DEFAULT 'manual';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'currency'
  ) THEN
    ALTER TABLE expenses ADD COLUMN currency text DEFAULT 'INR';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_subscription_id ON expenses(subscription_id);
CREATE INDEX IF NOT EXISTS idx_expenses_source_type ON expenses(source_type);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor);
