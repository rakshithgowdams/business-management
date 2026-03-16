/*
  # Optimize RLS Policies - Part 1 (A-I tables)

  Replaces `auth.uid()` with `(select auth.uid())` in all RLS policies.
  This prevents re-evaluation of the auth function for each row, significantly
  improving query performance at scale.

  1. Tables Modified
    - agreement_drafts, agreement_milestones, agreements
    - ai_analyses, ai_business_profiles, ai_characters, ai_usage_logs
    - budget_limits, cinematic_sessions, client_interactions, clients
    - content_plans, emi_loans, emi_payments
    - employee_attendance, employee_documents, employee_payroll, employee_tasks, employees
    - expenses, followup_history, followup_sequences, goals
    - health_score_history, income, invoice_items, invoices

  2. Security
    - No changes to access control logic
    - All policies retain exact same permissions and ownership checks
    - Only optimization: auth.uid() wrapped in (select ...) for plan caching
*/

-- agreement_drafts
DROP POLICY "Users can delete own agreement drafts" ON agreement_drafts;
CREATE POLICY "Users can delete own agreement drafts" ON agreement_drafts FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own agreement drafts" ON agreement_drafts;
CREATE POLICY "Users can insert own agreement drafts" ON agreement_drafts FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own agreement drafts" ON agreement_drafts;
CREATE POLICY "Users can update own agreement drafts" ON agreement_drafts FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own agreement drafts" ON agreement_drafts;
CREATE POLICY "Users can view own agreement drafts" ON agreement_drafts FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- agreement_milestones
DROP POLICY "Users can delete own agreement milestones" ON agreement_milestones;
CREATE POLICY "Users can delete own agreement milestones" ON agreement_milestones FOR DELETE TO authenticated USING (EXISTS ( SELECT 1 FROM agreements WHERE agreements.id = agreement_milestones.agreement_id AND agreements.user_id = (select auth.uid())));
DROP POLICY "Users can insert own agreement milestones" ON agreement_milestones;
CREATE POLICY "Users can insert own agreement milestones" ON agreement_milestones FOR INSERT TO authenticated WITH CHECK (EXISTS ( SELECT 1 FROM agreements WHERE agreements.id = agreement_milestones.agreement_id AND agreements.user_id = (select auth.uid())));
DROP POLICY "Users can update own agreement milestones" ON agreement_milestones;
CREATE POLICY "Users can update own agreement milestones" ON agreement_milestones FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1 FROM agreements WHERE agreements.id = agreement_milestones.agreement_id AND agreements.user_id = (select auth.uid()))) WITH CHECK (EXISTS ( SELECT 1 FROM agreements WHERE agreements.id = agreement_milestones.agreement_id AND agreements.user_id = (select auth.uid())));
DROP POLICY "Users can view own agreement milestones" ON agreement_milestones;
CREATE POLICY "Users can view own agreement milestones" ON agreement_milestones FOR SELECT TO authenticated USING (EXISTS ( SELECT 1 FROM agreements WHERE agreements.id = agreement_milestones.agreement_id AND agreements.user_id = (select auth.uid())));

-- agreements
DROP POLICY "Users can delete own agreements" ON agreements;
CREATE POLICY "Users can delete own agreements" ON agreements FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own agreements" ON agreements;
CREATE POLICY "Users can insert own agreements" ON agreements FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own agreements" ON agreements;
CREATE POLICY "Users can update own agreements" ON agreements FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own agreements" ON agreements;
CREATE POLICY "Users can view own agreements" ON agreements FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- ai_analyses
DROP POLICY "Users can delete own ai_analyses" ON ai_analyses;
CREATE POLICY "Users can delete own ai_analyses" ON ai_analyses FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own ai_analyses" ON ai_analyses;
CREATE POLICY "Users can insert own ai_analyses" ON ai_analyses FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own ai_analyses" ON ai_analyses;
CREATE POLICY "Users can update own ai_analyses" ON ai_analyses FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own ai_analyses" ON ai_analyses;
CREATE POLICY "Users can view own ai_analyses" ON ai_analyses FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- ai_business_profiles
DROP POLICY "Users can delete own ai_business_profiles" ON ai_business_profiles;
CREATE POLICY "Users can delete own ai_business_profiles" ON ai_business_profiles FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own ai_business_profiles" ON ai_business_profiles;
CREATE POLICY "Users can insert own ai_business_profiles" ON ai_business_profiles FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own ai_business_profiles" ON ai_business_profiles;
CREATE POLICY "Users can update own ai_business_profiles" ON ai_business_profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own ai_business_profiles" ON ai_business_profiles;
CREATE POLICY "Users can view own ai_business_profiles" ON ai_business_profiles FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- ai_characters
DROP POLICY "Users can delete own characters" ON ai_characters;
CREATE POLICY "Users can delete own characters" ON ai_characters FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own characters" ON ai_characters;
CREATE POLICY "Users can insert own characters" ON ai_characters FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own characters" ON ai_characters;
CREATE POLICY "Users can update own characters" ON ai_characters FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own characters" ON ai_characters;
CREATE POLICY "Users can view own characters" ON ai_characters FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- ai_usage_logs
DROP POLICY "Users can delete own usage logs" ON ai_usage_logs;
CREATE POLICY "Users can delete own usage logs" ON ai_usage_logs FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own usage logs" ON ai_usage_logs;
CREATE POLICY "Users can insert own usage logs" ON ai_usage_logs FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own usage logs" ON ai_usage_logs;
CREATE POLICY "Users can view own usage logs" ON ai_usage_logs FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- budget_limits
DROP POLICY "Users can delete own budget limits" ON budget_limits;
CREATE POLICY "Users can delete own budget limits" ON budget_limits FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own budget limits" ON budget_limits;
CREATE POLICY "Users can insert own budget limits" ON budget_limits FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own budget limits" ON budget_limits;
CREATE POLICY "Users can update own budget limits" ON budget_limits FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own budget limits" ON budget_limits;
CREATE POLICY "Users can view own budget limits" ON budget_limits FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- cinematic_sessions
DROP POLICY "Users can delete own cinematic sessions" ON cinematic_sessions;
CREATE POLICY "Users can delete own cinematic sessions" ON cinematic_sessions FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own cinematic sessions" ON cinematic_sessions;
CREATE POLICY "Users can insert own cinematic sessions" ON cinematic_sessions FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own cinematic sessions" ON cinematic_sessions;
CREATE POLICY "Users can update own cinematic sessions" ON cinematic_sessions FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own cinematic sessions" ON cinematic_sessions;
CREATE POLICY "Users can view own cinematic sessions" ON cinematic_sessions FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- client_interactions
DROP POLICY "Users can delete own client interactions" ON client_interactions;
CREATE POLICY "Users can delete own client interactions" ON client_interactions FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own client interactions" ON client_interactions;
CREATE POLICY "Users can insert own client interactions" ON client_interactions FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own client interactions" ON client_interactions;
CREATE POLICY "Users can update own client interactions" ON client_interactions FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own client interactions" ON client_interactions;
CREATE POLICY "Users can view own client interactions" ON client_interactions FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- clients
DROP POLICY "Users can delete own clients" ON clients;
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own clients" ON clients;
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own clients" ON clients;
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own clients" ON clients;
CREATE POLICY "Users can view own clients" ON clients FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- content_plans
DROP POLICY "Users can delete own content plans" ON content_plans;
CREATE POLICY "Users can delete own content plans" ON content_plans FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own content plans" ON content_plans;
CREATE POLICY "Users can insert own content plans" ON content_plans FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own content plans" ON content_plans;
CREATE POLICY "Users can update own content plans" ON content_plans FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own content plans" ON content_plans;
CREATE POLICY "Users can view own content plans" ON content_plans FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- emi_loans
DROP POLICY "Users can delete own emi loans" ON emi_loans;
CREATE POLICY "Users can delete own emi loans" ON emi_loans FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own emi loans" ON emi_loans;
CREATE POLICY "Users can insert own emi loans" ON emi_loans FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own emi loans" ON emi_loans;
CREATE POLICY "Users can update own emi loans" ON emi_loans FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own emi loans" ON emi_loans;
CREATE POLICY "Users can view own emi loans" ON emi_loans FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- emi_payments
DROP POLICY "Users can delete own emi payments" ON emi_payments;
CREATE POLICY "Users can delete own emi payments" ON emi_payments FOR DELETE TO authenticated USING (EXISTS ( SELECT 1 FROM emi_loans WHERE emi_loans.id = emi_payments.loan_id AND emi_loans.user_id = (select auth.uid())));
DROP POLICY "Users can insert own emi payments" ON emi_payments;
CREATE POLICY "Users can insert own emi payments" ON emi_payments FOR INSERT TO authenticated WITH CHECK (EXISTS ( SELECT 1 FROM emi_loans WHERE emi_loans.id = emi_payments.loan_id AND emi_loans.user_id = (select auth.uid())));
DROP POLICY "Users can view own emi payments" ON emi_payments;
CREATE POLICY "Users can view own emi payments" ON emi_payments FOR SELECT TO authenticated USING (EXISTS ( SELECT 1 FROM emi_loans WHERE emi_loans.id = emi_payments.loan_id AND emi_loans.user_id = (select auth.uid())));

-- employee_attendance
DROP POLICY "Users can delete own attendance" ON employee_attendance;
CREATE POLICY "Users can delete own attendance" ON employee_attendance FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own attendance" ON employee_attendance;
CREATE POLICY "Users can insert own attendance" ON employee_attendance FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own attendance" ON employee_attendance;
CREATE POLICY "Users can update own attendance" ON employee_attendance FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own attendance" ON employee_attendance;
CREATE POLICY "Users can view own attendance" ON employee_attendance FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- employee_documents
DROP POLICY "Users can delete own employee documents" ON employee_documents;
CREATE POLICY "Users can delete own employee documents" ON employee_documents FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own employee documents" ON employee_documents;
CREATE POLICY "Users can insert own employee documents" ON employee_documents FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own employee documents" ON employee_documents;
CREATE POLICY "Users can update own employee documents" ON employee_documents FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own employee documents" ON employee_documents;
CREATE POLICY "Users can view own employee documents" ON employee_documents FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- employee_payroll
DROP POLICY "Users can delete own payroll" ON employee_payroll;
CREATE POLICY "Users can delete own payroll" ON employee_payroll FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own payroll" ON employee_payroll;
CREATE POLICY "Users can insert own payroll" ON employee_payroll FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own payroll" ON employee_payroll;
CREATE POLICY "Users can update own payroll" ON employee_payroll FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own payroll" ON employee_payroll;
CREATE POLICY "Users can view own payroll" ON employee_payroll FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- employee_tasks
DROP POLICY "Users can delete own tasks" ON employee_tasks;
CREATE POLICY "Users can delete own tasks" ON employee_tasks FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own tasks" ON employee_tasks;
CREATE POLICY "Users can insert own tasks" ON employee_tasks FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own tasks" ON employee_tasks;
CREATE POLICY "Users can update own tasks" ON employee_tasks FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own tasks" ON employee_tasks;
CREATE POLICY "Users can view own tasks" ON employee_tasks FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- employees
DROP POLICY "Users can delete own employees" ON employees;
CREATE POLICY "Users can delete own employees" ON employees FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own employees" ON employees;
CREATE POLICY "Users can insert own employees" ON employees FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own employees" ON employees;
CREATE POLICY "Users can update own employees" ON employees FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own employees" ON employees;
CREATE POLICY "Users can view own employees" ON employees FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- expenses
DROP POLICY "Users can delete own expenses" ON expenses;
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own expenses" ON expenses;
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own expenses" ON expenses;
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own expenses" ON expenses;
CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- followup_history
DROP POLICY "Users can delete own follow-up history" ON followup_history;
CREATE POLICY "Users can delete own follow-up history" ON followup_history FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own follow-up history" ON followup_history;
CREATE POLICY "Users can insert own follow-up history" ON followup_history FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own follow-up history" ON followup_history;
CREATE POLICY "Users can update own follow-up history" ON followup_history FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own follow-up history" ON followup_history;
CREATE POLICY "Users can view own follow-up history" ON followup_history FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- followup_sequences
DROP POLICY "Users can delete own sequences" ON followup_sequences;
CREATE POLICY "Users can delete own sequences" ON followup_sequences FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own sequences" ON followup_sequences;
CREATE POLICY "Users can insert own sequences" ON followup_sequences FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own sequences" ON followup_sequences;
CREATE POLICY "Users can update own sequences" ON followup_sequences FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own sequences" ON followup_sequences;
CREATE POLICY "Users can view own sequences" ON followup_sequences FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- goals
DROP POLICY "Users can delete own goals" ON goals;
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own goals" ON goals;
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own goals" ON goals;
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own goals" ON goals;
CREATE POLICY "Users can view own goals" ON goals FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- health_score_history
DROP POLICY "Users can delete own health score history" ON health_score_history;
CREATE POLICY "Users can delete own health score history" ON health_score_history FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own health score history" ON health_score_history;
CREATE POLICY "Users can insert own health score history" ON health_score_history FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can read own health score history" ON health_score_history;
CREATE POLICY "Users can read own health score history" ON health_score_history FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can update own health score history" ON health_score_history;
CREATE POLICY "Users can update own health score history" ON health_score_history FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- income
DROP POLICY "Users can delete own income" ON income;
CREATE POLICY "Users can delete own income" ON income FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own income" ON income;
CREATE POLICY "Users can insert own income" ON income FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own income" ON income;
CREATE POLICY "Users can update own income" ON income FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own income" ON income;
CREATE POLICY "Users can view own income" ON income FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- invoice_items
DROP POLICY "Users can delete own invoice items" ON invoice_items;
CREATE POLICY "Users can delete own invoice items" ON invoice_items FOR DELETE TO authenticated USING (EXISTS ( SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = (select auth.uid())));
DROP POLICY "Users can insert own invoice items" ON invoice_items;
CREATE POLICY "Users can insert own invoice items" ON invoice_items FOR INSERT TO authenticated WITH CHECK (EXISTS ( SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = (select auth.uid())));
DROP POLICY "Users can update own invoice items" ON invoice_items;
CREATE POLICY "Users can update own invoice items" ON invoice_items FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = (select auth.uid()))) WITH CHECK (EXISTS ( SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = (select auth.uid())));
DROP POLICY "Users can view own invoice items" ON invoice_items;
CREATE POLICY "Users can view own invoice items" ON invoice_items FOR SELECT TO authenticated USING (EXISTS ( SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = (select auth.uid())));

-- invoices
DROP POLICY "Users can delete own invoices" ON invoices;
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own invoices" ON invoices;
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own invoices" ON invoices;
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own invoices" ON invoices;
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
