/*
  # Enhance Income Table & Add Project Income Linking

  ## Changes
  1. Add `category` column to income table (for finer classification)
  2. Add `project_id` column to income table (FK to projects, nullable)
  3. Add `payment_method` column to income table
  4. Add `invoice_id` column to income table (FK to invoices, nullable)
  5. Add `is_project_income` boolean flag
  6. Add index on project_id for fast lookups

  ## Purpose
  Allows income records to be linked directly to projects and invoices,
  and enables auto-fetching of project revenue as income entries.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income' AND column_name = 'category'
  ) THEN
    ALTER TABLE income ADD COLUMN category text DEFAULT 'General';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE income ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income' AND column_name = 'invoice_id'
  ) THEN
    ALTER TABLE income ADD COLUMN invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE income ADD COLUMN payment_method text DEFAULT 'Bank Transfer';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income' AND column_name = 'is_project_income'
  ) THEN
    ALTER TABLE income ADD COLUMN is_project_income boolean DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_income_project_id ON income(project_id);
CREATE INDEX IF NOT EXISTS idx_income_invoice_id ON income(invoice_id);
CREATE INDEX IF NOT EXISTS idx_income_category ON income(category);
