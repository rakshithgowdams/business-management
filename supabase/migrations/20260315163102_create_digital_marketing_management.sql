/*
  # Digital Marketing Management System

  ## Overview
  Comprehensive digital marketing management with Meta Ads, Google Ads,
  offline/B2B marketing campaigns, expense tracking, and ROI analytics.

  ## New Tables

  1. `dm_campaigns` - Master campaign records for any channel
     - channel: meta | google | email | offline | b2b_outreach | event | print | other
     - Budget, spend, impressions, clicks, conversions, revenue

  2. `dm_ad_sets` - Meta & Google Ad Sets / Ad Groups
     - Links to campaign, audience targeting, bid strategy, status

  3. `dm_ads` - Individual ad creatives
     - Headline, copy, media URL, CTA, performance metrics per ad

  4. `dm_keywords` - Google Ads keyword tracking
     - Keyword, match type, bid, impressions, clicks, conversions

  5. `dm_expenses` - Granular ad spend / marketing expenses
     - Date-wise spend per campaign, platform, type

  6. `dm_leads` - Lead tracking from marketing campaigns
     - Source campaign, contact info, status, deal value

  7. `dm_events` - Offline events / trade shows / B2B events
     - Date, location, cost, leads generated, notes

  8. `dm_outreach` - B2B outreach records
     - Company, contact, channel, status, follow-up dates

  ## Security
  - RLS enabled on all tables
  - user_id-scoped policies for SELECT, INSERT, UPDATE, DELETE
*/

-- dm_campaigns
CREATE TABLE IF NOT EXISTS dm_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  channel text NOT NULL DEFAULT 'meta',
  objective text NOT NULL DEFAULT 'Awareness',
  status text NOT NULL DEFAULT 'Draft',
  start_date date,
  end_date date,
  budget numeric(14,2) NOT NULL DEFAULT 0,
  spend numeric(14,2) NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  conversions bigint NOT NULL DEFAULT 0,
  revenue numeric(14,2) NOT NULL DEFAULT 0,
  cpc numeric(10,2) NOT NULL DEFAULT 0,
  ctr numeric(6,2) NOT NULL DEFAULT 0,
  roas numeric(8,2) NOT NULL DEFAULT 0,
  target_audience text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dm_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own campaigns" ON dm_campaigns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own campaigns" ON dm_campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own campaigns" ON dm_campaigns FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own campaigns" ON dm_campaigns FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dm_campaigns_user_id ON dm_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_campaigns_channel ON dm_campaigns(channel);

-- dm_ad_sets
CREATE TABLE IF NOT EXISTS dm_ad_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES dm_campaigns(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  platform text NOT NULL DEFAULT 'meta',
  status text NOT NULL DEFAULT 'Draft',
  daily_budget numeric(10,2) NOT NULL DEFAULT 0,
  lifetime_budget numeric(10,2) NOT NULL DEFAULT 0,
  bid_strategy text NOT NULL DEFAULT 'Lowest Cost',
  bid_amount numeric(10,2) NOT NULL DEFAULT 0,
  targeting_age_min int NOT NULL DEFAULT 18,
  targeting_age_max int NOT NULL DEFAULT 65,
  targeting_genders text NOT NULL DEFAULT 'All',
  targeting_locations text NOT NULL DEFAULT '',
  targeting_interests text NOT NULL DEFAULT '',
  targeting_custom_audiences text NOT NULL DEFAULT '',
  spend numeric(12,2) NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  conversions bigint NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dm_ad_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ad_sets" ON dm_ad_sets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ad_sets" ON dm_ad_sets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ad_sets" ON dm_ad_sets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own ad_sets" ON dm_ad_sets FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dm_ad_sets_campaign ON dm_ad_sets(campaign_id);

-- dm_ads
CREATE TABLE IF NOT EXISTS dm_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES dm_campaigns(id) ON DELETE CASCADE,
  ad_set_id uuid REFERENCES dm_ad_sets(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT '',
  platform text NOT NULL DEFAULT 'meta',
  ad_format text NOT NULL DEFAULT 'Single Image',
  status text NOT NULL DEFAULT 'Draft',
  headline text NOT NULL DEFAULT '',
  primary_text text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  cta text NOT NULL DEFAULT 'Learn More',
  destination_url text NOT NULL DEFAULT '',
  media_url text NOT NULL DEFAULT '',
  media_type text NOT NULL DEFAULT 'image',
  spend numeric(12,2) NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  conversions bigint NOT NULL DEFAULT 0,
  ctr numeric(6,2) NOT NULL DEFAULT 0,
  cpc numeric(8,2) NOT NULL DEFAULT 0,
  relevance_score int NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dm_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ads" ON dm_ads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ads" ON dm_ads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ads" ON dm_ads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own ads" ON dm_ads FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dm_ads_campaign ON dm_ads(campaign_id);

-- dm_keywords
CREATE TABLE IF NOT EXISTS dm_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES dm_campaigns(id) ON DELETE CASCADE,
  ad_set_id uuid REFERENCES dm_ad_sets(id) ON DELETE SET NULL,
  keyword text NOT NULL DEFAULT '',
  match_type text NOT NULL DEFAULT 'Broad',
  status text NOT NULL DEFAULT 'Active',
  bid numeric(8,2) NOT NULL DEFAULT 0,
  quality_score int NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  conversions bigint NOT NULL DEFAULT 0,
  cost numeric(10,2) NOT NULL DEFAULT 0,
  avg_position numeric(4,1) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dm_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own keywords" ON dm_keywords FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own keywords" ON dm_keywords FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own keywords" ON dm_keywords FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own keywords" ON dm_keywords FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dm_keywords_campaign ON dm_keywords(campaign_id);

-- dm_expenses
CREATE TABLE IF NOT EXISTS dm_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES dm_campaigns(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  platform text NOT NULL DEFAULT 'meta',
  expense_type text NOT NULL DEFAULT 'Ad Spend',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  description text NOT NULL DEFAULT '',
  invoice_url text NOT NULL DEFAULT '',
  payment_method text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Paid',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dm_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own dm_expenses" ON dm_expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own dm_expenses" ON dm_expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own dm_expenses" ON dm_expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own dm_expenses" ON dm_expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dm_expenses_user ON dm_expenses(user_id, date);

-- dm_leads
CREATE TABLE IF NOT EXISTS dm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES dm_campaigns(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'Meta Ads',
  status text NOT NULL DEFAULT 'New',
  deal_value numeric(14,2) NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  follow_up_date date,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own dm_leads" ON dm_leads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own dm_leads" ON dm_leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own dm_leads" ON dm_leads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own dm_leads" ON dm_leads FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dm_leads_user ON dm_leads(user_id, status);

-- dm_events
CREATE TABLE IF NOT EXISTS dm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  event_type text NOT NULL DEFAULT 'Trade Show',
  status text NOT NULL DEFAULT 'Planned',
  start_date date,
  end_date date,
  location text NOT NULL DEFAULT '',
  organizer text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  stall_cost numeric(12,2) NOT NULL DEFAULT 0,
  travel_cost numeric(12,2) NOT NULL DEFAULT 0,
  material_cost numeric(12,2) NOT NULL DEFAULT 0,
  other_cost numeric(12,2) NOT NULL DEFAULT 0,
  total_cost numeric(14,2) NOT NULL DEFAULT 0,
  leads_generated int NOT NULL DEFAULT 0,
  deals_closed int NOT NULL DEFAULT 0,
  revenue_generated numeric(14,2) NOT NULL DEFAULT 0,
  attendees_count int NOT NULL DEFAULT 0,
  collateral_distributed int NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dm_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own dm_events" ON dm_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own dm_events" ON dm_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own dm_events" ON dm_events FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own dm_events" ON dm_events FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dm_events_user ON dm_events(user_id, start_date);

-- dm_outreach
CREATE TABLE IF NOT EXISTS dm_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES dm_campaigns(id) ON DELETE SET NULL,
  company_name text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  contact_title text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  linkedin_url text NOT NULL DEFAULT '',
  channel text NOT NULL DEFAULT 'Email',
  status text NOT NULL DEFAULT 'Not Contacted',
  outreach_date date,
  follow_up_date date,
  deal_value numeric(14,2) NOT NULL DEFAULT 0,
  industry text NOT NULL DEFAULT '',
  company_size text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  last_response text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dm_outreach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own dm_outreach" ON dm_outreach FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own dm_outreach" ON dm_outreach FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own dm_outreach" ON dm_outreach FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own dm_outreach" ON dm_outreach FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dm_outreach_user ON dm_outreach(user_id, status);
