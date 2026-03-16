/*
  # Add Missing Foreign Key Indexes

  Adds indexes on foreign key columns that were missing covering indexes.
  This improves JOIN performance and prevents sequential scans during
  foreign key constraint checks (especially on DELETE/UPDATE of parent rows).

  1. Tables and Columns Indexed
    - agreement_milestones (agreement_id)
    - ai_characters (user_id)
    - budget_limits (user_id)
    - cinematic_sessions (user_id)
    - emi_payments (loan_id)
    - employee_attendance (user_id)
    - employee_documents (user_id)
    - employee_payroll (user_id)
    - employee_tasks (project_id, user_id)
    - followup_history (user_id)
    - followup_sequences (user_id)
    - invoice_items (invoice_id)
    - kie_custom_models (user_id)
    - onboarding_activities (user_id)
    - onboarding_checklist (user_id)
    - onboarding_documents (user_id)
    - project_agreements (team_member_id)
    - project_team (user_id)
    - project_time_entries (user_id)
    - project_tools (user_id)
    - quotation_items (quotation_id)
    - task_alerts (employee_id, task_id)
    - task_assignments (parent_task_id)
    - task_comments (user_id)
    - task_email_logs (employee_id, task_id)
    - task_performance_metrics (user_id)
    - team_conversations (created_by)
    - team_message_approvals (reviewed_by)
    - team_typing_indicators (team_member_id)
    - work_subtasks (user_id)
    - work_task_comments (user_id)
    - work_task_dependencies (user_id)
    - work_task_watchers (employee_id, user_id)
    - work_time_logs (user_id)
    - workflow_templates (user_id)

  2. Important Notes
    - All indexes use IF NOT EXISTS to avoid errors if index already exists
    - These indexes significantly improve query performance for JOINs and cascading operations
*/

CREATE INDEX IF NOT EXISTS idx_fk_agreement_milestones_agreement_id ON agreement_milestones (agreement_id);
CREATE INDEX IF NOT EXISTS idx_fk_ai_characters_user_id ON ai_characters (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_budget_limits_user_id ON budget_limits (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_cinematic_sessions_user_id ON cinematic_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_emi_payments_loan_id ON emi_payments (loan_id);
CREATE INDEX IF NOT EXISTS idx_fk_employee_attendance_user_id ON employee_attendance (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_employee_documents_user_id ON employee_documents (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_employee_payroll_user_id ON employee_payroll (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_employee_tasks_project_id ON employee_tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_fk_employee_tasks_user_id ON employee_tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_followup_history_user_id ON followup_history (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_followup_sequences_user_id ON followup_sequences (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_invoice_items_invoice_id ON invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_fk_kie_custom_models_user_id ON kie_custom_models (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_onboarding_activities_user_id ON onboarding_activities (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_onboarding_checklist_user_id ON onboarding_checklist (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_onboarding_documents_user_id ON onboarding_documents (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_project_agreements_team_member_id ON project_agreements (team_member_id);
CREATE INDEX IF NOT EXISTS idx_fk_project_team_user_id ON project_team (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_project_time_entries_user_id ON project_time_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_project_tools_user_id ON project_tools (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_quotation_items_quotation_id ON quotation_items (quotation_id);
CREATE INDEX IF NOT EXISTS idx_fk_task_alerts_employee_id ON task_alerts (employee_id);
CREATE INDEX IF NOT EXISTS idx_fk_task_alerts_task_id ON task_alerts (task_id);
CREATE INDEX IF NOT EXISTS idx_fk_task_assignments_parent_task_id ON task_assignments (parent_task_id);
CREATE INDEX IF NOT EXISTS idx_fk_task_comments_user_id ON task_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_task_email_logs_employee_id ON task_email_logs (employee_id);
CREATE INDEX IF NOT EXISTS idx_fk_task_email_logs_task_id ON task_email_logs (task_id);
CREATE INDEX IF NOT EXISTS idx_fk_task_performance_metrics_user_id ON task_performance_metrics (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_team_conversations_created_by ON team_conversations (created_by);
CREATE INDEX IF NOT EXISTS idx_fk_team_message_approvals_reviewed_by ON team_message_approvals (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_fk_team_typing_indicators_member_id ON team_typing_indicators (team_member_id);
CREATE INDEX IF NOT EXISTS idx_fk_work_subtasks_user_id ON work_subtasks (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_work_task_comments_user_id ON work_task_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_work_task_dependencies_user_id ON work_task_dependencies (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_work_task_watchers_employee_id ON work_task_watchers (employee_id);
CREATE INDEX IF NOT EXISTS idx_fk_work_task_watchers_user_id ON work_task_watchers (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_work_time_logs_user_id ON work_time_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_fk_workflow_templates_user_id ON workflow_templates (user_id);
