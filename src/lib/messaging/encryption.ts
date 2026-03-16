const ENCRYPTION_PREFIX = 'enc::';
const LS_SESSION_KEY = 'mfo_team_session';

async function deriveKey(conversationId: string): Promise<CryptoKey> {
  const sessionToken = localStorage.getItem(LS_SESSION_KEY) || '';
  if (!sessionToken) throw new Error('No session');

  const enc = new TextEncoder();
  const seed = `${sessionToken}:${conversationId}`;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(seed),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(`mfo-chat-salt-v2:${conversationId}`),
      iterations: 300000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(
  content: string,
  conversationId: string
): Promise<string> {
  if (!content || content.trim().length === 0) return content;

  try {
    const key = await deriveKey(conversationId);
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(content)
    );

    const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    const base64 = btoa(String.fromCharCode(...combined));
    return `${ENCRYPTION_PREFIX}${base64}`;
  } catch {
    return content;
  }
}

export async function decryptMessage(
  content: string,
  conversationId: string
): Promise<string> {
  if (!content || !content.startsWith(ENCRYPTION_PREFIX)) return content;

  try {
    const key = await deriveKey(conversationId);
    const base64 = content.slice(ENCRYPTION_PREFIX.length);
    const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const iv = raw.slice(0, 12);
    const ciphertext = raw.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return content;
  }
}

export function isEncrypted(content: string): boolean {
  return content?.startsWith(ENCRYPTION_PREFIX) || false;
}
