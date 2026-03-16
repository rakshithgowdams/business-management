/*
  # Enhance Invoice & Quotation Features (Refrens-inspired)

  1. Modified Tables
    - `invoices`
      - `to_phone` (text) - Client phone number
      - `payment_terms` (text) - Payment terms like Net 30, Net 60
      - `place_of_supply` (text) - For GST inter/intra state determination
      - `discount_type` (text) - 'flat' or 'percentage'
      - `po_number` (text) - Purchase order reference
    - `invoice_items`
      - `hsn_sac` (text) - HSN/SAC code for GST
      - `unit` (text) - Unit of measurement (hrs, pcs, etc.)
    - `quotations`
      - `to_phone` (text) - Client phone
      - `payment_terms` (text) - Payment terms
      - `scope_of_work` (text) - Scope description
      - `delivery_timeline` (text) - Delivery timeline
      - `discount_type` (text) - 'flat' or 'percentage'
    - `quotation_items`
      - `hsn_sac` (text) - HSN/SAC code
      - `unit` (text) - Unit of measurement

  2. Important Notes
    - All new columns are nullable with sensible defaults
    - No data loss - only additive changes
    - Existing invoices/quotations will continue to work
*/

DO $$
BEGIN
  -- Invoice enhancements
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'to_phone') THEN
    ALTER TABLE invoices ADD COLUMN to_phone text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'payment_terms') THEN
    ALTER TABLE invoices ADD COLUMN payment_terms text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'place_of_supply') THEN
    ALTER TABLE invoices ADD COLUMN place_of_supply text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'discount_type') THEN
    ALTER TABLE invoices ADD COLUMN discount_type text DEFAULT 'flat';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'po_number') THEN
    ALTER TABLE invoices ADD COLUMN po_number text DEFAULT '';
  END IF;

  -- Invoice items enhancements
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'hsn_sac') THEN
    ALTER TABLE invoice_items ADD COLUMN hsn_sac text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'unit') THEN
    ALTER TABLE invoice_items ADD COLUMN unit text DEFAULT 'Nos';
  END IF;

  -- Quotation enhancements
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'to_phone') THEN
    ALTER TABLE quotations ADD COLUMN to_phone text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'payment_terms') THEN
    ALTER TABLE quotations ADD COLUMN payment_terms text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'scope_of_work') THEN
    ALTER TABLE quotations ADD COLUMN scope_of_work text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'delivery_timeline') THEN
    ALTER TABLE quotations ADD COLUMN delivery_timeline text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'discount_type') THEN
    ALTER TABLE quotations ADD COLUMN discount_type text DEFAULT 'flat';
  END IF;

  -- Quotation items enhancements
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotation_items' AND column_name = 'hsn_sac') THEN
    ALTER TABLE quotation_items ADD COLUMN hsn_sac text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotation_items' AND column_name = 'unit') THEN
    ALTER TABLE quotation_items ADD COLUMN unit text DEFAULT 'Nos';
  END IF;
END $$;
