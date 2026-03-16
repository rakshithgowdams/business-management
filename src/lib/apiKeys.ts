import { supabase } from './supabase';

const KEYS = {
  kie_ai: 'mfo_key_kie_ai',
  elevenlabs: 'mfo_key_elevenlabs',
  meta: 'mfo_key_meta',
  r2_access_key: 'mfo_key_r2_access',
  r2_secret_key: 'mfo_key_r2_secret',
  r2_bucket: 'mfo_r2_bucket',
  r2_endpoint: 'mfo_r2_endpoint',
  r2_public_url: 'mfo_r2_public_url',
} as const;

export type KeyName = keyof typeof KEYS;

const CRYPTO_VERSION = 'v3:';
const KEY_MATERIAL_SALT = 'mfo-apikey-salt-2026';

async function getDerivedKey(): Promise<CryptoKey> {
  const sessionData = localStorage.getItem('myfinance-os-auth');
  const userId = sessionData ? (JSON.parse(sessionData)?.user?.id ?? 'anon') : 'anon';
  const rawSecret = `${userId}-${KEY_MATERIAL_SALT}`;

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(rawSecret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(KEY_MATERIAL_SALT),
      iterations: 200000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(value: string): Promise<string> {
  const key = await getDerivedKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(value)
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return CRYPTO_VERSION + btoa(String.fromCharCode(...combined));
}

async function decrypt(stored: string): Promise<string> {
  const versionPrefixes = ['v3:', 'v2:'];
  const matchedPrefix = versionPrefixes.find(p => stored.startsWith(p));
  if (!matchedPrefix) {
    try { return atob(stored); } catch { return stored; }
  }
  try {
    const key = await getDerivedKey();
    const raw = Uint8Array.from(atob(stored.slice(matchedPrefix.length)), c => c.charCodeAt(0));
    const iv = raw.slice(0, 12);
    const ciphertext = raw.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    return '';
  }
}

export async function getApiKey(name: KeyName): Promise<string> {
  const raw = localStorage.getItem(KEYS[name]);
  if (!raw) return '';
  return await decrypt(raw);
}

export async function setApiKey(name: KeyName, value: string): Promise<void> {
  if (!value.trim()) {
    localStorage.removeItem(KEYS[name]);
    return;
  }
  const encrypted = await encrypt(value.trim());
  localStorage.setItem(KEYS[name], encrypted);
}

export function hasApiKeySet(name: KeyName): boolean {
  return !!localStorage.getItem(KEYS[name]);
}

export function removeApiKey(name: KeyName): void {
  localStorage.removeItem(KEYS[name]);
}

export async function syncKeyToSupabase(name: KeyName, value: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const encrypted = await encrypt(value);
  const hint = value.slice(0, 4) + '••••' + value.slice(-4);

  const { data: existing } = await supabase
    .from('user_api_keys')
    .select('id')
    .eq('user_id', user.id)
    .eq('provider', name)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('user_api_keys')
      .update({ encrypted_key: encrypted, key_hint: hint, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase.from('user_api_keys').insert({
      user_id: user.id,
      provider: name,
      encrypted_key: encrypted,
      key_hint: hint,
    });
  }
}

export async function removeKeyFromSupabase(name: KeyName): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('user_api_keys').delete().eq('user_id', user.id).eq('provider', name);
}

export async function loadKeysFromSupabase(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from('user_api_keys')
    .select('provider, encrypted_key')
    .eq('user_id', user.id);

  if (!data) return;
  for (const row of data) {
    const provider = row.provider as KeyName;
    if (provider in KEYS && row.encrypted_key) {
      localStorage.setItem(KEYS[provider], row.encrypted_key);
    }
  }
}

async function getSessionToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

export async function testKieAiKey(apiKey: string): Promise<{ success: boolean; credits?: number; error?: string }> {
  try {
    const token = await getSessionToken();
    if (!token) return { success: false, error: 'Not authenticated' };
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy?action=test-kie`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ api_key: apiKey }),
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    if (data.success) return { success: true, credits: data.credits };
    return { success: false, error: data.error || 'Invalid key' };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function testElevenLabsKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getSessionToken();
    if (!token) return { success: false, error: 'Not authenticated' };
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy?action=test-elevenlabs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ api_key: apiKey }),
    });
    const data = await res.json();
    return { success: data.success === true, error: data.error };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function testMetaKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getSessionToken();
    if (!token) return { success: false, error: 'Not authenticated' };
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy?action=test-meta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ api_key: apiKey }),
    });
    const data = await res.json();
    return { success: data.success === true, error: data.error };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function getR2Config() {
  return {
    accessKey: await getApiKey('r2_access_key'),
    secretKey: await getApiKey('r2_secret_key'),
    bucket: await getApiKey('r2_bucket') || 'myfinance-media',
    endpoint: await getApiKey('r2_endpoint'),
    publicUrl: await getApiKey('r2_public_url'),
  };
}

export async function getMetaConfig() {
  return {
    accessToken: await getApiKey('meta'),
  };
}
