export interface Employee {
  id: string;
  user_id: string;
  employee_code: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string;
  avatar_url: string;
  blood_group: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  primary_phone: string;
  whatsapp_number: string;
  personal_email: string;
  work_email: string;
  current_address: string;
  city: string;
  state: string;
  pincode: string;
  job_role: string;
  department: string;
  employment_type: string;
  status: string;
  join_date: string;
  end_date: string | null;
  reporting_manager: string;
  work_location: string;
  salary_type: string;
  monthly_salary: number;
  hourly_rate: number;
  payment_mode: string;
  payment_date: string;
  bonus_notes: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  upi_id: string;
  pan_number: string;
  aadhaar_last4: string;
  pf_number: string;
  esi_number: string;
  skills: string;
  tools_used: string;
  internal_notes: string;
  offer_letter_ref: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  user_id: string;
  date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  hours_worked: number;
  notes: string;
  created_at: string;
}

export interface Payroll {
  id: string;
  employee_id: string;
  user_id: string;
  month: string;
  year: number;
  days_worked: number;
  hours_worked: number;
  basic_pay: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  status: string;
  paid_date: string | null;
  notes: string;
  created_at: string;
}

export interface EmployeeTask {
  id: string;
  employee_id: string;
  user_id: string;
  project_id: string | null;
  task_name: string;
  description: string;
  due_date: string | null;
  priority: string;
  status: string;
  created_at: string;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  user_id: string;
  doc_name: string;
  doc_type: string;
  file_path: string;
  file_name: string;
  file_size: number;
  notes: string;
  created_at: string;
}
