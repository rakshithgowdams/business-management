import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateToken(): string {
  const arr = new Uint8Array(48);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function hashCode(code: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(code),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return `pbkdf2:${toHex(salt.buffer)}:${toHex(derived)}`;
}

async function verifyCode(
  code: string,
  storedHash: string
): Promise<boolean> {
  if (!storedHash.startsWith("pbkdf2:")) return false;
  const rest = storedHash.slice(7);
  const colonIdx = rest.indexOf(":");
  const saltHex = rest.slice(0, colonIdx);
  const hashHex = rest.slice(colonIdx + 1);
  const salt = fromHex(saltHex);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(code),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return toHex(derived) === hashHex;
}

const rateLimitMap = new Map<
  string,
  { count: number; windowStart: number }
>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const window = 15 * 60 * 1000;
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart > window) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    const { action } = body;

    if (action === "login") {
      return await handleLogin(body, req, admin);
    }
    if (action === "validate-session") {
      return await handleValidateSession(body, admin);
    }
    if (action === "logout") {
      return await handleLogout(body, admin);
    }
    if (action === "get-portal-data") {
      return await handleGetPortalData(body, req, admin);
    }
    if (action === "log-activity") {
      return await handleLogActivity(body, req, admin);
    }
    if (action === "create-portal") {
      return await handleCreatePortal(body, req, admin);
    }
    if (action === "regenerate-code") {
      return await handleRegenerateCode(body, req, admin);
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    return jsonResponse(
      {
        error:
          err instanceof Error ? err.message : "Internal server error",
      },
      500
    );
  }
});

async function getAuthUser(
  req: Request,
  admin: ReturnType<typeof createClient>
) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  return user;
}

async function handleCreatePortal(
  body: Record<string, unknown>,
  req: Request,
  admin: ReturnType<typeof createClient>
) {
  const user = await getAuthUser(req, admin);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

  const portalName =
    typeof body.portal_name === "string"
      ? body.portal_name.trim().slice(0, 100)
      : "";
  const clientId =
    typeof body.client_id === "string" ? body.client_id : null;

  if (!portalName) {
    return jsonResponse({ error: "Portal name required" }, 400);
  }

  const slug = portalName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let accessCode = "";
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 12; i++) {
    accessCode += chars[arr[i] % chars.length];
  }

  const codeHash = await hashCode(accessCode);

  const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

  const { data, error } = await admin
    .from("client_portals")
    .insert({
      user_id: user.id,
      client_id: clientId,
      portal_name: portalName,
      portal_slug: uniqueSlug,
      access_code: accessCode,
      access_code_hash: codeHash,
    })
    .select()
    .single();

  if (error) {
    return jsonResponse({ error: error.message }, 400);
  }

  return jsonResponse({ data: { ...data, access_code: accessCode } });
}

async function handleRegenerateCode(
  body: Record<string, unknown>,
  req: Request,
  admin: ReturnType<typeof createClient>
) {
  const user = await getAuthUser(req, admin);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

  const portalId =
    typeof body.portal_id === "string" ? body.portal_id : "";
  if (!portalId)
    return jsonResponse({ error: "portal_id required" }, 400);

  const { data: portal } = await admin
    .from("client_portals")
    .select("id")
    .eq("id", portalId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!portal) return jsonResponse({ error: "Portal not found" }, 404);

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let accessCode = "";
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 12; i++) {
    accessCode += chars[arr[i] % chars.length];
  }

  const codeHash = await hashCode(accessCode);

  await admin
    .from("client_portals")
    .update({
      access_code: accessCode,
      access_code_hash: codeHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", portalId);

  await admin
    .from("portal_sessions")
    .delete()
    .eq("portal_id", portalId);

  return jsonResponse({ access_code: accessCode });
}

async function handleLogin(
  body: Record<string, unknown>,
  req: Request,
  admin: ReturnType<typeof createClient>
) {
  const slug =
    typeof body.slug === "string"
      ? body.slug.trim().toLowerCase()
      : "";
  const code =
    typeof body.access_code === "string"
      ? body.access_code.trim()
      : "";

  if (!slug || !code) {
    return jsonResponse(
      { error: "Portal ID and access code are required" },
      400
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  if (!checkRateLimit(`portal:${slug}:${ip}`)) {
    return jsonResponse(
      { error: "Too many attempts. Try again later." },
      429
    );
  }

  const { data: portal } = await admin
    .from("client_portals")
    .select(
      "id, user_id, portal_name, portal_slug, access_code_hash, is_active, expires_at, branding_logo_url, branding_color, welcome_message, company_description, allowed_sections"
    )
    .eq("portal_slug", slug)
    .maybeSingle();

  if (!portal) {
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 100));
    return jsonResponse({ error: "Invalid portal or access code" }, 401);
  }

  if (!portal.is_active) {
    return jsonResponse(
      { error: "This portal is currently disabled" },
      403
    );
  }

  if (portal.expires_at && new Date(portal.expires_at) < new Date()) {
    return jsonResponse({ error: "This portal access has expired" }, 403);
  }

  const valid = await verifyCode(code, portal.access_code_hash);
  if (!valid) {
    return jsonResponse({ error: "Invalid portal or access code" }, 401);
  }

  const sessionToken = generateToken();
  const expiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString();

  await admin
    .from("portal_sessions")
    .delete()
    .eq("portal_id", portal.id)
    .lt("expires_at", new Date().toISOString());

  await admin.from("portal_sessions").insert({
    portal_id: portal.id,
    session_token: sessionToken,
    expires_at: expiresAt,
  });

  await admin
    .from("client_portals")
    .update({
      last_accessed_at: new Date().toISOString(),
      total_views: (
        await admin
          .from("client_portals")
          .select("total_views")
          .eq("id", portal.id)
          .single()
      ).data?.total_views +
        1 || 1,
    })
    .eq("id", portal.id);

  await admin.from("portal_activity_log").insert({
    portal_id: portal.id,
    action: "login",
    ip_address: ip,
    user_agent: req.headers.get("user-agent") || "",
  });

  const { access_code_hash: _, ...portalData } = portal;

  return jsonResponse({
    data: {
      session_token: sessionToken,
      expires_at: expiresAt,
      portal: portalData,
    },
  });
}

async function handleValidateSession(
  body: Record<string, unknown>,
  admin: ReturnType<typeof createClient>
) {
  const token =
    typeof body.session_token === "string" ? body.session_token : "";
  if (!token || !/^[a-f0-9]{96}$/.test(token)) {
    return jsonResponse({ error: "Invalid session" }, 401);
  }

  const { data: session } = await admin
    .from("portal_sessions")
    .select("id, portal_id, expires_at")
    .eq("session_token", token)
    .maybeSingle();

  if (!session) return jsonResponse({ error: "Invalid session" }, 401);

  if (new Date(session.expires_at) < new Date()) {
    await admin.from("portal_sessions").delete().eq("id", session.id);
    return jsonResponse({ error: "Session expired" }, 401);
  }

  const { data: portal } = await admin
    .from("client_portals")
    .select(
      "id, user_id, portal_name, portal_slug, is_active, branding_logo_url, branding_color, welcome_message, company_description, allowed_sections"
    )
    .eq("id", session.portal_id)
    .maybeSingle();

  if (!portal || !portal.is_active) {
    await admin.from("portal_sessions").delete().eq("id", session.id);
    return jsonResponse({ error: "Portal disabled" }, 401);
  }

  return jsonResponse({
    data: { portal, expires_at: session.expires_at },
  });
}

async function handleLogout(
  body: Record<string, unknown>,
  admin: ReturnType<typeof createClient>
) {
  const token =
    typeof body.session_token === "string" ? body.session_token : "";
  if (token && /^[a-f0-9]{96}$/.test(token)) {
    await admin
      .from("portal_sessions")
      .delete()
      .eq("session_token", token);
  }
  return jsonResponse({ success: true });
}

async function handleGetPortalData(
  body: Record<string, unknown>,
  req: Request,
  admin: ReturnType<typeof createClient>
) {
  const token =
    typeof body.session_token === "string" ? body.session_token : "";
  if (!token || !/^[a-f0-9]{96}$/.test(token)) {
    return jsonResponse({ error: "Invalid session" }, 401);
  }

  const { data: session } = await admin
    .from("portal_sessions")
    .select("portal_id, expires_at")
    .eq("session_token", token)
    .maybeSingle();

  if (!session || new Date(session.expires_at) < new Date()) {
    return jsonResponse({ error: "Session expired" }, 401);
  }

  const portalId = session.portal_id;

  const { data: portal } = await admin
    .from("client_portals")
    .select(
      "id, user_id, portal_name, branding_logo_url, branding_color, welcome_message, company_description, allowed_sections"
    )
    .eq("id", portalId)
    .maybeSingle();

  if (!portal) return jsonResponse({ error: "Portal not found" }, 404);

  const sections = (portal.allowed_sections || {}) as Record<
    string,
    boolean
  >;

  const [
    caseStudiesRes,
    portfolioRes,
    testimonialsRes,
    servicesRes,
    teamRes,
    documentsRes,
    sharedProjectsRes,
  ] = await Promise.all([
    sections.case_studies
      ? admin
          .from("portal_case_studies")
          .select("*")
          .eq("portal_id", portalId)
          .eq("is_visible", true)
          .order("sort_order")
      : Promise.resolve({ data: [] }),
    sections.portfolio
      ? admin
          .from("portal_portfolio_items")
          .select("*")
          .eq("portal_id", portalId)
          .eq("is_visible", true)
          .order("sort_order")
      : Promise.resolve({ data: [] }),
    sections.testimonials
      ? admin
          .from("portal_testimonials")
          .select("*")
          .eq("portal_id", portalId)
          .eq("is_visible", true)
          .order("sort_order")
      : Promise.resolve({ data: [] }),
    sections.services
      ? admin
          .from("portal_services")
          .select("*")
          .eq("portal_id", portalId)
          .eq("is_visible", true)
          .order("sort_order")
      : Promise.resolve({ data: [] }),
    sections.team
      ? admin
          .from("portal_team_showcase")
          .select("*")
          .eq("portal_id", portalId)
          .eq("is_visible", true)
          .order("sort_order")
      : Promise.resolve({ data: [] }),
    sections.documents
      ? admin
          .from("portal_shared_documents")
          .select("*")
          .eq("portal_id", portalId)
          .eq("is_visible", true)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    sections.project_progress
      ? admin
          .from("portal_shared_projects")
          .select("*, projects(id, name, status, budget, start_date, end_date, description)")
          .eq("portal_id", portalId)
          .eq("is_visible", true)
      : Promise.resolve({ data: [] }),
  ]);

  const { data: ownerProfile } = await admin
    .from("profiles")
    .select("full_name, business_name, avatar_url")
    .eq("id", portal.user_id)
    .maybeSingle();

  const section =
    typeof body.section === "string" ? body.section : "";
  if (section) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    await admin.from("portal_activity_log").insert({
      portal_id: portalId,
      action: `view_${section}`,
      ip_address: ip,
      user_agent: req.headers.get("user-agent") || "",
    });
  }

  return jsonResponse({
    data: {
      portal: {
        name: portal.portal_name,
        logo: portal.branding_logo_url,
        color: portal.branding_color,
        welcome: portal.welcome_message,
        description: portal.company_description,
        sections: portal.allowed_sections,
      },
      owner: ownerProfile || {},
      case_studies: caseStudiesRes.data || [],
      portfolio: portfolioRes.data || [],
      testimonials: testimonialsRes.data || [],
      services: servicesRes.data || [],
      team: teamRes.data || [],
      documents: documentsRes.data || [],
      shared_projects: sharedProjectsRes.data || [],
    },
  });
}
