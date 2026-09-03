import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";

import { setAccessTokenProvider, setUnauthorizedHandler } from "../../lib/api";
import { clearOfflineData } from "../../lib/offline";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
type Session = { access_token: string; refresh_token: string; expires_at?: number; user: User };
type User = { id: string; email?: string };
// A session issued by one Supabase project is invalid in every other project.
// Namespacing prevents a localhost prototype from reusing a hosted session.
//
// Trade-off: the session lives in localStorage, so any successful XSS on this
// origin can read the tokens. That is accepted here because the app is an
// offline-first PWA that must restore a session without a cookie round-trip;
// the mitigation is a strict CSP and never rendering untrusted HTML.
const STORAGE_KEY = `resilience.auth.session.v1:${url ?? "unconfigured"}`;

/** Refresh this far ahead of expiry so in-flight requests never race the clock. */
const REFRESH_LEEWAY_MS = 5 * 60 * 1000;

type AuthValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signIn(email: string, password: string): Promise<string | null>;
  signUp(email: string, password: string): Promise<string | null>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(url && key));

  useEffect(() => {
    void (async () => {
      const stored = readStoredSession();
      const verified = stored ? await validateSession(stored) : null;
      if (verified) setSession(verified);
      else localStorage.removeItem(STORAGE_KEY);
      setLoading(false);
    })();
  }, []);

  const sessionRef = useRef<Session | null>(null);
  const refreshingRef = useRef<Promise<Session | null> | null>(null);
  sessionRef.current = session;

  useEffect(() => setAccessTokenProvider(async () => sessionRef.current?.access_token ?? null), []);

  // One refresh at a time: concurrent 401s share a single token exchange.
  const runRefresh = async (): Promise<Session | null> => {
    const current = sessionRef.current;
    if (!current?.refresh_token) return null;
    if (!refreshingRef.current) {
      refreshingRef.current = refreshSession(current.refresh_token).finally(() => {
        refreshingRef.current = null;
      });
    }
    const next = await refreshingRef.current;
    if (next) {
      storeSession(next);
      sessionRef.current = next;
      setSession(next);
    }
    return next;
  };

  // A 401 from any API call gets exactly one refresh-and-retry; a failed
  // refresh means the session is genuinely gone, so sign out locally.
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      if (await runRefresh()) return true;
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
      sessionRef.current = null;
      setSession(null);
      return false;
    });
    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh proactively, driven by the token's own expiry rather than a fixed
  // interval, so a short-lived token is never allowed to lapse mid-session.
  useEffect(() => {
    if (!session?.refresh_token) return;
    const expiresAtMs = session.expires_at ? session.expires_at * 1000 : Date.now();
    const delay = Math.min(Math.max(0, expiresAtMs - Date.now() - REFRESH_LEEWAY_MS), 2_147_483_000);
    const timer = window.setTimeout(() => { void runRefresh(); }, delay);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.refresh_token, session?.expires_at]);

  const value = useMemo<AuthValue>(() => ({
    configured: Boolean(url && key), loading, session, user: session?.user ?? null,
    async signIn(email, password) {
      const result = await authenticate("/auth/v1/token?grant_type=password", { email, password });
      if (!result) setSession(readStoredSession());
      return result;
    },
    async signUp(email, password) {
      if (!url || !key) return "Authentication is not configured.";
      const response = await fetch(`${url}/auth/v1/signup`, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password, options: { email_redirect_to: window.location.origin } }) });
      if (!response.ok) return (await response.json().catch(() => ({}))).msg ?? "Could not create account.";
      const payload = await response.json();
      if (payload.access_token) { storeSession(payload as Session); setSession(payload as Session); }
      return null;
    },
    async signOut() {
      const current = session;
      localStorage.removeItem(STORAGE_KEY);
      if (current?.user.id) await clearOfflineData(current.user.id);
      setSession(null);
      if (url && key && current?.access_token) {
        await fetch(`${url}/auth/v1/logout`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${current.access_token}` } }).catch(() => undefined);
      }
    },
  }), [loading, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

async function authenticate(path: string, body: object): Promise<string | null> {
  if (!url || !key) return "Authentication is not configured.";
  try {
    const response = await fetch(`${url}${path}`, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) return (await response.json().catch(() => ({}))).error_description ?? "Invalid email or password.";
    storeSession(await response.json() as Session);
    return null;
  } catch { return "Could not reach the authentication service."; }
}

function storeSession(session: Session) { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); }
function readStoredSession(): Session | null { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"); } catch { return null; } }

async function refreshSession(refreshToken: string): Promise<Session | null> {
  if (!url || !key) return null;
  try {
    const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: refreshToken }) });
    return response.ok ? await response.json() as Session : null;
  } catch { return null; }
}

async function validateSession(current: Session): Promise<Session | null> {
  if (!url || !key) return null;
  try {
    const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${current.access_token}` } });
    if (response.ok) return current;
    return await refreshSession(current.refresh_token);
  } catch {
    return null;
  }
}
