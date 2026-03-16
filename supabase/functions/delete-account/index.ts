import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const ALLOWED_ORIGINS = [
  "https://mydesignnexus.com",
  "https://www.mydesignnexus.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
    "Vary": "Origin",
  };
}

function jsonRes(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonRes(req, { error: "Method not allowed. Use POST." }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (body.confirm !== true) {
      return jsonRes(req, { error: "Confirmation required. Send { \"confirm\": true } to proceed." }, 400);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonRes(req, { error: "Missing authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonRes(req, { error: "Invalid or expired token" }, 401);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const uid = user.id;
    const errors: string[] = [];

    async function safeDelete(table: string, column: string, value: string) {
      const { error } = await adminClient.from(table).delete().eq(column, value);
      if (error) errors.push(`${table}: ${error.message}`);
    }

    async function safeDeleteViaParent(
      childTable: string,
      childColumn: string,
      parentTable: string,
    ) {
      const { data: parentIds } = await adminClient
        .from(parentTable)
        .select("id")
        .eq("user_id", uid);

      if (parentIds && parentIds.length > 0) {
        const ids = parentIds.map((r: { id: string }) => r.id);
        const { error } = await adminClient.from(childTable).delete().in(childColumn, ids);
        if (error) errors.push(`${childTable}: ${error.message}`);
      }
    }

    await safeDeleteViaParent("invoice_items", "invoice_id", "invoices");
    await safeDeleteViaParent("quotation_items", "quotation_id", "quotations");
    await safeDeleteViaParent("agreement_milestones", "agreement_id", "agreements");
    await safeDeleteViaParent("emi_payments", "loan_id", "emi_loans");

    const userTables = [
      "team_ai_chat_messages",
      "team_ai_chat_sessions",
      "team_ai_credit_usage",
      "team_ai_settings",
      "team_typing_indicators",
      "team_message_approvals",
      "team_conversation_members",
      "team_messages",
      "team_conversations",
      "team_chat_profiles",
      "team_sessions",
      "team_members",
      "user_api_keys",
      "health_score_history",
      "followup_history",
      "followup_sequences",
      "ads_generator_history",
      "kie_custom_models",
      "brand_kits",
      "website_leads",
      "marketing_posts",
      "marketing_campaigns",
      "smm_posts",
      "smm_workflows",
      "pipeline_deal_activities",
      "pipeline_deals",
      "onboarding_pipeline_stage_checklist",
      "onboarding_pipeline_entries",
      "onboarding_pipeline_stages",
      "project_pipeline_milestones",
      "project_pipeline_dependencies",
      "project_pipeline_entries",
      "project_business_teams",
      "business_team_members",
      "business_teams",
      "hr_performance_goals",
      "hr_performance_reviews",
      "hr_appraisals",
      "hr_leave_balances",
      "hr_leave_requests",
      "hr_leave_types",
      "hr_applications",
      "hr_job_postings",
      "hr_policies",
      "dm_leads",
      "dm_expenses",
      "dm_campaigns",
      "audit_logs",
      "image_templates",
      "video_templates",
      "camera_movements",
      "tasks",
      "task_assignments",
      "work_entries",
      "attendance",
      "documents",
      "onboardings",
      "employees",
      "projects",
      "clients",
      "expenses",
      "income",
      "goals",
      "invoices",
      "quotations",
      "agreements",
      "emi_loans",
      "subscriptions",
      "budget_limits",
    ];

    for (const table of userTables) {
      await safeDelete(table, "user_id", uid);
    }

    await safeDelete("profiles", "id", uid);

    const { data: avatarFiles } = await adminClient.storage
      .from("avatars")
      .list(uid);

    if (avatarFiles && avatarFiles.length > 0) {
      const paths = avatarFiles.map((f: { name: string }) => `${uid}/${f.name}`);
      await adminClient.storage.from("avatars").remove(paths);
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(uid);
    if (deleteError) {
      return jsonRes(req, { error: "Failed to delete auth account. Please contact support.", partial_errors: errors }, 500);
    }

    return jsonRes(req, {
      message: "Account deleted successfully",
      ...(errors.length > 0 ? { warnings: `${errors.length} non-critical cleanup operations had issues` } : {}),
    });
  } catch (err) {
    return jsonRes(req, { error: "An unexpected error occurred" }, 500);
  }
});
