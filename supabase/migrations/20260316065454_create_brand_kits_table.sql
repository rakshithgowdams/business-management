/*
  # Create Brand Kits Table

  ## Overview
  Brand Kits allow users to define and manage their complete brand identity
  in one place, then apply it across their website builder and other tools.

  ## New Tables
  - `brand_kits`
    - `id` (uuid, primary key)
    - `user_id` (uuid, FK to auth.users)
    - `name` (text) - Brand kit name, e.g. "My Business Brand"
    - `logo_url` (text) - Primary logo URL
    - `logo_dark_url` (text) - Dark background logo variant
    - `logo_icon_url` (text) - Icon/favicon version
    - `brand_name` (text) - Official business name
    - `tagline` (text) - Brand tagline
    - `primary_color` (text) - Primary brand color hex
    - `secondary_color` (text) - Secondary brand color hex
    - `accent_color` (text) - Accent color hex
    - `success_color` (text) - Success state color
    - `warning_color` (text) - Warning state color
    - `error_color` (text) - Error state color
    - `neutral_dark` (text) - Dark neutral hex
    - `neutral_mid` (text) - Mid neutral hex
    - `neutral_light` (text) - Light neutral hex
    - `heading_font` (text) - Google Font for headings
    - `body_font` (text) - Google Font for body text
    - `mono_font` (text) - Monospace font
    - `font_size_base` (text) - Base font size (e.g. "16px")
    - `font_weight_heading` (text) - Heading weight
    - `font_weight_body` (text) - Body weight
    - `line_height_body` (text) - Body line height
    - `border_radius` (text) - Default border radius style (sharp/soft/round)
    - `button_style` (text) - Default button style (solid/outline/ghost)
    - `shadow_style` (text) - Default shadow style (none/soft/medium/strong)
    - `social_links` (jsonb) - Social media profile URLs
    - `brand_voice` (text) - Brand voice description
    - `industry` (text) - Business industry
    - `is_active` (boolean) - Whether this kit is currently active
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled with per-user access policies
*/

CREATE TABLE IF NOT EXISTS brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Brand Kit',
  logo_url text DEFAULT '',
  logo_dark_url text DEFAULT '',
  logo_icon_url text DEFAULT '',
  brand_name text DEFAULT '',
  tagline text DEFAULT '',
  primary_color text DEFAULT '#f97316',
  secondary_color text DEFAULT '#0ea5e9',
  accent_color text DEFAULT '#f59e0b',
  success_color text DEFAULT '#22c55e',
  warning_color text DEFAULT '#f59e0b',
  error_color text DEFAULT '#ef4444',
  neutral_dark text DEFAULT '#0f172a',
  neutral_mid text DEFAULT '#64748b',
  neutral_light text DEFAULT '#f1f5f9',
  heading_font text DEFAULT 'Poppins',
  body_font text DEFAULT 'Inter',
  mono_font text DEFAULT 'JetBrains Mono',
  font_size_base text DEFAULT '16px',
  font_weight_heading text DEFAULT '700',
  font_weight_body text DEFAULT '400',
  line_height_body text DEFAULT '1.6',
  border_radius text DEFAULT 'soft',
  button_style text DEFAULT 'solid',
  shadow_style text DEFAULT 'soft',
  social_links jsonb DEFAULT '{"linkedin":"","twitter":"","instagram":"","facebook":"","youtube":"","website":""}'::jsonb,
  brand_voice text DEFAULT '',
  industry text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand kits"
  ON brand_kits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand kits"
  ON brand_kits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand kits"
  ON brand_kits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand kits"
  ON brand_kits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_brand_kits_user_id ON brand_kits(user_id);
