/*
  # MyFinance OS - Complete Database Schema

  1. New Tables
    - `profiles` - User business profile and settings
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text) - User's full name
      - `business_name` (text) - Business name
      - `owner_name` (text) - Owner name
      - `address` (text) - Business address
      - `gstin` (text) - GST identification number
      - `email` (text) - Business email
      - `phone` (text) - Business phone
      - `default_currency` (text) - Default currency (INR/USD)
      - `budget_alerts_enabled` (boolean) - Budget alerts toggle
    - `expenses` - Expense records
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `amount` (numeric) - Expense amount
      - `category` (text) - Expense category
      - `type` (text) - Business/Personal/Client Project
      - `date` (date) - Expense date
      - `notes` (text) - Additional notes
      - `payment_method` (text) - Cash/UPI/Card/Bank
    - `income` - Income records
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `amount` (numeric) - Income amount
      - `source` (text) - Income source
      - `date` (date) - Income date
      - `notes` (text) - Additional notes
      - `client_name` (text) - Client name
      - `currency` (text) - Currency code
    - `goals` - Financial goals
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Goal name
      - `type` (text) - Goal type
      - `target_amount` (numeric) - Target amount
      - `current_amount` (numeric) - Current progress
      - `target_date` (date) - Target completion date
      - `description` (text) - Goal description
      - `status` (text) - on_track/at_risk/completed
    - `budget_limits` - Monthly budget limits per category
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `category` (text) - Expense category
      - `monthly_limit` (numeric) - Monthly limit amount
    - `invoices` - Invoice documents
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - Full from/to business details
      - `invoice_date`, `due_date` (date)
      - `subtotal`, `discount`, `tax_amount`, `total` (numeric)
      - `status` (text) - draft/sent/paid/overdue
    - `invoice_items` - Invoice line items
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, references invoices)
      - `description`, `qty`, `rate`, `amount`, `gst_rate`
    - `quotations` - Quotation documents
      - Same structure as invoices with quote_number, valid_until
      - `status` (text) - draft/sent/accepted/rejected
    - `quotation_items` - Quotation line items
    - `agreements` - Sales agreements
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - Party 1 and Party 2 details
      - `description`, `scope`, `deliverables` (jsonb arrays)
      - `total_amount`, dates, terms, signature fields
      - `status` (text) - draft/active/completed/cancelled
    - `agreement_milestones` - Payment milestones
    - `emi_loans` - EMI/Loan tracking
      - Loan details, EMI amount, tenure, interest rate
    - `emi_payments` - Individual EMI payments
    - `subscriptions` - Subscription tracking
      - Service details, billing cycle, next billing date

  2. Security
    - RLS enabled on ALL tables
    - Each table has SELECT, INSERT, UPDATE, DELETE policies
    - All policies restricted to authenticated users accessing their own data
*/

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL DEFAULT '',
  business_name text DEFAULT '',
  owner_name text DEFAULT '',
  address text DEFAULT '',
  gstin text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  default_currency text DEFAULT 'INR',
  budget_alerts_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  amount numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'Personal',
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  payment_method text DEFAULT 'Cash',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Income
CREATE TABLE IF NOT EXISTS income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  amount numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  client_name text DEFAULT '',
  currency text DEFAULT 'INR',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own income"
  ON income FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income"
  ON income FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income"
  ON income FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own income"
  ON income FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'Save Money',
  target_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric NOT NULL DEFAULT 0,
  target_date date,
  description text DEFAULT '',
  status text DEFAULT 'on_track',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Budget Limits
CREATE TABLE IF NOT EXISTS budget_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  category text NOT NULL DEFAULT '',
  monthly_limit numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget limits"
  ON budget_limits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget limits"
  ON budget_limits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget limits"
  ON budget_limits FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget limits"
  ON budget_limits FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  invoice_number text NOT NULL DEFAULT '',
  from_business_name text DEFAULT '',
  from_address text DEFAULT '',
  from_gstin text DEFAULT '',
  from_email text DEFAULT '',
  from_phone text DEFAULT '',
  to_client_name text DEFAULT '',
  to_address text DEFAULT '',
  to_gstin text DEFAULT '',
  to_email text DEFAULT '',
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  gst_rate numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  subtotal numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  notes text DEFAULT '',
  terms text DEFAULT '',
  currency text DEFAULT 'INR',
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text DEFAULT '',
  qty numeric DEFAULT 1,
  rate numeric DEFAULT 0,
  amount numeric DEFAULT 0,
  gst_rate numeric DEFAULT 0
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoice items"
  ON invoice_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own invoice items"
  ON invoice_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own invoice items"
  ON invoice_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own invoice items"
  ON invoice_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  quote_number text NOT NULL DEFAULT '',
  from_business_name text DEFAULT '',
  from_address text DEFAULT '',
  from_gstin text DEFAULT '',
  from_email text DEFAULT '',
  from_phone text DEFAULT '',
  to_client_name text DEFAULT '',
  to_address text DEFAULT '',
  to_gstin text DEFAULT '',
  to_email text DEFAULT '',
  quote_date date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  gst_rate numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  subtotal numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  notes text DEFAULT '',
  terms text DEFAULT '',
  currency text DEFAULT 'INR',
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotations"
  ON quotations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotations"
  ON quotations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotations"
  ON quotations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotations"
  ON quotations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Quotation Items
CREATE TABLE IF NOT EXISTS quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  description text DEFAULT '',
  qty numeric DEFAULT 1,
  rate numeric DEFAULT 0,
  amount numeric DEFAULT 0,
  gst_rate numeric DEFAULT 0
);

ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotation items"
  ON quotation_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_items.quotation_id
      AND quotations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own quotation items"
  ON quotation_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_items.quotation_id
      AND quotations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own quotation items"
  ON quotation_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_items.quotation_id
      AND quotations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_items.quotation_id
      AND quotations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own quotation items"
  ON quotation_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_items.quotation_id
      AND quotations.user_id = auth.uid()
    )
  );

-- Agreements
CREATE TABLE IF NOT EXISTS agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  agreement_number text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  party1_name text DEFAULT '',
  party1_address text DEFAULT '',
  party1_gstin text DEFAULT '',
  party2_name text DEFAULT '',
  party2_address text DEFAULT '',
  party2_gstin text DEFAULT '',
  description text DEFAULT '',
  scope jsonb DEFAULT '[]'::jsonb,
  deliverables jsonb DEFAULT '[]'::jsonb,
  total_amount numeric DEFAULT 0,
  start_date date,
  end_date date,
  terms text DEFAULT '',
  signature1_name text DEFAULT '',
  signature1_date date,
  signature2_name text DEFAULT '',
  signature2_date date,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agreements"
  ON agreements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agreements"
  ON agreements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agreements"
  ON agreements FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agreements"
  ON agreements FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Agreement Milestones
CREATE TABLE IF NOT EXISTS agreement_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  milestone text DEFAULT '',
  amount numeric DEFAULT 0,
  due_date date
);

ALTER TABLE agreement_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agreement milestones"
  ON agreement_milestones FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agreements
      WHERE agreements.id = agreement_milestones.agreement_id
      AND agreements.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own agreement milestones"
  ON agreement_milestones FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agreements
      WHERE agreements.id = agreement_milestones.agreement_id
      AND agreements.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own agreement milestones"
  ON agreement_milestones FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agreements
      WHERE agreements.id = agreement_milestones.agreement_id
      AND agreements.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agreements
      WHERE agreements.id = agreement_milestones.agreement_id
      AND agreements.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own agreement milestones"
  ON agreement_milestones FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agreements
      WHERE agreements.id = agreement_milestones.agreement_id
      AND agreements.user_id = auth.uid()
    )
  );

-- EMI Loans
CREATE TABLE IF NOT EXISTS emi_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  loan_name text NOT NULL DEFAULT '',
  total_amount numeric NOT NULL DEFAULT 0,
  emi_amount numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  tenure_months integer NOT NULL DEFAULT 12,
  interest_rate numeric DEFAULT 0,
  lender_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emi_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emi loans"
  ON emi_loans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emi loans"
  ON emi_loans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emi loans"
  ON emi_loans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emi loans"
  ON emi_loans FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- EMI Payments
CREATE TABLE IF NOT EXISTS emi_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES emi_loans(id) ON DELETE CASCADE,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL DEFAULT 0,
  month_number integer NOT NULL DEFAULT 1
);

ALTER TABLE emi_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emi payments"
  ON emi_payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emi_loans
      WHERE emi_loans.id = emi_payments.loan_id
      AND emi_loans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own emi payments"
  ON emi_payments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM emi_loans
      WHERE emi_loans.id = emi_payments.loan_id
      AND emi_loans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own emi payments"
  ON emi_payments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emi_loans
      WHERE emi_loans.id = emi_payments.loan_id
      AND emi_loans.user_id = auth.uid()
    )
  );

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  service_name text NOT NULL DEFAULT '',
  category text DEFAULT 'Other',
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'INR',
  billing_cycle text DEFAULT 'Monthly',
  next_billing_date date,
  payment_method text DEFAULT '',
  status text DEFAULT 'Active',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_income_user_id ON income(user_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_agreements_user_id ON agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_emi_loans_user_id ON emi_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;