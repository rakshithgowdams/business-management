import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import type { TeamMember } from '../lib/team/types';

interface TeamAuthContextType {
  member: TeamMember | null;
  loading: boolean;
  signIn: (email: string, password: string, role: 'employee' | 'management') => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasPermission: (key: string) => boolean;
}

const TeamAuthContext = createContext<TeamAuthContextType | undefined>(undefined);

const LS_SESSION_KEY = 'mfo_team_session';
const TEAM_AUTH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/team-auth`;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

async function teamAuthFetch(action: string, payload: Record<string, unknown>) {
  const res = await fetch(TEAM_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

export function TeamAuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const lastActivityRef = useRef(Date.now());
  const inactivityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const performSignOut = useCallback(async () => {
    const token = localStorage.getItem(LS_SESSION_KEY);
    if (token) {
      try { await teamAuthFetch('logout', { session_token: token }); } catch { /* */ }
    }
    localStorage.removeItem(LS_SESSION_KEY);
    setMember(null);
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetActivity, { passive: true }));
    return () => { events.forEach(e => window.removeEventListener(e, resetActivity)); };
  }, [resetActivity]);

  useEffect(() => {
    validateSession();
  }, []);

  useEffect(() => {
    if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
    if (!member) return;

    inactivityTimerRef.current = setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT) {
        performSignOut();
      }
    }, 60 * 1000);

    return () => {
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
    };
  }, [member, performSignOut]);

  const validateSession = async () => {
    const token = localStorage.getItem(LS_SESSION_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const result = await teamAuthFetch('validate-session', { session_token: token });
      if (result.data?.member) {
        setMember(result.data.member as TeamMember);
      } else {
        localStorage.removeItem(LS_SESSION_KEY);
      }
    } catch {
      localStorage.removeItem(LS_SESSION_KEY);
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string, role: 'employee' | 'management') => {
    try {
      const result = await teamAuthFetch('login', { email, password, role });
      if (result.error) return { error: result.error };

      if (result.data?.session_token && result.data?.member) {
        localStorage.setItem(LS_SESSION_KEY, result.data.session_token);
        setMember(result.data.member as TeamMember);
        resetActivity();
        return { error: null };
      }
      return { error: 'Unexpected response from server' };
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  };

  const signOut = async () => {
    await performSignOut();
  };

  const hasPermission = (key: string): boolean => {
    if (!member) return false;
    return member.permissions.includes(key);
  };

  return (
    <TeamAuthContext.Provider value={{ member, loading, signIn, signOut, hasPermission }}>
      {children}
    </TeamAuthContext.Provider>
  );
}

export function useTeamAuth() {
  const context = useContext(TeamAuthContext);
  if (!context) throw new Error('useTeamAuth must be used within TeamAuthProvider');
  return context;
}
