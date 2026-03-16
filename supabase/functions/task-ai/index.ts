import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const ALLOWED_ORIGINS = ["https://mydesignnexus.com", "https://www.mydesignnexus.com"];

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get("Origin") || "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) return origin;
  return ALLOWED_ORIGINS[0];
}

function getCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
    "Access-Control-Max-Age": "86400",
    ...SECURITY_HEADERS,
  };
}

function jsonResponse(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response(null, { status: 405, headers: getCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(req, { error: "Missing authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse(req, { error: "Invalid or expired token" }, 401);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse(req, { error: "Invalid JSON body" }, 400);
    }

    const { action } = body;

    if (action === "analyze-tasks") {
      return await handleAnalyzeTasks(req, body as { tasks: unknown[]; api_key?: string }, user.id, adminClient);
    }

    if (action === "generate-task-suggestions") {
      return await handleGenerateTaskSuggestions(req, body as { context: string; role: string; department: string; api_key?: string }, user.id, adminClient);
    }

    if (action === "compose-email") {
      return await handleComposeEmail(req, body as { email_type: string; context: string; recipient_name: string; task_title?: string; api_key?: string }, user.id, adminClient);
    }

    if (action === "performance-review") {
      return await handlePerformanceReview(req, body as { employee_name: string; metrics: unknown; api_key?: string }, user.id, adminClient);
    }

    return jsonResponse(req, { error: "Unknown action" }, 400);
  } catch (err) {
    return jsonResponse(req, { error: err instanceof Error ? err.message : "Internal server error" }, 500);
  }
});

async function getApiKey(userId: string, adminClient: ReturnType<typeof createClient>, clientApiKey?: string) {
  if (clientApiKey) return clientApiKey;

  const { data } = await adminClient
    .from("user_api_keys")
    .select("encrypted_key")
    .eq("user_id", userId)
    .eq("provider", "openrouter")
    .maybeSingle();

  if (!data?.encrypted_key) return null;

  const { data: decrypted, error: decErr } = await adminClient.rpc(
    "decrypt_api_key",
    { encrypted_key_value: data.encrypted_key }
  );

  if (decErr || !decrypted) return null;
  return decrypted as string;
}

async function callAIWithTokens(prompt: string, apiKey: string): Promise<{ content: string; tokens_used: number }> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://mydesignnexus.com",
      "X-Title": "MyFinance OS",
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4-6",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API error: ${res.status} - ${text}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content || "";
  const tokens_used = json.usage?.total_tokens || 0;
  return { content, tokens_used };
}

async function handleAnalyzeTasks(
  req: Request,
  body: { tasks: unknown[]; api_key?: string },
  userId: string,
  adminClient: ReturnType<typeof createClient>
) {
  const apiKey = await getApiKey(userId, adminClient, body.api_key);
  if (!apiKey) {
    return jsonResponse(req, { error: "No API key configured. Add one in Settings." }, 400);
  }

  const prompt = `You are an enterprise task management AI analyst. Analyze these tasks and provide insights.

Tasks data: ${JSON.stringify(body.tasks)}

Return a JSON object with:
{
  "risk_tasks": [{"task_title": "", "risk_reason": "", "suggestion": ""}],
  "workload_analysis": {"overloaded_employees": [], "underutilized_employees": [], "balanced_employees": []},
  "priority_recommendations": [{"task_title": "", "current_priority": "", "suggested_priority": "", "reason": ""}],
  "deadline_alerts": [{"task_title": "", "days_remaining": 0, "risk_level": "", "action": ""}],
  "productivity_score": 0,
  "summary": ""
}

Return ONLY valid JSON, no markdown.`;

  const { content: result, tokens_used } = await callAIWithTokens(prompt, apiKey);

  try {
    const parsed = JSON.parse(result);
    return jsonResponse(req, { data: parsed, tokens_used });
  } catch {
    return jsonResponse(req, { data: { summary: result, risk_tasks: [], workload_analysis: {}, priority_recommendations: [], deadline_alerts: [], productivity_score: 0 }, tokens_used });
  }
}

async function handleGenerateTaskSuggestions(
  req: Request,
  body: { context: string; role: string; department: string; api_key?: string },
  userId: string,
  adminClient: ReturnType<typeof createClient>
) {
  const apiKey = await getApiKey(userId, adminClient, body.api_key);
  if (!apiKey) {
    return jsonResponse(req, { error: "No API key configured." }, 400);
  }

  const prompt = `You are an enterprise HR/Management task advisor. Generate task suggestions for:
Role: ${body.role}
Department: ${body.department}
Context: ${body.context}

Return a JSON array of 5 task suggestions:
[{
  "title": "",
  "description": "",
  "category": "HR Task|Manager Task|Employee Task|Company-wide",
  "priority": "Critical|High|Medium|Low",
  "estimated_hours": 0,
  "assigned_to_role": "HR|Manager|Employee",
  "tags": ""
}]

Return ONLY valid JSON array, no markdown.`;

  const { content: result, tokens_used } = await callAIWithTokens(prompt, apiKey);

  try {
    const parsed = JSON.parse(result);
    return jsonResponse(req, { data: parsed, tokens_used });
  } catch {
    return jsonResponse(req, { data: [], tokens_used });
  }
}

async function handleComposeEmail(
  req: Request,
  body: { email_type: string; context: string; recipient_name: string; task_title?: string; api_key?: string },
  userId: string,
  adminClient: ReturnType<typeof createClient>
) {
  const apiKey = await getApiKey(userId, adminClient, body.api_key);
  if (!apiKey) {
    return jsonResponse(req, { error: "No API key configured." }, 400);
  }

  const prompt = `You are a professional business email composer. Write an email for:
Type: ${body.email_type}
Recipient: ${body.recipient_name}
${body.task_title ? `Task: ${body.task_title}` : ""}
Context: ${body.context}

Return a JSON object:
{
  "subject": "",
  "body": ""
}

The body should be professional HTML email content with proper formatting. Use <p>, <strong>, <ul>, <li> tags.
Return ONLY valid JSON, no markdown.`;

  const { content: result, tokens_used } = await callAIWithTokens(prompt, apiKey);

  try {
    const parsed = JSON.parse(result);
    return jsonResponse(req, { data: parsed, tokens_used });
  } catch {
    return jsonResponse(req, { data: { subject: "Task Update", body: result }, tokens_used });
  }
}

async function handlePerformanceReview(
  req: Request,
  body: { employee_name: string; metrics: unknown; api_key?: string },
  userId: string,
  adminClient: ReturnType<typeof createClient>
) {
  const apiKey = await getApiKey(userId, adminClient, body.api_key);
  if (!apiKey) {
    return jsonResponse(req, { error: "No API key configured." }, 400);
  }

  const prompt = `You are an HR performance analyst. Generate a performance review for:
Employee: ${body.employee_name}
Metrics: ${JSON.stringify(body.metrics)}

Return a JSON object:
{
  "overall_rating": "Exceptional|Exceeds Expectations|Meets Expectations|Needs Improvement|Unsatisfactory",
  "strengths": [""],
  "areas_for_improvement": [""],
  "recommendations": [""],
  "summary": "",
  "quality_score": 0
}

quality_score is 0-100.
Return ONLY valid JSON, no markdown.`;

  const { content: result, tokens_used } = await callAIWithTokens(prompt, apiKey);

  try {
    const parsed = JSON.parse(result);
    return jsonResponse(req, { data: parsed, tokens_used });
  } catch {
    return jsonResponse(req, { data: { overall_rating: "Meets Expectations", strengths: [], areas_for_improvement: [], recommendations: [], summary: result, quality_score: 50 }, tokens_used });
  }
}
