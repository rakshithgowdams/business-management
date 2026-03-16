/*
  # Optimize RLS Policies - Part 2 (K-Z tables)

  Continues replacing `auth.uid()` with `(select auth.uid())` in RLS policies
  for remaining tables (K through Z alphabetically).

  1. Tables Modified
    - kie_custom_models, media_assets
    - onboarding_activities, onboarding_checklist, onboarding_documents, onboardings
    - profiles, project_agreements, project_expenses, project_team, project_time_entries, project_tools, projects
    - quotation_items, quotations
    - scheduled_posts, smm_workflows, subscriptions
    - task_alerts, task_assignments, task_comments, task_email_logs, task_performance_metrics
    - team_members, user_api_keys
    - work_subtasks, work_task_comments, work_task_dependencies, work_task_watchers, work_tasks, work_time_logs
    - workflow_templates

  2. Security
    - No changes to access control logic
    - All policies retain exact same permissions
    - Performance optimization only
*/

-- kie_custom_models
DROP POLICY "Users can delete own custom models" ON kie_custom_models;
CREATE POLICY "Users can delete own custom models" ON kie_custom_models FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own custom models" ON kie_custom_models;
CREATE POLICY "Users can insert own custom models" ON kie_custom_models FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own custom models" ON kie_custom_models;
CREATE POLICY "Users can update own custom models" ON kie_custom_models FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own custom models" ON kie_custom_models;
CREATE POLICY "Users can view own custom models" ON kie_custom_models FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- media_assets
DROP POLICY "Users can delete own media assets" ON media_assets;
CREATE POLICY "Users can delete own media assets" ON media_assets FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own media assets" ON media_assets;
CREATE POLICY "Users can insert own media assets" ON media_assets FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own media assets" ON media_assets;
CREATE POLICY "Users can update own media assets" ON media_assets FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own media assets" ON media_assets;
CREATE POLICY "Users can view own media assets" ON media_assets FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- onboarding_activities
DROP POLICY "Users can delete own onboarding activities" ON onboarding_activities;
CREATE POLICY "Users can delete own onboarding activities" ON onboarding_activities FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own onboarding activities" ON onboarding_activities;
CREATE POLICY "Users can insert own onboarding activities" ON onboarding_activities FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own onboarding activities" ON onboarding_activities;
CREATE POLICY "Users can update own onboarding activities" ON onboarding_activities FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own onboarding activities" ON onboarding_activities;
CREATE POLICY "Users can view own onboarding activities" ON onboarding_activities FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- onboarding_checklist
DROP POLICY "Users can delete own onboarding checklist" ON onboarding_checklist;
CREATE POLICY "Users can delete own onboarding checklist" ON onboarding_checklist FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own onboarding checklist" ON onboarding_checklist;
CREATE POLICY "Users can insert own onboarding checklist" ON onboarding_checklist FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own onboarding checklist" ON onboarding_checklist;
CREATE POLICY "Users can update own onboarding checklist" ON onboarding_checklist FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own onboarding checklist" ON onboarding_checklist;
CREATE POLICY "Users can view own onboarding checklist" ON onboarding_checklist FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- onboarding_documents
DROP POLICY "Users can delete own onboarding documents" ON onboarding_documents;
CREATE POLICY "Users can delete own onboarding documents" ON onboarding_documents FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own onboarding documents" ON onboarding_documents;
CREATE POLICY "Users can insert own onboarding documents" ON onboarding_documents FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own onboarding documents" ON onboarding_documents;
CREATE POLICY "Users can update own onboarding documents" ON onboarding_documents FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own onboarding documents" ON onboarding_documents;
CREATE POLICY "Users can view own onboarding documents" ON onboarding_documents FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- onboardings
DROP POLICY "Users can delete own onboardings" ON onboardings;
CREATE POLICY "Users can delete own onboardings" ON onboardings FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own onboardings" ON onboardings;
CREATE POLICY "Users can insert own onboardings" ON onboardings FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own onboardings" ON onboardings;
CREATE POLICY "Users can update own onboardings" ON onboardings FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own onboardings" ON onboardings;
CREATE POLICY "Users can view own onboardings" ON onboardings FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- profiles
DROP POLICY "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);
DROP POLICY "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
DROP POLICY "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING ((select auth.uid()) = id);

-- project_agreements
DROP POLICY "Users can delete own project agreements" ON project_agreements;
CREATE POLICY "Users can delete own project agreements" ON project_agreements FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own project agreements" ON project_agreements;
CREATE POLICY "Users can insert own project agreements" ON project_agreements FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own project agreements" ON project_agreements;
CREATE POLICY "Users can update own project agreements" ON project_agreements FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own project agreements" ON project_agreements;
CREATE POLICY "Users can view own project agreements" ON project_agreements FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- project_expenses
DROP POLICY "Users can delete own project expenses" ON project_expenses;
CREATE POLICY "Users can delete own project expenses" ON project_expenses FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own project expenses" ON project_expenses;
CREATE POLICY "Users can insert own project expenses" ON project_expenses FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own project expenses" ON project_expenses;
CREATE POLICY "Users can update own project expenses" ON project_expenses FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own project expenses" ON project_expenses;
CREATE POLICY "Users can view own project expenses" ON project_expenses FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- project_team
DROP POLICY "Users can delete own project team" ON project_team;
CREATE POLICY "Users can delete own project team" ON project_team FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own project team" ON project_team;
CREATE POLICY "Users can insert own project team" ON project_team FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own project team" ON project_team;
CREATE POLICY "Users can update own project team" ON project_team FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own project team" ON project_team;
CREATE POLICY "Users can view own project team" ON project_team FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- project_time_entries
DROP POLICY "Users can delete own project time entries" ON project_time_entries;
CREATE POLICY "Users can delete own project time entries" ON project_time_entries FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own project time entries" ON project_time_entries;
CREATE POLICY "Users can insert own project time entries" ON project_time_entries FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own project time entries" ON project_time_entries;
CREATE POLICY "Users can update own project time entries" ON project_time_entries FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own project time entries" ON project_time_entries;
CREATE POLICY "Users can view own project time entries" ON project_time_entries FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- project_tools
DROP POLICY "Users can delete own project tools" ON project_tools;
CREATE POLICY "Users can delete own project tools" ON project_tools FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own project tools" ON project_tools;
CREATE POLICY "Users can insert own project tools" ON project_tools FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own project tools" ON project_tools;
CREATE POLICY "Users can update own project tools" ON project_tools FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own project tools" ON project_tools;
CREATE POLICY "Users can view own project tools" ON project_tools FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- projects
DROP POLICY "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- quotation_items
DROP POLICY "Users can delete own quotation items" ON quotation_items;
CREATE POLICY "Users can delete own quotation items" ON quotation_items FOR DELETE TO authenticated USING (EXISTS ( SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = (select auth.uid())));
DROP POLICY "Users can insert own quotation items" ON quotation_items;
CREATE POLICY "Users can insert own quotation items" ON quotation_items FOR INSERT TO authenticated WITH CHECK (EXISTS ( SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = (select auth.uid())));
DROP POLICY "Users can update own quotation items" ON quotation_items;
CREATE POLICY "Users can update own quotation items" ON quotation_items FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = (select auth.uid()))) WITH CHECK (EXISTS ( SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = (select auth.uid())));
DROP POLICY "Users can view own quotation items" ON quotation_items;
CREATE POLICY "Users can view own quotation items" ON quotation_items FOR SELECT TO authenticated USING (EXISTS ( SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = (select auth.uid())));

-- quotations
DROP POLICY "Users can delete own quotations" ON quotations;
CREATE POLICY "Users can delete own quotations" ON quotations FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own quotations" ON quotations;
CREATE POLICY "Users can insert own quotations" ON quotations FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own quotations" ON quotations;
CREATE POLICY "Users can update own quotations" ON quotations FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own quotations" ON quotations;
CREATE POLICY "Users can view own quotations" ON quotations FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- scheduled_posts
DROP POLICY "Users can delete own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users can delete own scheduled posts" ON scheduled_posts FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users can insert own scheduled posts" ON scheduled_posts FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users can update own scheduled posts" ON scheduled_posts FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own scheduled posts" ON scheduled_posts;
CREATE POLICY "Users can view own scheduled posts" ON scheduled_posts FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- smm_workflows
DROP POLICY "Users can delete own workflows" ON smm_workflows;
CREATE POLICY "Users can delete own workflows" ON smm_workflows FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own workflows" ON smm_workflows;
CREATE POLICY "Users can insert own workflows" ON smm_workflows FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own workflows" ON smm_workflows;
CREATE POLICY "Users can update own workflows" ON smm_workflows FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own workflows" ON smm_workflows;
CREATE POLICY "Users can view own workflows" ON smm_workflows FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- subscriptions
DROP POLICY "Users can delete own subscriptions" ON subscriptions;
CREATE POLICY "Users can delete own subscriptions" ON subscriptions FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own subscriptions" ON subscriptions;
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- task_alerts
DROP POLICY "Users can delete own alerts" ON task_alerts;
CREATE POLICY "Users can delete own alerts" ON task_alerts FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own alerts" ON task_alerts;
CREATE POLICY "Users can insert own alerts" ON task_alerts FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own alerts" ON task_alerts;
CREATE POLICY "Users can update own alerts" ON task_alerts FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own alerts" ON task_alerts;
CREATE POLICY "Users can view own alerts" ON task_alerts FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- task_assignments
DROP POLICY "Users can delete own task assignments" ON task_assignments;
CREATE POLICY "Users can delete own task assignments" ON task_assignments FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own task assignments" ON task_assignments;
CREATE POLICY "Users can insert own task assignments" ON task_assignments FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own task assignments" ON task_assignments;
CREATE POLICY "Users can update own task assignments" ON task_assignments FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own task assignments" ON task_assignments;
CREATE POLICY "Users can view own task assignments" ON task_assignments FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- task_comments
DROP POLICY "Users can delete own task comments" ON task_comments;
CREATE POLICY "Users can delete own task comments" ON task_comments FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own task comments" ON task_comments;
CREATE POLICY "Users can insert own task comments" ON task_comments FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own task comments" ON task_comments;
CREATE POLICY "Users can update own task comments" ON task_comments FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own task comments" ON task_comments;
CREATE POLICY "Users can view own task comments" ON task_comments FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- task_email_logs
DROP POLICY "Users can delete own email logs" ON task_email_logs;
CREATE POLICY "Users can delete own email logs" ON task_email_logs FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own email logs" ON task_email_logs;
CREATE POLICY "Users can insert own email logs" ON task_email_logs FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own email logs" ON task_email_logs;
CREATE POLICY "Users can update own email logs" ON task_email_logs FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own email logs" ON task_email_logs;
CREATE POLICY "Users can view own email logs" ON task_email_logs FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- task_performance_metrics
DROP POLICY "Users can delete own performance metrics" ON task_performance_metrics;
CREATE POLICY "Users can delete own performance metrics" ON task_performance_metrics FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own performance metrics" ON task_performance_metrics;
CREATE POLICY "Users can insert own performance metrics" ON task_performance_metrics FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own performance metrics" ON task_performance_metrics;
CREATE POLICY "Users can update own performance metrics" ON task_performance_metrics FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own performance metrics" ON task_performance_metrics;
CREATE POLICY "Users can view own performance metrics" ON task_performance_metrics FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- team_members
DROP POLICY "Owners can delete their team members" ON team_members;
CREATE POLICY "Owners can delete their team members" ON team_members FOR DELETE TO authenticated USING ((select auth.uid()) = owner_id);
DROP POLICY "Owners can insert team members" ON team_members;
CREATE POLICY "Owners can insert team members" ON team_members FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = owner_id);
DROP POLICY "Owners can manage their team members" ON team_members;
CREATE POLICY "Owners can manage their team members" ON team_members FOR SELECT TO authenticated USING ((select auth.uid()) = owner_id);
DROP POLICY "Owners can update their team members" ON team_members;
CREATE POLICY "Owners can update their team members" ON team_members FOR UPDATE TO authenticated USING ((select auth.uid()) = owner_id) WITH CHECK ((select auth.uid()) = owner_id);

-- user_api_keys
DROP POLICY "Users can delete own api key" ON user_api_keys;
CREATE POLICY "Users can delete own api key" ON user_api_keys FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own api key" ON user_api_keys;
CREATE POLICY "Users can insert own api key" ON user_api_keys FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own api key" ON user_api_keys;
CREATE POLICY "Users can update own api key" ON user_api_keys FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own api key metadata" ON user_api_keys;
CREATE POLICY "Users can view own api key metadata" ON user_api_keys FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- work_subtasks
DROP POLICY "Users can delete own work subtasks" ON work_subtasks;
CREATE POLICY "Users can delete own work subtasks" ON work_subtasks FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own work subtasks" ON work_subtasks;
CREATE POLICY "Users can insert own work subtasks" ON work_subtasks FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own work subtasks" ON work_subtasks;
CREATE POLICY "Users can update own work subtasks" ON work_subtasks FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own work subtasks" ON work_subtasks;
CREATE POLICY "Users can view own work subtasks" ON work_subtasks FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- work_task_comments
DROP POLICY "Users can delete own work task comments" ON work_task_comments;
CREATE POLICY "Users can delete own work task comments" ON work_task_comments FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own work task comments" ON work_task_comments;
CREATE POLICY "Users can insert own work task comments" ON work_task_comments FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own work task comments" ON work_task_comments;
CREATE POLICY "Users can view own work task comments" ON work_task_comments FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- work_task_dependencies
DROP POLICY "Users can add own task dependencies" ON work_task_dependencies;
CREATE POLICY "Users can add own task dependencies" ON work_task_dependencies FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can remove own task dependencies" ON work_task_dependencies;
CREATE POLICY "Users can remove own task dependencies" ON work_task_dependencies FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can view own task dependencies" ON work_task_dependencies;
CREATE POLICY "Users can view own task dependencies" ON work_task_dependencies FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- work_task_watchers
DROP POLICY "Users can add own task watchers" ON work_task_watchers;
CREATE POLICY "Users can add own task watchers" ON work_task_watchers FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can remove own task watchers" ON work_task_watchers;
CREATE POLICY "Users can remove own task watchers" ON work_task_watchers FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can view own task watchers" ON work_task_watchers;
CREATE POLICY "Users can view own task watchers" ON work_task_watchers FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- work_tasks
DROP POLICY "Users can delete own work tasks" ON work_tasks;
CREATE POLICY "Users can delete own work tasks" ON work_tasks FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own work tasks" ON work_tasks;
CREATE POLICY "Users can insert own work tasks" ON work_tasks FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own work tasks" ON work_tasks;
CREATE POLICY "Users can update own work tasks" ON work_tasks FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own work tasks" ON work_tasks;
CREATE POLICY "Users can view own work tasks" ON work_tasks FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- work_time_logs
DROP POLICY "Users can delete own work time logs" ON work_time_logs;
CREATE POLICY "Users can delete own work time logs" ON work_time_logs FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own work time logs" ON work_time_logs;
CREATE POLICY "Users can insert own work time logs" ON work_time_logs FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own work time logs" ON work_time_logs;
CREATE POLICY "Users can update own work time logs" ON work_time_logs FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own work time logs" ON work_time_logs;
CREATE POLICY "Users can view own work time logs" ON work_time_logs FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- workflow_templates
DROP POLICY "Users can delete own workflows" ON workflow_templates;
CREATE POLICY "Users can delete own workflows" ON workflow_templates FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY "Users can insert own workflows" ON workflow_templates;
CREATE POLICY "Users can insert own workflows" ON workflow_templates FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can update own workflows" ON workflow_templates;
CREATE POLICY "Users can update own workflows" ON workflow_templates FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY "Users can view own workflows" ON workflow_templates;
CREATE POLICY "Users can view own workflows" ON workflow_templates FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
