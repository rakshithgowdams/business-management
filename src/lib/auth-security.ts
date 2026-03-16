const LOGIN_ATTEMPTS_KEY = 'myfinance-login-attempts';
const LOCKOUT_KEY = 'myfinance-lockout-until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

interface AttemptsData {
  count: number;
  firstAttempt: number;
  window: number;
}

export function getLoginAttempts(): AttemptsData {
  try {
    const raw = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!raw) return { count: 0, firstAttempt: 0, window: 0 };
    return JSON.parse(raw);
  } catch {
    return { count: 0, firstAttempt: 0, window: 0 };
  }
}

export function isLockedOut(): { locked: boolean; remainingMs: number } {
  try {
    const lockoutUntil = localStorage.getItem(LOCKOUT_KEY);
    if (!lockoutUntil) return { locked: false, remainingMs: 0 };
    const until = parseInt(lockoutUntil, 10);
    const now = Date.now();
    if (now < until) {
      return { locked: true, remainingMs: until - now };
    }
    localStorage.removeItem(LOCKOUT_KEY);
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    return { locked: false, remainingMs: 0 };
  } catch {
    return { locked: false, remainingMs: 0 };
  }
}

export function recordFailedAttempt(): { locked: boolean; attemptsLeft: number } {
  const now = Date.now();
  const attempts = getLoginAttempts();
  const windowMs = 15 * 60 * 1000;

  if (attempts.firstAttempt && now - attempts.firstAttempt > windowMs) {
    const fresh: AttemptsData = { count: 1, firstAttempt: now, window: windowMs };
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(fresh));
    return { locked: false, attemptsLeft: MAX_ATTEMPTS - 1 };
  }

  const updated: AttemptsData = {
    count: attempts.count + 1,
    firstAttempt: attempts.firstAttempt || now,
    window: windowMs,
  };
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(updated));

  if (updated.count >= MAX_ATTEMPTS) {
    localStorage.setItem(LOCKOUT_KEY, String(now + LOCKOUT_DURATION_MS));
    return { locked: true, attemptsLeft: 0 };
  }

  return { locked: false, attemptsLeft: MAX_ATTEMPTS - updated.count };
}

export function clearLoginAttempts(): void {
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  localStorage.removeItem(LOCKOUT_KEY);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return 'Password must contain at least one special character';
  return null;
}

export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 4) return { score, label: 'Medium', color: '#f59e0b' };
  return { score, label: 'Strong', color: '#22c55e' };
}

export function isTokenExpired(expiresAt: number | undefined): boolean {
  if (!expiresAt) return true;
  const bufferSeconds = 30;
  return Date.now() / 1000 > expiresAt - bufferSeconds;
}

export function formatLockoutTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
