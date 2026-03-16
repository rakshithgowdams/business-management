/*
  # Create Employees Module

  1. New Tables
    - `employees`
      - All personal, contact, employment, salary, bank, skills fields
    - `employee_attendance`
      - Daily attendance records with check-in/check-out
    - `employee_payroll`
      - Monthly payroll records
    - `employee_tasks`
      - Tasks assigned to employees
    - `employee_documents`
      - Document metadata for uploaded files

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  employee_code text NOT NULL DEFAULT '',
  full_name text NOT NULL,
  date_of_birth date,
  gender text DEFAULT '',
  avatar_url text DEFAULT '',
  blood_group text DEFAULT '',
  emergency_contact_name text DEFAULT '',
  emergency_contact_phone text DEFAULT '',
  primary_phone text NOT NULL DEFAULT '',
  whatsapp_number text DEFAULT '',
  personal_email text NOT NULL DEFAULT '',
  work_email text DEFAULT '',
  current_address text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  pincode text DEFAULT '',
  job_role text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT 'Development',
  employment_type text NOT NULL DEFAULT 'Full-time',
  status text NOT NULL DEFAULT 'Active',
  join_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  reporting_manager text DEFAULT '',
  work_location text DEFAULT 'Office',
  salary_type text NOT NULL DEFAULT 'Monthly Fixed',
  monthly_salary numeric DEFAULT 0,
  hourly_rate numeric DEFAULT 0,
  payment_mode text DEFAULT 'Bank Transfer',
  payment_date text DEFAULT '1',
  bonus_notes text DEFAULT '',
  bank_name text DEFAULT '',
  account_number text DEFAULT '',
  ifsc_code text DEFAULT '',
  account_holder_name text DEFAULT '',
  upi_id text DEFAULT '',
  pan_number text DEFAULT '',
  aadhaar_last4 text DEFAULT '',
  pf_number text DEFAULT '',
  esi_number text DEFAULT '',
  skills text DEFAULT '',
  tools_used text DEFAULT '',
  internal_notes text DEFAULT '',
  offer_letter_ref text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own employees"
  ON employees FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own employees"
  ON employees FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own employees"
  ON employees FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own employees"
  ON employees FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);

CREATE TABLE IF NOT EXISTS employee_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'Present',
  check_in time,
  check_out time,
  hours_worked numeric DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance"
  ON employee_attendance FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance"
  ON employee_attendance FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance"
  ON employee_attendance FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attendance"
  ON employee_attendance FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON employee_attendance(employee_id);

CREATE TABLE IF NOT EXISTS employee_payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  month text NOT NULL,
  year integer NOT NULL,
  days_worked integer DEFAULT 0,
  hours_worked numeric DEFAULT 0,
  basic_pay numeric DEFAULT 0,
  bonus numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  net_pay numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending',
  paid_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

ALTER TABLE employee_payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payroll"
  ON employee_payroll FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payroll"
  ON employee_payroll FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payroll"
  ON employee_payroll FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payroll"
  ON employee_payroll FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON employee_payroll(employee_id);

CREATE TABLE IF NOT EXISTS employee_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  task_name text NOT NULL,
  description text DEFAULT '',
  due_date date,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON employee_tasks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON employee_tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON employee_tasks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON employee_tasks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON employee_tasks(employee_id);

CREATE TABLE IF NOT EXISTS employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  doc_name text NOT NULL DEFAULT '',
  doc_type text NOT NULL DEFAULT 'Other',
  file_path text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  file_size integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own employee documents"
  ON employee_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own employee documents"
  ON employee_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own employee documents"
  ON employee_documents FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own employee documents"
  ON employee_documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_emp_documents_employee_id ON employee_documents(employee_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-documents',
  'employee-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload employee documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'employee-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view employee documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'employee-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete employee documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'employee-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );