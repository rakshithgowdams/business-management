export interface PasswordEntry {
  id: string;
  user_id: string;
  title: string;
  category: string;
  username: string;
  encrypted_password: string;
  website_url: string;
  notes: string;
  is_favorite: boolean;
  last_used: string | null;
  password_strength: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface PasswordFormData {
  title: string;
  category: string;
  username: string;
  encrypted_password: string;
  website_url: string;
  notes: string;
  tags: string[];
}
