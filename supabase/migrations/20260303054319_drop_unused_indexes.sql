/*
  # Drop Unused Indexes

  Removes indexes that have not been used according to pg_stat_user_indexes.
  These indexes consume storage and slow down write operations without providing
  query performance benefits.

  1. Indexes Removed (120+ indexes across all tables)
    - Original indexes from initial schema creation
    - Foreign key indexes added in previous migration that duplicate originals
    - Status, date, category, and other filter indexes with no recorded usage

  2. Important Notes
    - All DROP INDEX statements use IF EXISTS for safety
    - These indexes can be recreated if needed in the future
    - Primary key and unique constraint indexes are NOT affected
    - RLS policies will still function correctly without these indexes
*/

-- expenses
DROP INDEX IF EXISTS idx_expenses_user_id;
DROP INDEX IF EXISTS idx_expenses_date;
DROP INDEX IF EXISTS idx_expenses_category;

-- income
DROP INDEX IF EXISTS idx_income_user_id;
DROP INDEX IF EXISTS idx_income_date;

-- goals
DROP INDEX IF EXISTS idx_goals_user_id;

-- invoices
DROP INDEX IF EXISTS idx_invoices_user_id;
DROP INDEX IF EXISTS idx_invoices_status;

-- quotations
DROP INDEX IF EXISTS idx_quotations_user_id;

-- agreements
DROP INDEX IF EXISTS idx_agreements_user_id;

-- emi_loans
DROP INDEX IF EXISTS idx_emi_loans_user_id;

-- subscriptions
DROP INDEX IF EXISTS idx_subscriptions_user_id;

-- client_interactions
DROP INDEX IF EXISTS idx_client_interactions_user_id;

-- employee_documents
DROP INDEX IF EXISTS idx_emp_documents_employee_id;
DROP INDEX IF EXISTS idx_fk_employee_documents_user_id;

-- projects
DROP INDEX IF EXISTS idx_projects_user_id;

-- project_expenses
DROP INDEX IF EXISTS idx_project_expenses_project_id;
DROP INDEX IF EXISTS idx_project_expenses_user_id;

-- project_team
DROP INDEX IF EXISTS idx_project_team_project_id;
DROP INDEX IF EXISTS idx_fk_project_team_user_id;

-- project_tools
DROP INDEX IF EXISTS idx_project_tools_project_id;
DROP INDEX IF EXISTS idx_fk_project_tools_user_id;

-- clients
DROP INDEX IF EXISTS idx_clients_user_id;
DROP INDEX IF EXISTS idx_clients_status;

-- project_agreements
DROP INDEX IF EXISTS idx_project_agreements_project_id;
DROP INDEX IF EXISTS idx_project_agreements_user_id;
DROP INDEX IF EXISTS idx_fk_project_agreements_team_member_id;

-- employees
DROP INDEX IF EXISTS idx_employees_user_id;
DROP INDEX IF EXISTS idx_employees_status;
DROP INDEX IF EXISTS idx_employees_department;

-- employee_attendance
DROP INDEX IF EXISTS idx_attendance_employee_id;
DROP INDEX IF EXISTS idx_fk_employee_attendance_user_id;

-- employee_payroll
DROP INDEX IF EXISTS idx_payroll_employee_id;
DROP INDEX IF EXISTS idx_fk_employee_payroll_user_id;

-- employee_tasks
DROP INDEX IF EXISTS idx_tasks_employee_id;
DROP INDEX IF EXISTS idx_fk_employee_tasks_project_id;
DROP INDEX IF EXISTS idx_fk_employee_tasks_user_id;

-- onboardings
DROP INDEX IF EXISTS idx_onboardings_user_id;
DROP INDEX IF EXISTS idx_onboardings_status;

-- onboarding_checklist
DROP INDEX IF EXISTS idx_onboarding_checklist_onboarding;
DROP INDEX IF EXISTS idx_fk_onboarding_checklist_user_id;

-- onboarding_documents
DROP INDEX IF EXISTS idx_onboarding_docs_onboarding;
DROP INDEX IF EXISTS idx_fk_onboarding_documents_user_id;

-- onboarding_activities
DROP INDEX IF EXISTS idx_onboarding_activities_onboarding;
DROP INDEX IF EXISTS idx_fk_onboarding_activities_user_id;

-- work_subtasks
DROP INDEX IF EXISTS idx_work_subtasks_task;
DROP INDEX IF EXISTS idx_fk_work_subtasks_user_id;

-- work_tasks
DROP INDEX IF EXISTS idx_work_tasks_user_id;
DROP INDEX IF EXISTS idx_work_tasks_project_id;
DROP INDEX IF EXISTS idx_work_tasks_assigned;
DROP INDEX IF EXISTS idx_work_tasks_status;
DROP INDEX IF EXISTS idx_work_tasks_department;
DROP INDEX IF EXISTS idx_work_tasks_tags;
DROP INDEX IF EXISTS idx_work_tasks_parent;

-- work_time_logs
DROP INDEX IF EXISTS idx_work_time_logs_date;
DROP INDEX IF EXISTS idx_work_time_logs_employee;
DROP INDEX IF EXISTS idx_fk_work_time_logs_user_id;

-- ai_analyses
DROP INDEX IF EXISTS idx_ai_analyses_client_id;
DROP INDEX IF EXISTS idx_ai_analyses_status;
DROP INDEX IF EXISTS idx_ai_analyses_deal_potential;

-- agreement_drafts
DROP INDEX IF EXISTS idx_agreement_drafts_status;

-- media_assets
DROP INDEX IF EXISTS idx_media_assets_type;
DROP INDEX IF EXISTS idx_media_assets_status;

-- scheduled_posts
DROP INDEX IF EXISTS idx_scheduled_posts_status;
DROP INDEX IF EXISTS idx_scheduled_posts_scheduled_at;

-- ai_usage_logs
DROP INDEX IF EXISTS idx_ai_usage_logs_module;
DROP INDEX IF EXISTS idx_ai_usage_logs_created_at;

-- work_task_watchers
DROP INDEX IF EXISTS idx_work_task_watchers_task;
DROP INDEX IF EXISTS idx_fk_work_task_watchers_employee_id;
DROP INDEX IF EXISTS idx_fk_work_task_watchers_user_id;

-- work_task_dependencies
DROP INDEX IF EXISTS idx_work_task_deps_task;
DROP INDEX IF EXISTS idx_work_task_deps_depends;
DROP INDEX IF EXISTS idx_fk_work_task_dependencies_user_id;

-- team_members
DROP INDEX IF EXISTS idx_team_members_owner;
DROP INDEX IF EXISTS idx_team_members_email;
DROP INDEX IF EXISTS idx_team_members_role;

-- task_assignments
DROP INDEX IF EXISTS idx_task_assignments_employee_id;
DROP INDEX IF EXISTS idx_task_assignments_status;
DROP INDEX IF EXISTS idx_task_assignments_priority;
DROP INDEX IF EXISTS idx_task_assignments_due_date;
DROP INDEX IF EXISTS idx_task_assignments_category;
DROP INDEX IF EXISTS idx_fk_task_assignments_parent_task_id;

-- task_alerts
DROP INDEX IF EXISTS idx_task_alerts_is_read;
DROP INDEX IF EXISTS idx_fk_task_alerts_employee_id;
DROP INDEX IF EXISTS idx_fk_task_alerts_task_id;

-- task_email_logs
DROP INDEX IF EXISTS idx_task_email_logs_user_id;
DROP INDEX IF EXISTS idx_fk_task_email_logs_employee_id;
DROP INDEX IF EXISTS idx_fk_task_email_logs_task_id;

-- task_performance_metrics
DROP INDEX IF EXISTS idx_task_performance_metrics_employee_id;
DROP INDEX IF EXISTS idx_fk_task_performance_metrics_user_id;

-- task_comments
DROP INDEX IF EXISTS idx_fk_task_comments_user_id;

-- team_sessions
DROP INDEX IF EXISTS idx_team_sessions_token;
DROP INDEX IF EXISTS idx_team_sessions_member;
DROP INDEX IF EXISTS idx_team_sessions_expires;

-- team_chat_profiles
DROP INDEX IF EXISTS idx_team_chat_profiles_member;

-- team_conversations
DROP INDEX IF EXISTS idx_team_conversations_owner;
DROP INDEX IF EXISTS idx_team_conversations_type;
DROP INDEX IF EXISTS idx_team_conversations_project;
DROP INDEX IF EXISTS idx_fk_team_conversations_created_by;

-- team_conversation_members
DROP INDEX IF EXISTS idx_team_conv_members_conv;
DROP INDEX IF EXISTS idx_team_conv_members_member;

-- team_messages
DROP INDEX IF EXISTS idx_team_messages_conv;
DROP INDEX IF EXISTS idx_team_messages_sender;
DROP INDEX IF EXISTS idx_team_messages_created;
DROP INDEX IF EXISTS idx_team_messages_reply;

-- team_message_approvals
DROP INDEX IF EXISTS idx_team_approvals_owner;
DROP INDEX IF EXISTS idx_team_approvals_requester;
DROP INDEX IF EXISTS idx_team_approvals_target;
DROP INDEX IF EXISTS idx_team_approvals_status;
DROP INDEX IF EXISTS idx_fk_team_message_approvals_reviewed_by;

-- team_typing_indicators
DROP INDEX IF EXISTS idx_fk_team_typing_indicators_member_id;

-- work_task_comments
DROP INDEX IF EXISTS idx_fk_work_task_comments_user_id;

-- followup_history
DROP INDEX IF EXISTS idx_fk_followup_history_user_id;

-- followup_sequences
DROP INDEX IF EXISTS idx_fk_followup_sequences_user_id;

-- agreement_milestones
DROP INDEX IF EXISTS idx_fk_agreement_milestones_agreement_id;

-- ai_characters
DROP INDEX IF EXISTS idx_fk_ai_characters_user_id;

-- budget_limits
DROP INDEX IF EXISTS idx_fk_budget_limits_user_id;

-- cinematic_sessions
DROP INDEX IF EXISTS idx_fk_cinematic_sessions_user_id;

-- emi_payments
DROP INDEX IF EXISTS idx_fk_emi_payments_loan_id;

-- invoice_items
DROP INDEX IF EXISTS idx_fk_invoice_items_invoice_id;

-- kie_custom_models
DROP INDEX IF EXISTS idx_fk_kie_custom_models_user_id;

-- project_time_entries
DROP INDEX IF EXISTS idx_fk_project_time_entries_user_id;

-- quotation_items
DROP INDEX IF EXISTS idx_fk_quotation_items_quotation_id;

-- workflow_templates
DROP INDEX IF EXISTS idx_fk_workflow_templates_user_id;
