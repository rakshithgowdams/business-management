/*
  # Add updated_at triggers and CHECK constraints

  1. Changes
    - Create a reusable `set_updated_at()` trigger function
    - Add `updated_at` auto-update triggers on all 45 tables that have the column but lack triggers
    - Add CHECK constraints on critical status columns using LOWER() for case-insensitive matching

  2. Tables receiving updated_at triggers (45 tables)
    - agreement_drafts, ai_analyses, ai_business_profiles, brand_kits, cinematic_sessions
    - clients, dm_ad_sets, dm_ads, dm_campaigns, dm_events, dm_keywords, dm_leads, dm_outreach
    - employees, followup_sequences, hr_applications, hr_appraisals, hr_job_postings
    - hr_leave_balances, hr_leave_requests, hr_performance_goals, hr_performance_reviews
    - hr_policies, image_templates, kie_custom_models, onboarding_pipeline_entries
    - onboardings, pipeline_deals, profiles, project_pipeline_entries, scheduled_posts
    - smm_workflows, task_assignments, team_ai_credit_usage, team_ai_settings
    - team_chat_profiles, team_conversations, team_members, team_messages
    - team_typing_indicators, user_api_keys, website_projects, website_sections
    - work_tasks, workflow_templates

  3. Tables receiving CHECK constraints (11 tables)
    - invoices, quotations, projects, clients, employees, hr_leave_requests
    - hr_job_postings, task_assignments, work_tasks, onboardings, subscriptions

  4. Security
    - Trigger function uses SECURITY DEFINER with explicit search_path
    - No data is modified or deleted
*/

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'agreement_drafts','ai_analyses','ai_business_profiles','brand_kits',
    'cinematic_sessions','clients','dm_ad_sets','dm_ads','dm_campaigns',
    'dm_events','dm_keywords','dm_leads','dm_outreach','employees',
    'followup_sequences','hr_applications','hr_appraisals','hr_job_postings',
    'hr_leave_balances','hr_leave_requests','hr_performance_goals',
    'hr_performance_reviews','hr_policies','image_templates','kie_custom_models',
    'onboarding_pipeline_entries','onboardings','pipeline_deals','profiles',
    'project_pipeline_entries','scheduled_posts','smm_workflows',
    'task_assignments','team_ai_credit_usage','team_ai_settings',
    'team_chat_profiles','team_conversations','team_members','team_messages',
    'team_typing_indicators','user_api_keys','website_projects',
    'website_sections','work_tasks','workflow_templates'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND event_object_table = tbl
      AND trigger_name = 'trg_' || tbl || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
        'trg_' || tbl || '_updated_at',
        tbl
      );
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_invoices_status'
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT chk_invoices_status
      CHECK (LOWER(status) IN ('draft','sent','paid','overdue','cancelled','partially_paid'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_quotations_status'
  ) THEN
    ALTER TABLE public.quotations
      ADD CONSTRAINT chk_quotations_status
      CHECK (LOWER(status) IN ('draft','sent','accepted','rejected','expired'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_projects_status'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT chk_projects_status
      CHECK (LOWER(status) IN ('planning','active','on_hold','on hold','completed','cancelled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_clients_status'
  ) THEN
    ALTER TABLE public.clients
      ADD CONSTRAINT chk_clients_status
      CHECK (LOWER(status) IN ('active','inactive','lead','churned'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_employees_status'
  ) THEN
    ALTER TABLE public.employees
      ADD CONSTRAINT chk_employees_status
      CHECK (LOWER(status) IN ('active','inactive','on_leave','on leave','terminated'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_hr_leave_requests_status'
  ) THEN
    ALTER TABLE public.hr_leave_requests
      ADD CONSTRAINT chk_hr_leave_requests_status
      CHECK (LOWER(status) IN ('pending','approved','rejected','cancelled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_hr_job_postings_status'
  ) THEN
    ALTER TABLE public.hr_job_postings
      ADD CONSTRAINT chk_hr_job_postings_status
      CHECK (LOWER(status) IN ('draft','open','closed','filled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_task_assignments_status'
  ) THEN
    ALTER TABLE public.task_assignments
      ADD CONSTRAINT chk_task_assignments_status
      CHECK (LOWER(status) IN ('pending','assigned','in_progress','in progress','completed','cancelled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_work_tasks_status'
  ) THEN
    ALTER TABLE public.work_tasks
      ADD CONSTRAINT chk_work_tasks_status
      CHECK (LOWER(status) IN ('to do','todo','in_progress','in progress','review','done','blocked'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_onboardings_status'
  ) THEN
    ALTER TABLE public.onboardings
      ADD CONSTRAINT chk_onboardings_status
      CHECK (LOWER(status) IN ('pending','in_progress','in progress','completed','cancelled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_subscriptions_status'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT chk_subscriptions_status
      CHECK (LOWER(status) IN ('active','paused','cancelled','expired'));
  END IF;
END $$;
