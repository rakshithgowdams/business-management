export interface TeamMember {
  id: string;
  owner_id: string;
  full_name: string;
  email: string;
  role: 'employee' | 'management';
  department: string;
  job_title: string;
  avatar_url: string;
  is_active: boolean;
  permissions: string[];
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamSession {
  session_token: string;
  expires_at: string;
  member: TeamMember;
}
