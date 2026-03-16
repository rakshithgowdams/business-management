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
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Team-Token",
    "Access-Control-Max-Age": "86400",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
}

function makeResponder(req: Request) {
  return function respond(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  };
}

const TOKEN_REGEX = /^[a-f0-9]{96}$/;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "video/mp4", "video/webm", "video/ogg",
  "audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/mp4",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv",
]);

const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "svg",
  "mp4", "webm", "ogv",
  "mp3", "ogg", "wav", "m4a",
  "pdf", "doc", "docx", "xls", "xlsx", "txt", "csv",
]);

function sanitizeString(value: unknown, maxLength = 255): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

async function getMemberFromToken(
  token: string,
  admin: ReturnType<typeof createClient>
) {
  if (!token || typeof token !== "string" || !TOKEN_REGEX.test(token)) return null;

  const { data: session } = await admin
    .from("team_sessions")
    .select("team_member_id, expires_at")
    .eq("session_token", token)
    .maybeSingle();

  if (!session || new Date(session.expires_at) < new Date()) return null;

  const { data: member } = await admin
    .from("team_members")
    .select("id, owner_id, full_name, email, role, department, job_title, avatar_url, is_active, permissions")
    .eq("id", session.team_member_id)
    .eq("is_active", true)
    .maybeSingle();

  return member;
}

Deno.serve(async (req: Request) => {
  const respond = makeResponder(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return respond({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, unknown>;
    let uploadedFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {
        action: formData.get("action") as string,
        session_token: formData.get("session_token") as string,
        conversation_id: formData.get("conversation_id") as string,
      };
      const file = formData.get("file");
      if (file instanceof File) {
        uploadedFile = file;
      }
    } else {
      try {
        body = await req.json();
      } catch {
        return respond({ error: "Invalid JSON body" }, 400);
      }
    }

    const { action, session_token } = body as { action: string; session_token: string };

    if (!session_token) {
      return respond({ error: "Authentication required" }, 401);
    }

    const member = await getMemberFromToken(sanitizeString(session_token, 200), admin);
    if (!member) {
      return respond({ error: "Invalid or expired session" }, 401);
    }

    switch (action) {
      case "upload-file":
        return await handleUploadFile(body, uploadedFile, member, admin, respond);
      case "get-profile":
        return await handleGetProfile(member, admin, respond);
      case "update-profile":
        return await handleUpdateProfile(body, member, admin, respond);
      case "get-contacts":
        return await handleGetContacts(member, admin, respond);
      case "get-conversations":
        return await handleGetConversations(member, admin, respond);
      case "get-messages":
        return await handleGetMessages(body, member, admin, respond);
      case "send-message":
        return await handleSendMessage(body, member, admin, respond);
      case "start-direct":
        return await handleStartDirect(body, member, admin, respond);
      case "create-group":
        return await handleCreateGroup(body, member, admin, respond);
      case "add-group-members":
        return await handleAddGroupMembers(body, member, admin, respond);
      case "request-approval":
        return await handleRequestApproval(body, member, admin, respond);
      case "review-approval":
        return await handleReviewApproval(body, member, admin, respond);
      case "get-approvals":
        return await handleGetApprovals(member, admin, respond);
      case "mark-read":
        return await handleMarkRead(body, member, admin, respond);
      case "set-typing":
        return await handleSetTyping(body, member, admin, respond);
      case "get-typing":
        return await handleGetTyping(body, member, admin, respond);
      case "set-online":
        return await handleSetOnline(body, member, admin, respond);
      case "poll-updates":
        return await handlePollUpdates(body, member, admin, respond);
      case "edit-message":
        return await handleEditMessage(body, member, admin, respond);
      case "delete-message":
        return await handleDeleteMessage(body, member, admin, respond);
      case "get-team-stats":
        return await handleGetTeamStats(member, admin, respond);
      case "search-messages":
        return await handleSearchMessages(body, member, admin, respond);
      case "react-to-message":
        return await handleReactToMessage(body, member, admin, respond);
      case "pin-message":
        return await handlePinMessage(body, member, admin, respond);
      case "get-pinned-messages":
        return await handleGetPinnedMessages(body, member, admin, respond);
      case "forward-message":
        return await handleForwardMessage(body, member, admin, respond);
      case "bookmark-message":
        return await handleBookmarkMessage(body, member, admin, respond);
      case "get-bookmarks":
        return await handleGetBookmarks(member, admin, respond);
      default:
        return respond({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    return respond({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
  }
});

type Responder = (data: unknown, status?: number) => Response;

async function handleGetProfile(
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { data } = await admin
    .from("team_chat_profiles")
    .select("*")
    .eq("team_member_id", member.id)
    .maybeSingle();

  if (!data) {
    const { data: created } = await admin
      .from("team_chat_profiles")
      .insert({ team_member_id: member.id })
      .select("*")
      .single();
    return respond({ data: created });
  }

  return respond({ data });
}

async function handleUpdateProfile(
  body: Record<string, unknown>,
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.bio !== undefined) updates.bio = sanitizeString(body.bio, 500);
  if (body.profile_pic_url !== undefined) updates.profile_pic_url = sanitizeString(body.profile_pic_url, 2000);
  if (body.display_name !== undefined) updates.display_name = sanitizeString(body.display_name, 100);

  const { data: existing } = await admin
    .from("team_chat_profiles")
    .select("id")
    .eq("team_member_id", member.id)
    .maybeSingle();

  if (!existing) {
    const { data } = await admin
      .from("team_chat_profiles")
      .insert({ team_member_id: member.id, ...updates })
      .select("*")
      .single();
    return respond({ data });
  }

  const { data } = await admin
    .from("team_chat_profiles")
    .update(updates)
    .eq("team_member_id", member.id)
    .select("*")
    .single();

  return respond({ data });
}

async function handleGetContacts(
  member: { id: string; owner_id: string; role: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { data: members } = await admin
    .from("team_members")
    .select("id, full_name, email, role, department, job_title, avatar_url, is_active")
    .eq("owner_id", member.owner_id)
    .eq("is_active", true)
    .neq("id", member.id)
    .order("full_name");

  const memberIds = (members || []).map((m: { id: string }) => m.id);

  let profiles: Record<string, { bio: string; profile_pic_url: string; display_name: string; is_online: boolean; last_seen_at: string }> = {};
  if (memberIds.length > 0) {
    const { data: chatProfiles } = await admin
      .from("team_chat_profiles")
      .select("team_member_id, bio, profile_pic_url, display_name, is_online, last_seen_at")
      .in("team_member_id", memberIds);

    for (const p of chatProfiles || []) {
      profiles[p.team_member_id] = p;
    }
  }

  let approvals: Record<string, string> = {};
  if (member.role === "employee") {
    const { data: appData } = await admin
      .from("team_message_approvals")
      .select("target_id, status")
      .eq("requester_id", member.id);
    for (const a of appData || []) {
      approvals[a.target_id] = a.status;
    }
  }

  const contacts = (members || []).map((m: Record<string, unknown>) => ({
    ...m,
    chat_profile: profiles[(m as { id: string }).id] || null,
    approval_status: member.role === "employee" && (m as { role: string }).role === "management"
      ? approvals[(m as { id: string }).id] || "none"
      : "not_required",
  }));

  return respond({ data: contacts });
}

async function handleGetConversations(
  member: { id: string; owner_id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { data: memberships } = await admin
    .from("team_conversation_members")
    .select("conversation_id, last_read_at, is_muted")
    .eq("team_member_id", member.id);

  if (!memberships || memberships.length === 0) {
    return respond({ data: [] });
  }

  const convIds = memberships.map((m: { conversation_id: string }) => m.conversation_id);

  const { data: conversations } = await admin
    .from("team_conversations")
    .select("*")
    .in("id", convIds)
    .order("updated_at", { ascending: false });

  const { data: allMembers } = await admin
    .from("team_conversation_members")
    .select("conversation_id, team_member_id")
    .in("conversation_id", convIds);

  const memberIds = [...new Set((allMembers || []).map((m: { team_member_id: string }) => m.team_member_id))];
  const { data: memberInfo } = await admin
    .from("team_members")
    .select("id, full_name, avatar_url, role")
    .in("id", memberIds);

  const { data: chatProfiles } = await admin
    .from("team_chat_profiles")
    .select("team_member_id, profile_pic_url, display_name, is_online")
    .in("team_member_id", memberIds);

  const profileMap: Record<string, { profile_pic_url: string; display_name: string; is_online: boolean }> = {};
  for (const p of chatProfiles || []) {
    profileMap[p.team_member_id] = p;
  }

  const memberMap: Record<string, { full_name: string; avatar_url: string; role: string; profile_pic_url: string; display_name: string; is_online: boolean }> = {};
  for (const m of memberInfo || []) {
    const prof = profileMap[m.id];
    memberMap[m.id] = {
      ...m,
      profile_pic_url: prof?.profile_pic_url || "",
      display_name: prof?.display_name || "",
      is_online: prof?.is_online || false,
    };
  }

  const convMembersMap: Record<string, string[]> = {};
  for (const cm of allMembers || []) {
    if (!convMembersMap[cm.conversation_id]) convMembersMap[cm.conversation_id] = [];
    convMembersMap[cm.conversation_id].push(cm.team_member_id);
  }

  const membershipMap: Record<string, { last_read_at: string; is_muted: boolean }> = {};
  for (const ms of memberships) {
    membershipMap[ms.conversation_id] = { last_read_at: ms.last_read_at, is_muted: ms.is_muted };
  }

  const lastMessages: Record<string, unknown> = {};
  for (const cid of convIds) {
    const { data: msg } = await admin
      .from("team_messages")
      .select("id, content, message_type, sender_id, created_at, is_deleted")
      .eq("conversation_id", cid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (msg) lastMessages[cid] = msg;
  }

  const unreadCounts: Record<string, number> = {};
  for (const cid of convIds) {
    const ms = membershipMap[cid];
    if (ms) {
      const { count } = await admin
        .from("team_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", cid)
        .neq("sender_id", member.id)
        .gt("created_at", ms.last_read_at)
        .eq("is_deleted", false);
      unreadCounts[cid] = count || 0;
    }
  }

  const enriched = (conversations || []).map((conv: Record<string, unknown>) => {
    const cid = conv.id as string;
    const members = (convMembersMap[cid] || []).map((mid: string) => memberMap[mid]).filter(Boolean);
    return {
      ...conv,
      members,
      last_message: lastMessages[cid] || null,
      unread_count: unreadCounts[cid] || 0,
      membership: membershipMap[cid] || null,
    };
  });

  return respond({ data: enriched });
}

async function handleGetMessages(
  body: { conversation_id: string; before?: string; limit?: number },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { conversation_id, before, limit = 50 } = body;

  const { data: membership } = await admin
    .from("team_conversation_members")
    .select("id")
    .eq("conversation_id", conversation_id)
    .eq("team_member_id", member.id)
    .maybeSingle();

  if (!membership) {
    return respond({ error: "Not a member of this conversation" }, 403);
  }

  let query = admin
    .from("team_messages")
    .select("id, conversation_id, sender_id, content, message_type, attachment_url, attachment_name, attachment_size, attachment_mime, reply_to_id, is_edited, is_deleted, created_at, updated_at")
    .eq("conversation_id", conversation_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: messages } = await query;

  const senderIds = [...new Set((messages || []).map((m: { sender_id: string }) => m.sender_id).filter(Boolean))];
  let senderMap: Record<string, unknown> = {};
  if (senderIds.length > 0) {
    const { data: senders } = await admin
      .from("team_members")
      .select("id, full_name, avatar_url, role")
      .in("id", senderIds);
    const { data: profiles } = await admin
      .from("team_chat_profiles")
      .select("team_member_id, profile_pic_url, display_name")
      .in("team_member_id", senderIds);
    const profMap: Record<string, { profile_pic_url: string; display_name: string }> = {};
    for (const p of profiles || []) profMap[p.team_member_id] = p;
    for (const s of senders || []) {
      const prof = profMap[s.id];
      senderMap[s.id] = { ...s, profile_pic_url: prof?.profile_pic_url || "", display_name: prof?.display_name || "" };
    }
  }

  const replyIds = (messages || []).map((m: { reply_to_id: string | null }) => m.reply_to_id).filter(Boolean);
  let replyMap: Record<string, unknown> = {};
  if (replyIds.length > 0) {
    const { data: replies } = await admin
      .from("team_messages")
      .select("id, content, sender_id, message_type")
      .in("id", replyIds);
    for (const r of replies || []) {
      replyMap[r.id] = { ...r, sender: senderMap[r.sender_id] || null };
    }
  }

  const enriched = (messages || []).reverse().map((msg: Record<string, unknown>) => ({
    ...msg,
    sender: senderMap[msg.sender_id as string] || null,
    reply_to: msg.reply_to_id ? replyMap[msg.reply_to_id as string] || null : null,
  }));

  return respond({ data: enriched });
}

async function handleSendMessage(
  body: { conversation_id: string; content: string; message_type?: string; attachment_url?: string; attachment_name?: string; attachment_size?: number; attachment_mime?: string; reply_to_id?: string },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { conversation_id, content, message_type = "text", attachment_url, attachment_name, attachment_size, attachment_mime, reply_to_id } = body;

  if (content && content.length > 10000) return respond({ error: "Message too long" }, 400);

  const { data: membership } = await admin
    .from("team_conversation_members")
    .select("id")
    .eq("conversation_id", conversation_id)
    .eq("team_member_id", member.id)
    .maybeSingle();

  if (!membership) {
    return respond({ error: "Not a member of this conversation" }, 403);
  }

  const { data: msg, error } = await admin
    .from("team_messages")
    .insert({
      conversation_id,
      sender_id: member.id,
      content: content || "",
      message_type,
      attachment_url: attachment_url || "",
      attachment_name: attachment_name || "",
      attachment_size: attachment_size || 0,
      attachment_mime: attachment_mime || "",
      reply_to_id: reply_to_id || null,
    })
    .select("*")
    .single();

  if (error) return respond({ error: error.message }, 400);

  await admin
    .from("team_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversation_id);

  await admin
    .from("team_conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversation_id)
    .eq("team_member_id", member.id);

  await admin
    .from("team_typing_indicators")
    .delete()
    .eq("conversation_id", conversation_id)
    .eq("team_member_id", member.id);

  return respond({ data: msg });
}

async function handleStartDirect(
  body: { target_member_id: string },
  member: { id: string; owner_id: string; role: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { target_member_id } = body;

  const { data: target } = await admin
    .from("team_members")
    .select("id, role, owner_id")
    .eq("id", target_member_id)
    .eq("owner_id", member.owner_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!target) return respond({ error: "User not found" }, 404);

  if (member.role === "employee" && target.role === "management") {
    const { data: approval } = await admin
      .from("team_message_approvals")
      .select("status")
      .eq("requester_id", member.id)
      .eq("target_id", target_member_id)
      .maybeSingle();

    if (!approval || approval.status !== "approved") {
      return respond({ error: "Approval required to message management" }, 403);
    }
  }

  const { data: existingConvs } = await admin
    .from("team_conversation_members")
    .select("conversation_id")
    .eq("team_member_id", member.id);

  const myConvIds = (existingConvs || []).map((c: { conversation_id: string }) => c.conversation_id);

  if (myConvIds.length > 0) {
    const { data: targetConvs } = await admin
      .from("team_conversation_members")
      .select("conversation_id")
      .eq("team_member_id", target_member_id)
      .in("conversation_id", myConvIds);

    const sharedConvIds = (targetConvs || []).map((c: { conversation_id: string }) => c.conversation_id);

    if (sharedConvIds.length > 0) {
      const { data: directConv } = await admin
        .from("team_conversations")
        .select("id")
        .in("id", sharedConvIds)
        .eq("type", "direct")
        .maybeSingle();

      if (directConv) {
        return respond({ data: { conversation_id: directConv.id, existing: true } });
      }
    }
  }

  const { data: conv } = await admin
    .from("team_conversations")
    .insert({
      owner_id: member.owner_id,
      type: "direct",
      created_by: member.id,
    })
    .select("id")
    .single();

  await admin.from("team_conversation_members").insert([
    { conversation_id: conv.id, team_member_id: member.id, role: "member" },
    { conversation_id: conv.id, team_member_id: target_member_id, role: "member" },
  ]);

  return respond({ data: { conversation_id: conv.id, existing: false } });
}

async function handleCreateGroup(
  body: { name: string; description?: string; project_id?: string; member_ids: string[] },
  member: { id: string; owner_id: string; role: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  if (member.role !== "management") {
    return respond({ error: "Only management can create groups" }, 403);
  }

  const { name, description, project_id, member_ids } = body;
  if (!name) return respond({ error: "Group name is required" }, 400);

  const { data: conv } = await admin
    .from("team_conversations")
    .insert({
      owner_id: member.owner_id,
      type: "group",
      name,
      description: description || "",
      project_id: project_id || null,
      created_by: member.id,
    })
    .select("id")
    .single();

  const memberInserts = [
    { conversation_id: conv.id, team_member_id: member.id, role: "admin" },
    ...(member_ids || [])
      .filter((mid: string) => mid !== member.id)
      .map((mid: string) => ({ conversation_id: conv.id, team_member_id: mid, role: "member" })),
  ];

  await admin.from("team_conversation_members").insert(memberInserts);

  await admin.from("team_messages").insert({
    conversation_id: conv.id,
    sender_id: member.id,
    content: "Group created",
    message_type: "system",
  });

  return respond({ data: { conversation_id: conv.id } });
}

async function handleAddGroupMembers(
  body: { conversation_id: string; member_ids: string[] },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { conversation_id, member_ids } = body;

  const { data: conv } = await admin
    .from("team_conversations")
    .select("id, type")
    .eq("id", conversation_id)
    .eq("type", "group")
    .maybeSingle();

  if (!conv) return respond({ error: "Group not found" }, 404);

  const { data: adminCheck } = await admin
    .from("team_conversation_members")
    .select("role")
    .eq("conversation_id", conversation_id)
    .eq("team_member_id", member.id)
    .maybeSingle();

  if (!adminCheck || adminCheck.role !== "admin") {
    return respond({ error: "Only group admins can add members" }, 403);
  }

  const inserts = (member_ids || []).map((mid: string) => ({
    conversation_id,
    team_member_id: mid,
    role: "member",
  }));

  await admin.from("team_conversation_members").upsert(inserts, { onConflict: "conversation_id,team_member_id" });

  return respond({ data: { added: member_ids.length } });
}

async function handleRequestApproval(
  body: { target_id: string; reason?: string },
  member: { id: string; owner_id: string; role: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  if (member.role !== "employee") {
    return respond({ error: "Only employees need approval" }, 400);
  }

  const { target_id, reason } = body;

  const { data: target } = await admin
    .from("team_members")
    .select("id, role")
    .eq("id", target_id)
    .eq("owner_id", member.owner_id)
    .eq("role", "management")
    .maybeSingle();

  if (!target) return respond({ error: "Management member not found" }, 404);

  const { data, error } = await admin
    .from("team_message_approvals")
    .upsert(
      {
        owner_id: member.owner_id,
        requester_id: member.id,
        target_id,
        status: "pending",
        reason: reason || "",
        reviewed_by: null,
        reviewed_at: null,
      },
      { onConflict: "requester_id,target_id" }
    )
    .select("*")
    .single();

  if (error) return respond({ error: error.message }, 400);

  return respond({ data });
}

async function handleReviewApproval(
  body: { approval_id: string; status: "approved" | "rejected" },
  member: { id: string; role: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  if (member.role !== "management") {
    return respond({ error: "Only management can review approvals" }, 403);
  }

  const { approval_id, status } = body;
  if (!["approved", "rejected"].includes(status)) {
    return respond({ error: "Invalid status" }, 400);
  }

  const { data, error } = await admin
    .from("team_message_approvals")
    .update({
      status,
      reviewed_by: member.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", approval_id)
    .select("*")
    .single();

  if (error) return respond({ error: error.message }, 400);

  return respond({ data });
}

async function handleGetApprovals(
  member: { id: string; owner_id: string; role: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  let query = admin
    .from("team_message_approvals")
    .select("*")
    .eq("owner_id", member.owner_id)
    .order("created_at", { ascending: false });

  if (member.role === "employee") {
    query = query.eq("requester_id", member.id);
  } else {
    query = query.eq("target_id", member.id);
  }

  const { data } = await query;

  const memberIds = new Set<string>();
  for (const a of data || []) {
    memberIds.add(a.requester_id);
    memberIds.add(a.target_id);
    if (a.reviewed_by) memberIds.add(a.reviewed_by);
  }

  let memberMap: Record<string, unknown> = {};
  if (memberIds.size > 0) {
    const { data: members } = await admin
      .from("team_members")
      .select("id, full_name, avatar_url, role, department")
      .in("id", [...memberIds]);
    for (const m of members || []) memberMap[m.id] = m;
  }

  const enriched = (data || []).map((a: Record<string, unknown>) => ({
    ...a,
    requester: memberMap[a.requester_id as string] || null,
    target: memberMap[a.target_id as string] || null,
    reviewer: a.reviewed_by ? memberMap[a.reviewed_by as string] || null : null,
  }));

  return respond({ data: enriched });
}

async function handleMarkRead(
  body: { conversation_id: string },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  await admin
    .from("team_conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", body.conversation_id)
    .eq("team_member_id", member.id);

  return respond({ success: true });
}

async function handleSetTyping(
  body: { conversation_id: string; is_typing: boolean },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  if (body.is_typing) {
    await admin.from("team_typing_indicators").upsert(
      { conversation_id: body.conversation_id, team_member_id: member.id, updated_at: new Date().toISOString() },
      { onConflict: "conversation_id,team_member_id" }
    );
  } else {
    await admin
      .from("team_typing_indicators")
      .delete()
      .eq("conversation_id", body.conversation_id)
      .eq("team_member_id", member.id);
  }

  return respond({ success: true });
}

async function handleGetTyping(
  body: { conversation_id: string },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const cutoff = new Date(Date.now() - 10000).toISOString();
  const { data } = await admin
    .from("team_typing_indicators")
    .select("team_member_id, updated_at")
    .eq("conversation_id", body.conversation_id)
    .neq("team_member_id", member.id)
    .gt("updated_at", cutoff);

  const memberIds = (data || []).map((d: { team_member_id: string }) => d.team_member_id);
  let names: Record<string, string> = {};
  if (memberIds.length > 0) {
    const { data: members } = await admin
      .from("team_members")
      .select("id, full_name")
      .in("id", memberIds);
    for (const m of members || []) names[m.id] = m.full_name;
  }

  return respond({ data: (data || []).map((d: { team_member_id: string }) => ({ ...d, name: names[d.team_member_id] || "Someone" })) });
}

async function handleSetOnline(
  body: { is_online: boolean },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const updates: Record<string, unknown> = {
    is_online: body.is_online,
    updated_at: new Date().toISOString(),
  };
  if (!body.is_online) updates.last_seen_at = new Date().toISOString();

  const { data: existing } = await admin
    .from("team_chat_profiles")
    .select("id")
    .eq("team_member_id", member.id)
    .maybeSingle();

  if (!existing) {
    await admin.from("team_chat_profiles").insert({ team_member_id: member.id, ...updates });
  } else {
    await admin.from("team_chat_profiles").update(updates).eq("team_member_id", member.id);
  }

  return respond({ success: true });
}

async function handlePollUpdates(
  body: { conversation_ids: string[]; since: string },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { conversation_ids, since } = body;

  if (!conversation_ids || conversation_ids.length === 0) {
    return respond({ data: { new_messages: [], updated_conversations: [] } });
  }

  const { data: membership } = await admin
    .from("team_conversation_members")
    .select("conversation_id")
    .eq("team_member_id", member.id)
    .in("conversation_id", conversation_ids);

  const validIds = (membership || []).map((m: { conversation_id: string }) => m.conversation_id);

  if (validIds.length === 0) {
    return respond({ data: { new_messages: [], updated_conversations: [] } });
  }

  const { data: newMessages } = await admin
    .from("team_messages")
    .select("id, conversation_id, sender_id, content, message_type, created_at, is_deleted")
    .in("conversation_id", validIds)
    .gt("created_at", since)
    .order("created_at", { ascending: true })
    .limit(100);

  const { data: updatedConversations } = await admin
    .from("team_conversations")
    .select("id, updated_at")
    .in("id", validIds)
    .gt("updated_at", since);

  return respond({
    data: {
      new_messages: newMessages || [],
      updated_conversations: updatedConversations || [],
    },
  });
}

async function handleEditMessage(
  body: { message_id: string; content: string },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { data, error } = await admin
    .from("team_messages")
    .update({ content: body.content, is_edited: true, updated_at: new Date().toISOString() })
    .eq("id", body.message_id)
    .eq("sender_id", member.id)
    .select("*")
    .single();

  if (error) return respond({ error: "Message not found or not yours" }, 404);
  return respond({ data });
}

async function handleDeleteMessage(
  body: { message_id: string },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { data, error } = await admin
    .from("team_messages")
    .update({ is_deleted: true, content: "", updated_at: new Date().toISOString() })
    .eq("id", body.message_id)
    .eq("sender_id", member.id)
    .select("*")
    .single();

  if (error) return respond({ error: "Message not found or not yours" }, 404);
  return respond({ data });
}

async function handleGetTeamStats(
  member: { id: string; owner_id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { data: members } = await admin
    .from("team_members")
    .select("id, role")
    .eq("owner_id", member.owner_id)
    .eq("is_active", true);

  const memberIds = (members || []).map((m: { id: string }) => m.id);
  const { data: profiles } = await admin
    .from("team_chat_profiles")
    .select("team_member_id, is_online")
    .in("team_member_id", memberIds);

  const onlineSet = new Set(
    (profiles || []).filter((p: { is_online: boolean }) => p.is_online).map((p: { team_member_id: string }) => p.team_member_id)
  );

  let total_employees = 0, online_employees = 0, total_management = 0, online_management = 0;
  for (const m of members || []) {
    if (m.role === "employee") {
      total_employees++;
      if (onlineSet.has(m.id)) online_employees++;
    } else if (m.role === "management") {
      total_management++;
      if (onlineSet.has(m.id)) online_management++;
    }
  }

  return respond({ data: { total_employees, online_employees, total_management, online_management } });
}

async function handleSearchMessages(
  body: { query: string },
  member: { id: string; owner_id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { query } = body;
  if (!query || query.trim().length < 2) {
    return respond({ data: [] });
  }

  const { data: memberships } = await admin
    .from("team_conversation_members")
    .select("conversation_id")
    .eq("team_member_id", member.id);

  const convIds = (memberships || []).map((m: { conversation_id: string }) => m.conversation_id);
  if (convIds.length === 0) return respond({ data: [] });

  const safeQuery = query.trim().slice(0, 100).replace(/[%_]/g, "");

  const { data: messages } = await admin
    .from("team_messages")
    .select("id, content, message_type, created_at, conversation_id, sender_id")
    .in("conversation_id", convIds)
    .eq("is_deleted", false)
    .ilike("content", `%${safeQuery}%`)
    .order("created_at", { ascending: false })
    .limit(30);

  const senderIds = [...new Set((messages || []).map((m: { sender_id: string }) => m.sender_id).filter(Boolean))];
  const convIdsFound = [...new Set((messages || []).map((m: { conversation_id: string }) => m.conversation_id))];

  let senderMap: Record<string, unknown> = {};
  if (senderIds.length > 0) {
    const { data: senders } = await admin
      .from("team_members")
      .select("id, full_name, avatar_url, role")
      .in("id", senderIds);
    const { data: profiles } = await admin
      .from("team_chat_profiles")
      .select("team_member_id, profile_pic_url, display_name")
      .in("team_member_id", senderIds);
    const profMap: Record<string, { profile_pic_url: string; display_name: string }> = {};
    for (const p of profiles || []) profMap[p.team_member_id] = p;
    for (const s of senders || []) {
      const prof = profMap[s.id];
      senderMap[s.id] = { ...s, profile_pic_url: prof?.profile_pic_url || "", display_name: prof?.display_name || "" };
    }
  }

  let convNameMap: Record<string, string> = {};
  if (convIdsFound.length > 0) {
    const { data: convs } = await admin
      .from("team_conversations")
      .select("id, name, type")
      .in("id", convIdsFound);
    for (const c of convs || []) {
      convNameMap[c.id] = c.name || (c.type === "direct" ? "Direct Message" : "Group");
    }
  }

  const results = (messages || []).map((msg: Record<string, unknown>) => ({
    id: msg.id,
    content: msg.content,
    message_type: msg.message_type,
    created_at: msg.created_at,
    conversation_id: msg.conversation_id,
    conversation_name: convNameMap[msg.conversation_id as string] || "Chat",
    sender: senderMap[msg.sender_id as string] || null,
  }));

  return respond({ data: results });
}

async function handleReactToMessage(
  body: { message_id: string; emoji: string },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { message_id, emoji } = body;
  if (!message_id || !emoji) return respond({ error: "Missing params" }, 400);

  const { data: existing } = await admin
    .from("team_message_reactions")
    .select("id")
    .eq("message_id", message_id)
    .eq("team_member_id", member.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await admin.from("team_message_reactions").delete().eq("id", existing.id);
    return respond({ data: { added: false } });
  }

  await admin.from("team_message_reactions").insert({
    message_id,
    team_member_id: member.id,
    emoji,
  });

  return respond({ data: { added: true } });
}

async function handlePinMessage(
  body: { conversation_id: string; message_id: string },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { conversation_id, message_id } = body;

  const { data: existing } = await admin
    .from("team_pinned_messages")
    .select("id")
    .eq("conversation_id", conversation_id)
    .eq("message_id", message_id)
    .maybeSingle();

  if (existing) {
    await admin.from("team_pinned_messages").delete().eq("id", existing.id);
    return respond({ data: { pinned: false } });
  }

  await admin.from("team_pinned_messages").insert({
    conversation_id,
    message_id,
    pinned_by: member.id,
  });

  return respond({ data: { pinned: true } });
}

async function handleGetPinnedMessages(
  body: { conversation_id: string },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { data: pins } = await admin
    .from("team_pinned_messages")
    .select("message_id")
    .eq("conversation_id", body.conversation_id)
    .order("created_at", { ascending: false });

  if (!pins || pins.length === 0) return respond({ data: [] });

  const msgIds = pins.map((p: { message_id: string }) => p.message_id);
  const { data: messages } = await admin
    .from("team_messages")
    .select("id, conversation_id, sender_id, content, message_type, attachment_url, attachment_name, created_at, is_deleted")
    .in("id", msgIds);

  const senderIds = [...new Set((messages || []).map((m: { sender_id: string }) => m.sender_id).filter(Boolean))];
  let senderMap: Record<string, unknown> = {};
  if (senderIds.length > 0) {
    const { data: senders } = await admin
      .from("team_members")
      .select("id, full_name, avatar_url, role")
      .in("id", senderIds);
    const { data: profiles } = await admin
      .from("team_chat_profiles")
      .select("team_member_id, profile_pic_url, display_name")
      .in("team_member_id", senderIds);
    const profMap: Record<string, { profile_pic_url: string; display_name: string }> = {};
    for (const p of profiles || []) profMap[p.team_member_id] = p;
    for (const s of senders || []) {
      const prof = profMap[s.id];
      senderMap[s.id] = { ...s, profile_pic_url: prof?.profile_pic_url || "", display_name: prof?.display_name || "" };
    }
  }

  const enriched = (messages || []).map((msg: Record<string, unknown>) => ({
    ...msg,
    sender: senderMap[msg.sender_id as string] || null,
    is_pinned: true,
  }));

  return respond({ data: enriched });
}

async function handleForwardMessage(
  body: { message_id: string; target_conversation_id: string },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { message_id, target_conversation_id } = body;

  const { data: membership } = await admin
    .from("team_conversation_members")
    .select("id")
    .eq("conversation_id", target_conversation_id)
    .eq("team_member_id", member.id)
    .maybeSingle();

  if (!membership) return respond({ error: "Not a member of target conversation" }, 403);

  const { data: original } = await admin
    .from("team_messages")
    .select("content, message_type, attachment_url, attachment_name")
    .eq("id", message_id)
    .maybeSingle();

  if (!original) return respond({ error: "Message not found" }, 404);

  const { data: msg, error } = await admin
    .from("team_messages")
    .insert({
      conversation_id: target_conversation_id,
      sender_id: member.id,
      content: original.content,
      message_type: original.message_type,
      attachment_url: original.attachment_url || "",
      attachment_name: original.attachment_name || "",
      forwarded_from: message_id,
    })
    .select("*")
    .single();

  if (error) return respond({ error: error.message }, 400);

  await admin
    .from("team_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", target_conversation_id);

  return respond({ data: msg });
}

async function handleBookmarkMessage(
  body: { message_id: string },
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { message_id } = body;

  const { data: existing } = await admin
    .from("team_message_bookmarks")
    .select("id")
    .eq("message_id", message_id)
    .eq("team_member_id", member.id)
    .maybeSingle();

  if (existing) {
    await admin.from("team_message_bookmarks").delete().eq("id", existing.id);
    return respond({ data: { bookmarked: false } });
  }

  await admin.from("team_message_bookmarks").insert({
    message_id,
    team_member_id: member.id,
  });

  return respond({ data: { bookmarked: true } });
}

async function handleGetBookmarks(
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  const { data: bookmarks } = await admin
    .from("team_message_bookmarks")
    .select("message_id")
    .eq("team_member_id", member.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!bookmarks || bookmarks.length === 0) return respond({ data: [] });

  const msgIds = bookmarks.map((b: { message_id: string }) => b.message_id);
  const { data: messages } = await admin
    .from("team_messages")
    .select("id, conversation_id, sender_id, content, message_type, attachment_url, attachment_name, created_at, is_deleted")
    .in("id", msgIds);

  const senderIds = [...new Set((messages || []).map((m: { sender_id: string }) => m.sender_id).filter(Boolean))];
  let senderMap: Record<string, unknown> = {};
  if (senderIds.length > 0) {
    const { data: senders } = await admin
      .from("team_members")
      .select("id, full_name, avatar_url, role")
      .in("id", senderIds);
    const { data: profiles } = await admin
      .from("team_chat_profiles")
      .select("team_member_id, profile_pic_url, display_name")
      .in("team_member_id", senderIds);
    const profMap: Record<string, { profile_pic_url: string; display_name: string }> = {};
    for (const p of profiles || []) profMap[p.team_member_id] = p;
    for (const s of senders || []) {
      const prof = profMap[s.id];
      senderMap[s.id] = { ...s, profile_pic_url: prof?.profile_pic_url || "", display_name: prof?.display_name || "" };
    }
  }

  const enriched = (messages || []).map((msg: Record<string, unknown>) => ({
    ...msg,
    sender: senderMap[msg.sender_id as string] || null,
    is_bookmarked: true,
  }));

  return respond({ data: enriched });
}

async function handleUploadFile(
  body: Record<string, unknown>,
  file: File | null,
  member: { id: string },
  admin: ReturnType<typeof createClient>,
  respond: Responder
) {
  if (!file) return respond({ error: "No file provided" }, 400);

  const conversationId = body.conversation_id as string;
  if (!conversationId) return respond({ error: "conversation_id required" }, 400);

  const { data: membership } = await admin
    .from("team_conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("team_member_id", member.id)
    .maybeSingle();

  if (!membership) {
    return respond({ error: "Not a member of this conversation" }, 403);
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return respond({ error: "File too large. Maximum 10MB." }, 400);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (!ALLOWED_EXTENSIONS.has(ext)) return respond({ error: "File type not allowed" }, 400);

  const mimeType = file.type || "";
  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) return respond({ error: "File type not allowed" }, 400);

  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10);
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : "bin";
  const path = `${member.id}/${timestamp}-${randomId}.${safeExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from("chat-attachments")
    .upload(path, arrayBuffer, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return respond({ error: uploadError.message }, 500);
  }

  const { data: publicUrl } = admin.storage
    .from("chat-attachments")
    .getPublicUrl(path);

  return respond({ data: { url: publicUrl.publicUrl } });
}
