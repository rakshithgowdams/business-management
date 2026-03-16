import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

const ALLOWED_ORIGINS = [
  "https://mydesignnexus.com",
  "https://www.mydesignnexus.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

const MAX_BODY_SIZE = 512 * 1024;

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Team-Token",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    ...SECURITY_HEADERS,
  };
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const REASONING_MODELS = new Set(["openai/o3", "openai/o3-mini", "openai/o4-mini", "openai/gpt-5", "openai/gpt-5-mini"]);
const TOKENS_PER_CREDIT = 10000;

const MODEL_MAP: Record<string, string> = {
  claude: "anthropic/claude-sonnet-4-6",
  gpt4o: "openai/gpt-4o",
  gpt5: "openai/gpt-5",
  o3: "openai/o3",
  geminiFlash: "google/gemini-2.5-flash",
  geminiPro: "google/gemini-2.5-pro",
  sonarPro: "perplexity/sonar-pro",
  sonarDeepResearch: "perplexity/sonar-deep-research",
  sonar: "perplexity/sonar",
  llama: "meta-llama/llama-3.3-70b-instruct",
  mistral: "mistralai/mistral-large-2512",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(null, { status: 405, headers: getCorsHeaders(req) });
  }

  const contentLength = parseInt(req.headers.get("Content-Length") || "0", 10);
  if (contentLength > MAX_BODY_SIZE) {
    return new Response(JSON.stringify({ error: "Request body too large" }), {
      status: 413,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const teamToken = req.headers.get("X-Team-Token");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (teamToken) {
      return await handleTeamMemberRequest(req, teamToken, supabaseUrl, supabaseServiceKey);
    }

    if (!authHeader) {
      return jsonResponse(req, { error: "Missing authorization header" }, 401);
    }

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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "save-key") {
      return await handleSaveKey(req, user.id, supabaseUrl, supabaseServiceKey);
    }
    if (action === "test-connection") {
      return await handleTestConnection(req, user.id, supabaseUrl, supabaseServiceKey);
    }
    if (action === "get-key-info") {
      return await handleGetKeyInfo(req, user.id, supabaseUrl, supabaseServiceKey);
    }
    if (action === "delete-key") {
      return await handleDeleteKey(req, user.id, supabaseUrl, supabaseServiceKey);
    }
    if (action === "test-kie") {
      return await handleTestKie(req);
    }
    if (action === "test-elevenlabs") {
      return await handleTestElevenLabs(req);
    }
    if (action === "test-meta") {
      return await handleTestMeta(req);
    }

    return await handleAICall(req, user.id, supabaseUrl, supabaseServiceKey);
  } catch (err) {
    return jsonResponse(req, { error: (err as Error).message }, 500);
  }
});

async function handleTeamMemberRequest(
  req: Request,
  teamToken: string,
  supabaseUrl: string,
  serviceKey: string,
) {
  const adminClient = createClient(supabaseUrl, serviceKey);

  const { data: session } = await adminClient
    .from("team_sessions")
    .select("id, team_member_id, expires_at")
    .eq("session_token", teamToken)
    .maybeSingle();

  if (!session) {
    return jsonResponse(req, { error: "Invalid team session" }, 401);
  }

  if (new Date(session.expires_at) < new Date()) {
    return jsonResponse(req, { error: "Team session expired" }, 401);
  }

  const { data: member } = await adminClient
    .from("team_members")
    .select("id, owner_id, full_name, is_active")
    .eq("id", session.team_member_id)
    .maybeSingle();

  if (!member || !member.is_active) {
    return jsonResponse(req, { error: "Account disabled" }, 403);
  }

  const { data: aiSettings } = await adminClient
    .from("team_ai_settings")
    .select("ai_enabled, daily_credit_limit, assigned_model")
    .eq("team_member_id", member.id)
    .maybeSingle();

  if (!aiSettings || !aiSettings.ai_enabled) {
    return jsonResponse(req, {
      data: null,
      error: "AI access is disabled for your account. Contact your administrator.",
      tokens_used: 0,
    });
  }

  const today = new Date().toISOString().split("T")[0];
  const { data: usageToday } = await adminClient
    .from("team_ai_credit_usage")
    .select("credits_used, tokens_used, call_count")
    .eq("team_member_id", member.id)
    .eq("usage_date", today)
    .maybeSingle();

  const creditsUsedToday = usageToday?.credits_used || 0;

  if (creditsUsedToday >= aiSettings.daily_credit_limit) {
    return jsonResponse(req, {
      data: null,
      error: `Daily credit limit reached (${aiSettings.daily_credit_limit} credits). Your limit resets tomorrow.`,
      tokens_used: 0,
      credits_remaining: 0,
      daily_limit: aiSettings.daily_credit_limit,
    });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "get-team-ai-status") {
    return jsonResponse(req, {
      ai_enabled: aiSettings.ai_enabled,
      daily_limit: aiSettings.daily_credit_limit,
      credits_used: creditsUsedToday,
      credits_remaining: Math.max(0, aiSettings.daily_credit_limit - creditsUsedToday),
      assigned_model: aiSettings.assigned_model || "",
    });
  }

  if (action === "chat-sessions") {
    return await handleChatSessions(req, adminClient, member.id);
  }

  if (action === "chat-messages") {
    const body = await req.json();
    return await handleChatMessages(req, adminClient, member.id, body.session_id);
  }

  if (action === "chat-create-session") {
    const body = await req.json();
    return await handleCreateSession(req, adminClient, member.id, member.owner_id, body.title);
  }

  if (action === "chat-save-message") {
    const body = await req.json();
    return await handleSaveChatMessage(req, adminClient, body.session_id, body.role, body.content, body.tokens_used || 0, body.model_used || "");
  }

  if (action === "chat-delete-session") {
    const body = await req.json();
    return await handleDeleteSession(req, adminClient, member.id, body.session_id);
  }

  const {
    prompt,
    max_tokens = 16000,
    temperature = 0.7,
    model,
    api_key: clientApiKey,
    chat_mode,
    conversation_history,
    session_id: chatSessionId,
  } = await req.json();

  if (!prompt) {
    return jsonResponse(req, {
      data: null,
      error: "No prompt provided",
      tokens_used: 0,
    }, 400);
  }

  let apiKey: string | null = clientApiKey || null;
  if (!apiKey) {
    apiKey = await getDecryptedKey(member.owner_id, supabaseUrl, serviceKey);
  }
  if (!apiKey) {
    apiKey = Deno.env.get("OPENROUTER_API_KEY") || null;
  }
  if (!apiKey) {
    return jsonResponse(req, {
      data: null,
      error: "AI is not configured. Ask your administrator to add an API key.",
      tokens_used: 0,
    });
  }

  let modelId: string;
  if (aiSettings.assigned_model && MODEL_MAP[aiSettings.assigned_model]) {
    modelId = MODEL_MAP[aiSettings.assigned_model];
  } else if (model) {
    modelId = model;
  } else {
    modelId = "anthropic/claude-sonnet-4-6";
  }

  let messages: { role: string; content: string }[];
  if (chat_mode && conversation_history) {
    messages = conversation_history;
  } else {
    messages = [{ role: "user", content: prompt }];
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://mydesignnexus.com",
      "X-Title": "MyFinance OS",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      ...(REASONING_MODELS.has(modelId)
        ? { max_completion_tokens: max_tokens }
        : { max_tokens }),
      temperature,
    }),
  });

  if (res.status === 401) {
    return jsonResponse(req, {
      data: null,
      error: "AI service authentication failed. Contact your administrator.",
      tokens_used: 0,
    });
  }

  if (res.status === 429) {
    return jsonResponse(req, {
      data: null,
      error: "Rate limited. Please wait a moment and try again.",
      tokens_used: 0,
    });
  }

  if (!res.ok) {
    const errBody = await res.text();
    return jsonResponse(req, {
      data: null,
      error: `AI service error (${res.status}): ${errBody}`,
      tokens_used: 0,
    });
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content || "";
  const tokensUsed = json.usage?.total_tokens || 0;
  const finishReason = json.choices?.[0]?.finish_reason || "";
  const creditsConsumed = Math.max(1, Math.ceil(tokensUsed / TOKENS_PER_CREDIT));

  const newCreditsUsed = creditsUsedToday + creditsConsumed;
  const newTokensUsed = (usageToday?.tokens_used || 0) + tokensUsed;
  const newCallCount = (usageToday?.call_count || 0) + 1;

  if (usageToday) {
    await adminClient
      .from("team_ai_credit_usage")
      .update({
        credits_used: newCreditsUsed,
        tokens_used: newTokensUsed,
        call_count: newCallCount,
        updated_at: new Date().toISOString(),
      })
      .eq("team_member_id", member.id)
      .eq("usage_date", today);
  } else {
    await adminClient.from("team_ai_credit_usage").insert({
      team_member_id: member.id,
      owner_id: member.owner_id,
      usage_date: today,
      credits_used: creditsConsumed,
      tokens_used: tokensUsed,
      call_count: 1,
    });
  }

  const creditsRemaining = Math.max(0, aiSettings.daily_credit_limit - newCreditsUsed);

  if (chat_mode) {
    if (chatSessionId) {
      await adminClient.from("team_ai_chat_messages").insert({
        session_id: chatSessionId,
        role: "assistant",
        content,
        tokens_used: tokensUsed,
        model_used: modelId,
      });
      await adminClient.from("team_ai_chat_sessions").update({
        message_count: await getSessionMessageCount(adminClient, chatSessionId),
        last_message_at: new Date().toISOString(),
      }).eq("id", chatSessionId);
    }

    return jsonResponse(req, {
      content,
      error: null,
      tokens_used: tokensUsed,
      model_used: modelId,
      credits_used: creditsConsumed,
      credits_remaining: creditsRemaining,
      daily_limit: aiSettings.daily_credit_limit,
    });
  }

  try {
    const cleaned = extractJSON(content);
    const parsed = JSON.parse(cleaned);
    return jsonResponse(req, {
      data: parsed,
      error: null,
      tokens_used: tokensUsed,
      model_used: modelId,
      credits_used: creditsConsumed,
      credits_remaining: creditsRemaining,
      daily_limit: aiSettings.daily_credit_limit,
    });
  } catch {
    const repaired = tryRepairJSON(content);
    if (repaired) {
      return jsonResponse(req, {
        data: repaired,
        error: null,
        tokens_used: tokensUsed,
        model_used: modelId,
        credits_used: creditsConsumed,
        credits_remaining: creditsRemaining,
        daily_limit: aiSettings.daily_credit_limit,
      });
    }

    return jsonResponse(req, {
      data: null,
      error: finishReason === "length"
        ? "Response was truncated due to length. Please try again."
        : null,
      tokens_used: tokensUsed,
      raw_content: content,
      needs_retry: true,
      model_used: modelId,
      credits_used: creditsConsumed,
      credits_remaining: creditsRemaining,
      daily_limit: aiSettings.daily_credit_limit,
    });
  }
}

function jsonResponse(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

async function handleSaveKey(
  req: Request,
  userId: string,
  supabaseUrl: string,
  serviceKey: string
) {
  const { api_key } = await req.json();
  if (!api_key || typeof api_key !== "string" || api_key.trim().length < 10) {
    return jsonResponse(req, { error: "Invalid API key" }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data, error } = await adminClient.rpc("save_user_api_key", {
    p_user_id: userId,
    p_raw_key: api_key.trim(),
    p_provider: "openrouter",
  });

  if (error) return jsonResponse(req, { error: error.message }, 500);
  return jsonResponse(req, data);
}

async function handleGetKeyInfo(
  req: Request,
  userId: string,
  supabaseUrl: string,
  serviceKey: string
) {
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data, error } = await adminClient
    .from("user_api_keys")
    .select("key_hint, provider, updated_at")
    .eq("user_id", userId)
    .eq("provider", "openrouter")
    .maybeSingle();

  if (error) return jsonResponse(req, { error: error.message }, 500);
  return jsonResponse(req, {
    has_key: !!data,
    key_hint: data?.key_hint || "",
    updated_at: data?.updated_at || null,
  });
}

async function handleDeleteKey(
  req: Request,
  userId: string,
  supabaseUrl: string,
  serviceKey: string
) {
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { error } = await adminClient
    .from("user_api_keys")
    .delete()
    .eq("user_id", userId)
    .eq("provider", "openrouter");

  if (error) return jsonResponse(req, { error: error.message }, 500);
  return jsonResponse(req, { success: true });
}

async function handleTestKie(req: Request) {
  const { api_key } = await req.json();
  if (!api_key) return jsonResponse(req, { success: false, error: "No API key provided" });
  try {
    const res = await fetch("https://api.kie.ai/api/v1/chat/credit", {
      method: "GET",
      headers: { "Authorization": `Bearer ${api_key}` },
    });
    if (res.status === 401) return jsonResponse(req, { success: false, error: "Invalid API key" });
    if (!res.ok) return jsonResponse(req, { success: false, error: `API error: ${res.status}` });
    const data = await res.json();
    const credits = typeof data?.data === "number" ? data.data : null;
    return jsonResponse(req, { success: true, credits });
  } catch {
    return jsonResponse(req, { success: false, error: "Network error" });
  }
}

async function handleTestElevenLabs(req: Request) {
  const { api_key } = await req.json();
  if (!api_key) return jsonResponse(req, { success: false, error: "No API key provided" });
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": api_key },
    });
    if (res.status === 401) return jsonResponse(req, { success: false, error: "Invalid API key" });
    if (!res.ok) return jsonResponse(req, { success: false, error: `API error: ${res.status}` });
    return jsonResponse(req, { success: true });
  } catch {
    return jsonResponse(req, { success: false, error: "Network error" });
  }
}

async function handleTestMeta(req: Request) {
  const { api_key } = await req.json();
  if (!api_key) return jsonResponse(req, { success: false, error: "No API key provided" });
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${api_key}`);
    if (res.status === 401 || res.status === 400) return jsonResponse(req, { success: false, error: "Invalid token" });
    if (!res.ok) return jsonResponse(req, { success: false, error: `API error: ${res.status}` });
    return jsonResponse(req, { success: true });
  } catch {
    return jsonResponse(req, { success: false, error: "Network error" });
  }
}

async function handleTestConnection(
  req: Request,
  userId: string,
  supabaseUrl: string,
  serviceKey: string
) {
  const apiKey = await getDecryptedKey(userId, supabaseUrl, serviceKey);
  if (!apiKey) {
    return jsonResponse(req, { success: false, error: "No API key found" });
  }

  try {
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
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
        max_tokens: 10,
      }),
    });

    if (res.status === 401) {
      return jsonResponse(req, { success: false, error: "Invalid API key" });
    }
    if (!res.ok) {
      return jsonResponse(req, { success: false, error: `API error: ${res.status}` });
    }
    return jsonResponse(req, { success: true });
  } catch {
    return jsonResponse(req, { success: false, error: "Network error" });
  }
}

async function handleAICall(
  req: Request,
  userId: string,
  supabaseUrl: string,
  serviceKey: string
) {
  const {
    prompt,
    max_tokens = 16000,
    temperature = 0.7,
    model,
    api_key: clientApiKey,
  } = await req.json();

  if (!prompt) {
    return jsonResponse(req,
      { data: null, error: "No prompt provided", tokens_used: 0 },
      400
    );
  }

  let apiKey: string | null = clientApiKey || null;

  if (!apiKey) {
    apiKey = await getDecryptedKey(userId, supabaseUrl, serviceKey);
  }

  if (!apiKey) {
    apiKey = Deno.env.get("OPENROUTER_API_KEY") || null;
  }

  if (!apiKey) {
    return jsonResponse(req, {
      data: null,
      error: "No OpenRouter API key found. Please add your key in Settings.",
      tokens_used: 0,
    });
  }

  const modelId = model || "anthropic/claude-sonnet-4-6";

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://mydesignnexus.com",
      "X-Title": "MyFinance OS",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: "user", content: prompt }],
      ...(REASONING_MODELS.has(modelId)
        ? { max_completion_tokens: max_tokens }
        : { max_tokens }),
      temperature,
    }),
  });

  if (res.status === 401) {
    return jsonResponse(req, {
      data: null,
      error: "Invalid API key. Please check your OpenRouter key in Settings.",
      tokens_used: 0,
    });
  }

  if (res.status === 429) {
    return jsonResponse(req, {
      data: null,
      error: "Rate limited. Please wait a moment and try again.",
      tokens_used: 0,
    });
  }

  if (!res.ok) {
    const errBody = await res.text();
    return jsonResponse(req, {
      data: null,
      error: `OpenRouter error (${res.status}): ${errBody}`,
      tokens_used: 0,
    });
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content || "";
  const tokensUsed = json.usage?.total_tokens || 0;
  const finishReason = json.choices?.[0]?.finish_reason || "";

  try {
    const cleaned = extractJSON(content);
    const parsed = JSON.parse(cleaned);
    return jsonResponse(req, {
      data: parsed,
      error: null,
      tokens_used: tokensUsed,
      model_used: modelId,
    });
  } catch {
    const repaired = tryRepairJSON(content);
    if (repaired) {
      return jsonResponse(req, {
        data: repaired,
        error: null,
        tokens_used: tokensUsed,
        model_used: modelId,
      });
    }

    return jsonResponse(req, {
      data: null,
      error: finishReason === "length"
        ? "Response was truncated due to length. Please try again."
        : null,
      tokens_used: tokensUsed,
      raw_content: content,
      needs_retry: true,
      model_used: modelId,
    });
  }
}

async function getDecryptedKey(
  userId: string,
  supabaseUrl: string,
  serviceKey: string
): Promise<string | null> {
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data, error } = await adminClient
    .from("user_api_keys")
    .select("encrypted_key")
    .eq("user_id", userId)
    .eq("provider", "openrouter")
    .maybeSingle();

  if (error || !data) return null;

  const { data: decrypted, error: decErr } = await adminClient.rpc(
    "decrypt_api_key",
    { encrypted_key_value: data.encrypted_key }
  );

  if (decErr || !decrypted) return null;
  return decrypted as string;
}

async function handleChatSessions(req: Request, adminClient: ReturnType<typeof createClient>, memberId: string) {
  const { data, error } = await adminClient
    .from("team_ai_chat_sessions")
    .select("id, title, message_count, last_message_at, created_at")
    .eq("team_member_id", memberId)
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (error) return jsonResponse(req, { error: error.message }, 500);
  return jsonResponse(req, { sessions: data || [] });
}

async function handleChatMessages(req: Request, adminClient: ReturnType<typeof createClient>, memberId: string, sessionId: string) {
  if (!sessionId) return jsonResponse(req, { error: "Missing session_id" }, 400);

  const { data: session } = await adminClient
    .from("team_ai_chat_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("team_member_id", memberId)
    .maybeSingle();

  if (!session) return jsonResponse(req, { error: "Session not found" }, 404);

  const { data, error } = await adminClient
    .from("team_ai_chat_messages")
    .select("id, role, content, tokens_used, model_used, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) return jsonResponse(req, { error: error.message }, 500);
  return jsonResponse(req, { messages: data || [] });
}

async function handleCreateSession(req: Request, adminClient: ReturnType<typeof createClient>, memberId: string, ownerId: string, title: string) {
  const { data, error } = await adminClient
    .from("team_ai_chat_sessions")
    .insert({
      team_member_id: memberId,
      owner_id: ownerId,
      title: title || "New Conversation",
    })
    .select("id, title, created_at")
    .single();

  if (error) return jsonResponse(req, { error: error.message }, 500);
  return jsonResponse(req, { session: data });
}

async function handleSaveChatMessage(
  req: Request,
  adminClient: ReturnType<typeof createClient>,
  sessionId: string,
  role: string,
  content: string,
  tokensUsed: number,
  modelUsed: string,
) {
  if (!sessionId || !role || !content) {
    return jsonResponse(req, { error: "Missing required fields" }, 400);
  }

  const { data, error } = await adminClient
    .from("team_ai_chat_messages")
    .insert({ session_id: sessionId, role, content, tokens_used: tokensUsed, model_used: modelUsed })
    .select("id, created_at")
    .single();

  if (error) return jsonResponse(req, { error: error.message }, 500);

  const count = await getSessionMessageCount(adminClient, sessionId);
  await adminClient.from("team_ai_chat_sessions").update({
    message_count: count,
    last_message_at: new Date().toISOString(),
  }).eq("id", sessionId);

  return jsonResponse(req, { message: data });
}

async function handleDeleteSession(req: Request, adminClient: ReturnType<typeof createClient>, memberId: string, sessionId: string) {
  if (!sessionId) return jsonResponse(req, { error: "Missing session_id" }, 400);

  const { error } = await adminClient
    .from("team_ai_chat_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("team_member_id", memberId);

  if (error) return jsonResponse(req, { error: error.message }, 500);
  return jsonResponse(req, { success: true });
}

async function getSessionMessageCount(adminClient: ReturnType<typeof createClient>, sessionId: string): Promise<number> {
  const { count } = await adminClient
    .from("team_ai_chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);
  return count || 0;
}

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1);
  }
  return text;
}

function tryRepairJSON(text: string): unknown | null {
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    let json = fenced ? fenced[1].trim() : text;

    const braceStart = json.indexOf("{");
    if (braceStart === -1) return null;
    json = json.slice(braceStart);

    json = json.replace(/,\s*([}\]])/g, "$1");

    let inString = false;
    let escaped = false;
    let openBraces = 0;
    let openBrackets = 0;
    for (const ch of json) {
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") openBraces++;
      if (ch === "}") openBraces--;
      if (ch === "[") openBrackets++;
      if (ch === "]") openBrackets--;
    }

    if (inString) {
      json += '"';
    }

    const lastValidChar = json.search(/[^"\s\w](?=[^{}[\]",:\s\w]*$)/);
    if (lastValidChar > 0 && openBraces > 0) {
      const tail = json.slice(lastValidChar + 1).trim();
      if (tail && !tail.endsWith('"') && !tail.endsWith('}') && !tail.endsWith(']')) {
        json = json.slice(0, lastValidChar + 1);
      }
    }

    while (openBrackets > 0) { json += "]"; openBrackets--; }
    while (openBraces > 0) { json += "}"; openBraces--; }

    return JSON.parse(json);
  } catch {
    return null;
  }
}
