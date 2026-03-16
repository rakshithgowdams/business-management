import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const ALLOWED_ORIGINS = [
  "https://mydesignnexus.com",
  "https://www.mydesignnexus.com",
];

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
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
}

function jsonResponse(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

function generateToken(): string {
  const arr = new Uint8Array(48);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const keyA = await crypto.subtle.importKey("raw", enc.encode(a), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const keyB = await crypto.subtle.importKey("raw", enc.encode(b), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const msg = enc.encode("timing-safe-compare");
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign("HMAC", keyA, msg),
    crypto.subtle.sign("HMAC", keyB, msg),
  ]);
  const aBytes = new Uint8Array(sigA);
  const bBytes = new Uint8Array(sigB);
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return `pbkdf2v2:${toHex(salt.buffer)}:${toHex(derived)}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith("pbkdf2v2:") || storedHash.startsWith("pbkdf2:")) {
    const isV2 = storedHash.startsWith("pbkdf2v2:");
    const prefix = isV2 ? "pbkdf2v2:" : "pbkdf2:";
    const rest = storedHash.slice(prefix.length);
    const colonIdx = rest.indexOf(":");
    const saltHex = rest.slice(0, colonIdx);
    const hashHex = rest.slice(colonIdx + 1);
    const salt = fromHex(saltHex);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const iterations = isV2 ? 600000 : 100000;
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      keyMaterial,
      256,
    );
    return await timingSafeEqual(toHex(derived), hashHex);
  }

  if (storedHash.startsWith("$2")) {
    const { compare } = await import("npm:bcrypt@5.1.1");
    return await compare(password, storedHash);
  }

  return false;
}

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;

function checkRateLimit(identifier: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

function sanitizeString(value: unknown, maxLength = 255): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,64}$/.test(email);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse(req, { error: "Invalid JSON body" }, 400);
    }

    const { action } = body;

    if (typeof action !== "string") {
      return jsonResponse(req, { error: "Missing action" }, 400);
    }

    if (action === "create-member") {
      return await handleCreateMember(body, req, adminClient);
    }
    if (action === "update-member") {
      return await handleUpdateMember(body, req, adminClient);
    }
    if (action === "login") {
      return await handleLogin(body, req, adminClient);
    }
    if (action === "validate-session") {
      return await handleValidateSession(body, req, adminClient);
    }
    if (action === "logout") {
      return await handleLogout(body, req, adminClient);
    }
    if (action === "change-password") {
      return await handleChangePassword(body, req, adminClient);
    }

    return jsonResponse(req, { error: "Unknown action" }, 400);
  } catch (err) {
    return jsonResponse(req, {
      error: err instanceof Error ? err.message : "Internal server error",
    }, 500);
  }
});

async function getAuthUser(
  req: Request,
  adminClient: ReturnType<typeof createClient>
) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  return user;
}

async function handleCreateMember(
  body: Record<string, unknown>,
  req: Request,
  adminClient: ReturnType<typeof createClient>
) {
  const user = await getAuthUser(req, adminClient);
  if (!user) return jsonResponse(req, { error: "Not authenticated" }, 401);

  const full_name = sanitizeString(body.full_name, 100);
  const email = sanitizeString(body.email, 254).toLowerCase();
  const password = sanitizeString(body.password, 128);
  const role = sanitizeString(body.role, 20);
  const department = sanitizeString(body.department, 100);
  const job_title = sanitizeString(body.job_title, 100);
  const permissions = Array.isArray(body.permissions)
    ? (body.permissions as unknown[]).filter(p => typeof p === "string").map(p => sanitizeString(p as string, 50)).slice(0, 50)
    : [];

  if (!full_name || !email || !password) {
    return jsonResponse(req, { error: "Name, email, and password are required" }, 400);
  }

  if (!isValidEmail(email)) {
    return jsonResponse(req, { error: "Invalid email format" }, 400);
  }

  if (!["employee", "management"].includes(role)) {
    return jsonResponse(req, { error: "Role must be employee or management" }, 400);
  }

  if (password.length < 8) {
    return jsonResponse(req, { error: "Password must be at least 8 characters" }, 400);
  }

  const passwordHash = await hashPassword(password);

  const { data, error } = await adminClient
    .from("team_members")
    .insert({
      owner_id: user.id,
      full_name,
      email,
      password_hash: passwordHash,
      role,
      department,
      job_title,
      permissions,
    })
    .select("id, full_name, email, role, department, job_title, permissions, is_active, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return jsonResponse(req, { error: "A team member with this email already exists" }, 409);
    }
    return jsonResponse(req, { error: error.message }, 400);
  }

  return jsonResponse(req, { data });
}

async function handleUpdateMember(
  body: Record<string, unknown>,
  req: Request,
  adminClient: ReturnType<typeof createClient>
) {
  const user = await getAuthUser(req, adminClient);
  if (!user) return jsonResponse(req, { error: "Not authenticated" }, 401);

  const member_id = sanitizeString(body.member_id, 36);
  if (!member_id) return jsonResponse(req, { error: "member_id required" }, 400);

  const { data: existing } = await adminClient
    .from("team_members")
    .select("id")
    .eq("id", member_id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!existing) {
    return jsonResponse(req, { error: "Team member not found" }, 404);
  }

  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.full_name !== undefined) dbUpdates.full_name = sanitizeString(body.full_name, 100);
  if (body.email !== undefined) {
    const email = sanitizeString(body.email, 254).toLowerCase();
    if (!isValidEmail(email)) return jsonResponse(req, { error: "Invalid email format" }, 400);
    dbUpdates.email = email;
  }
  if (body.role !== undefined) {
    const role = sanitizeString(body.role, 20);
    if (!["employee", "management"].includes(role)) return jsonResponse(req, { error: "Invalid role" }, 400);
    dbUpdates.role = role;
  }
  if (body.department !== undefined) dbUpdates.department = sanitizeString(body.department, 100);
  if (body.job_title !== undefined) dbUpdates.job_title = sanitizeString(body.job_title, 100);
  if (body.permissions !== undefined && Array.isArray(body.permissions)) {
    dbUpdates.permissions = (body.permissions as unknown[]).filter(p => typeof p === "string").map(p => sanitizeString(p as string, 50)).slice(0, 50);
  }
  if (typeof body.is_active === "boolean") dbUpdates.is_active = body.is_active;

  if (body.password && typeof body.password === "string" && body.password.length >= 8) {
    dbUpdates.password_hash = await hashPassword(sanitizeString(body.password, 128));
  }

  const { data, error } = await adminClient
    .from("team_members")
    .update(dbUpdates)
    .eq("id", member_id)
    .eq("owner_id", user.id)
    .select("id, full_name, email, role, department, job_title, permissions, is_active, updated_at")
    .single();

  if (error) {
    return jsonResponse(req, { error: error.message }, 400);
  }

  return jsonResponse(req, { data });
}

async function handleLogin(
  body: Record<string, unknown>,
  req: Request,
  adminClient: ReturnType<typeof createClient>
) {
  const email = sanitizeString(body.email, 254).toLowerCase();
  const password = sanitizeString(body.password, 128);
  const role = sanitizeString(body.role, 20);

  if (!email || !password || !role) {
    return jsonResponse(req, { error: "Email, password, and role are required" }, 400);
  }

  if (!isValidEmail(email)) {
    return jsonResponse(req, { error: "Invalid credentials" }, 401);
  }

  if (!["employee", "management"].includes(role)) {
    return jsonResponse(req, { error: "Invalid role" }, 400);
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitKey = `login:${email}:${clientIp}`;
  const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey);

  if (!allowed) {
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);
    return new Response(
      JSON.stringify({ error: `Too many login attempts. Try again in ${Math.ceil(retryAfterSec / 60)} minutes.` }),
      {
        status: 429,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
          "Retry-After": String(retryAfterSec),
        },
      }
    );
  }

  const { data: member } = await adminClient
    .from("team_members")
    .select("id, owner_id, full_name, email, password_hash, role, department, job_title, avatar_url, is_active, permissions")
    .eq("email", email)
    .eq("role", role)
    .maybeSingle();

  if (!member) {
    await new Promise(r => setTimeout(r, 200 + Math.random() * 100));
    return jsonResponse(req, { error: "Invalid email or password" }, 401);
  }

  if (!member.is_active) {
    return jsonResponse(req, { error: "Account is disabled. Contact your administrator." }, 403);
  }

  const valid = await verifyPassword(password, member.password_hash);
  if (!valid) {
    return jsonResponse(req, { error: "Invalid email or password" }, 401);
  }

  if (!member.password_hash.startsWith("pbkdf2v2:")) {
    const newHash = await hashPassword(password);
    await adminClient
      .from("team_members")
      .update({ password_hash: newHash })
      .eq("id", member.id);
  }

  await adminClient
    .from("team_sessions")
    .delete()
    .eq("team_member_id", member.id)
    .lt("expires_at", new Date().toISOString());

  const sessionToken = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await adminClient.from("team_sessions").insert({
    team_member_id: member.id,
    session_token: sessionToken,
    expires_at: expiresAt,
  });

  await adminClient
    .from("team_members")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", member.id);

  const { password_hash: _, ...memberData } = member;

  await logAuditEvent(adminClient, member.id, member.owner_id, "login", "team_members", member.id, { role, ip: clientIp });

  return jsonResponse(req, {
    data: {
      session_token: sessionToken,
      expires_at: expiresAt,
      member: memberData,
    },
  });
}

async function handleValidateSession(
  body: Record<string, unknown>,
  req: Request,
  adminClient: ReturnType<typeof createClient>
) {
  const session_token = sanitizeString(body.session_token, 200);
  if (!session_token) {
    return jsonResponse(req, { error: "No session token" }, 401);
  }

  if (!/^[a-f0-9]{96}$/.test(session_token)) {
    return jsonResponse(req, { error: "Invalid session token format" }, 401);
  }

  const { data: session } = await adminClient
    .from("team_sessions")
    .select("id, team_member_id, expires_at")
    .eq("session_token", session_token)
    .maybeSingle();

  if (!session) {
    return jsonResponse(req, { error: "Invalid session" }, 401);
  }

  if (new Date(session.expires_at) < new Date()) {
    await adminClient.from("team_sessions").delete().eq("id", session.id);
    return jsonResponse(req, { error: "Session expired" }, 401);
  }

  const { data: member } = await adminClient
    .from("team_members")
    .select("id, owner_id, full_name, email, role, department, job_title, avatar_url, is_active, permissions")
    .eq("id", session.team_member_id)
    .maybeSingle();

  if (!member || !member.is_active) {
    await adminClient.from("team_sessions").delete().eq("id", session.id);
    return jsonResponse(req, { error: "Account disabled or not found" }, 401);
  }

  return jsonResponse(req, { data: { member, expires_at: session.expires_at } });
}

async function handleLogout(
  body: Record<string, unknown>,
  req: Request,
  adminClient: ReturnType<typeof createClient>
) {
  const session_token = sanitizeString(body.session_token, 200);
  if (session_token && /^[a-f0-9]{96}$/.test(session_token)) {
    await adminClient
      .from("team_sessions")
      .delete()
      .eq("session_token", session_token);
  }
  return jsonResponse(req, { success: true });
}

async function handleChangePassword(
  body: Record<string, unknown>,
  req: Request,
  adminClient: ReturnType<typeof createClient>
) {
  const member_id = sanitizeString(body.member_id, 36);
  const current_password = sanitizeString(body.current_password, 128);
  const new_password = sanitizeString(body.new_password, 128);

  if (!new_password || new_password.length < 8) {
    return jsonResponse(req, { error: "New password must be at least 8 characters" }, 400);
  }

  if (!member_id) {
    return jsonResponse(req, { error: "member_id required" }, 400);
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitKey = `changepw:${member_id}:${clientIp}`;
  const { allowed } = checkRateLimit(rateLimitKey);
  if (!allowed) {
    return jsonResponse(req, { error: "Too many attempts. Please wait and try again." }, 429);
  }

  const { data: member } = await adminClient
    .from("team_members")
    .select("id, owner_id, password_hash")
    .eq("id", member_id)
    .maybeSingle();

  if (!member) {
    return jsonResponse(req, { error: "Member not found" }, 404);
  }

  const valid = await verifyPassword(current_password, member.password_hash);
  if (!valid) {
    return jsonResponse(req, { error: "Current password is incorrect" }, 401);
  }

  const newHash = await hashPassword(new_password);
  await adminClient
    .from("team_members")
    .update({ password_hash: newHash, updated_at: new Date().toISOString() })
    .eq("id", member_id);

  await adminClient.from("team_sessions").delete().eq("team_member_id", member_id);

  await logAuditEvent(adminClient, member_id, member.owner_id, "password_change", "team_members", member_id, { ip: clientIp });

  return jsonResponse(req, { success: true });
}

async function logAuditEvent(
  adminClient: ReturnType<typeof createClient>,
  actorId: string,
  ownerId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    await adminClient.from("audit_logs").insert({
      actor_id: actorId,
      owner_id: ownerId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
    });
  } catch {
    /* non-fatal */
  }
}
