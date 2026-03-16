const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/client-portal-auth`;

async function callPortalFunction(body: Record<string, unknown>, authToken?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Apikey': SUPABASE_ANON_KEY,
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export async function createPortal(
  portalName: string,
  clientId: string | null,
  authToken: string
) {
  return callPortalFunction(
    { action: 'create-portal', portal_name: portalName, client_id: clientId },
    authToken
  );
}

export async function regenerateAccessCode(portalId: string, authToken: string) {
  return callPortalFunction(
    { action: 'regenerate-code', portal_id: portalId },
    authToken
  );
}

export async function portalLogin(slug: string, accessCode: string) {
  return callPortalFunction({ action: 'login', slug, access_code: accessCode });
}

export async function validatePortalSession(sessionToken: string) {
  return callPortalFunction({ action: 'validate-session', session_token: sessionToken });
}

export async function portalLogout(sessionToken: string) {
  return callPortalFunction({ action: 'logout', session_token: sessionToken });
}

export async function getPortalData(sessionToken: string, section?: string) {
  return callPortalFunction({
    action: 'get-portal-data',
    session_token: sessionToken,
    section,
  });
}

const PORTAL_SESSION_KEY = 'mdn_portal_session';

export function savePortalSession(token: string, slug: string) {
  localStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify({ token, slug }));
}

export function getStoredPortalSession(): { token: string; slug: string } | null {
  try {
    const raw = localStorage.getItem(PORTAL_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPortalSession() {
  localStorage.removeItem(PORTAL_SESSION_KEY);
}
