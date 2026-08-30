/**
 * mockAuth.tsx
 * Production-quality client-side authentication shim.
 * - Stores sessions in sessionStorage / localStorage with backend priority
 * - Wires real Google OAuth via GIS SDK → backend /auth/google
 * - Provides signOut, getProviders, useSession hook
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest, setSessionFlag, hasSession, setStoredToken } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    role?: "user" | "admin" | string;
    image?: string;
    subscription?: {
      status: string;
      planId: string;
      planName?: string;
      currentPeriodEnd?: string | null;
    };
  };
}

interface SessionState {
  data: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

interface SessionContextValue extends SessionState {
  update: () => void;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const SESSION_KEY = "streamly_session";

function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null) {
  if (session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

// ─── Google GIS helpers ───────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

/** Returns true when a real Google Client ID is configured */
function isGoogleConfigured(): boolean {
  return (
    !!GOOGLE_CLIENT_ID &&
    !GOOGLE_CLIENT_ID.startsWith("your_google_client_id") &&
    GOOGLE_CLIENT_ID.includes(".apps.googleusercontent.com")
  );
}

/**
 * Opens the Google Sign-In popup and returns the credential (idToken).
 * Uses the GIS `google.accounts.id` API loaded by the script in index.html.
 */
function openGooglePopup(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Type declarations for the GIS SDK on window
    const gAccounts = (window as unknown as {
      google?: {
        accounts: {
          id: {
            initialize: (cfg: object) => void;
            prompt: (cb?: (notification: { isNotDisplayed(): boolean; isSkippedMoment(): boolean }) => void) => void;
            renderButton: (el: HTMLElement, opts: object) => void;
            cancel: () => void;
          };
          oauth2: {
            initTokenClient: (cfg: object) => { requestAccessToken: () => void };
          };
        };
      };
    }).google;

    if (!gAccounts) {
      reject(new Error("Google Identity Services script not yet loaded. Please try again in a moment."));
      return;
    }

    // Create a hidden container for the GIS button (GIS needs it to power the popup)
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none";
    document.body.appendChild(container);

    let resolved = false;

    gAccounts.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential?: string; error?: string }) => {
        document.body.removeChild(container);
        if (response.credential) {
          resolved = true;
          resolve(response.credential);
        } else {
          reject(new Error(response.error ?? "Google Sign-In was cancelled or failed."));
        }
      },
      ux_mode: "popup",
      cancel_on_tap_outside: false,
    });

    // Render a hidden button then programmatically click it to trigger the popup
    gAccounts.accounts.id.renderButton(container, {
      type: "standard",
      size: "large",
    });

    const btn = container.querySelector("div[role=button]") as HTMLElement | null;
    if (btn) {
      btn.click();
    } else {
      // Fallback to prompt (shows One Tap or FedCM dialog)
      gAccounts.accounts.id.prompt((notification) => {
        if (!resolved && (notification.isNotDisplayed() || notification.isSkippedMoment())) {
          document.body.removeChild(container);
          reject(new Error("Google Sign-In prompt was blocked or dismissed. Please allow popups and try again."));
        }
      });
    }
  });
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue>({
  data: null,
  status: "loading",
  update: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const initialSession = getSession();
  const [state, setState] = useState<SessionState>({
    data: initialSession,
    // SEC-1: Use hasSession() flag (boolean localStorage hint) instead of raw token check
    status: initialSession ? "authenticated" : hasSession() ? "loading" : "unauthenticated",
  });

  const refresh = useCallback(async () => {
    // Try backend /auth/me check if we have a session indicator
    if (hasSession()) {
      try {
        const res = await apiRequest<{
          data: { user: { id: string; name: string; email: string; avatar?: string; subscription?: Session["user"]["subscription"] } };
        }>("/auth/me");
        const session: Session = {
          user: {
            id: res.data.user.id,
            name: res.data.user.name,
            email: res.data.user.email,
            image: res.data.user.avatar,
            subscription: res.data.user.subscription,
          },
        };
        saveSession(session);
        setState({ data: session, status: "authenticated" });
        return;
      } catch {
        // Token invalid or server offline — fall through to session/local storage
        setSessionFlag(false);
      }
    }

    const session = getSession();
    setState({
      data: session,
      status: session ? "authenticated" : "unauthenticated",
    });
  }, []);

  useEffect(() => {
    refresh();

    const handleSessionChange = () => refresh();
    window.addEventListener("streamly:session-change", handleSessionChange);
    window.addEventListener("storage", handleSessionChange);

    return () => {
      window.removeEventListener("streamly:session-change", handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
    };
  }, [refresh]);

  const value = useMemo<SessionContextValue>(
    () => ({ ...state, update: refresh }),
    [state, refresh]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}

export type SignInResult =
  | { ok: true; error: null }
  | { ok: false; error: string; requiresVerification?: boolean; email?: string };

/**
 * signIn("credentials", { email, password }) — email/password auth
 * signIn("google") — Google OAuth via GIS SDK → backend /auth/google
 */
export async function signIn(
  provider: string,
  options?: {
    email?: string;
    password?: string;
    redirect?: boolean;
    callbackUrl?: string;
  }
): Promise<SignInResult> {
  // ── Google OAuth ──────────────────────────────────────────────────────────
  if (provider === "google") {
    if (!isGoogleConfigured()) {
      return {
        ok: false,
        error: "Google Sign-In is not configured. Add VITE_GOOGLE_CLIENT_ID to client/.env",
      };
    }

    try {
      // Get id_token from Google's popup
      const idToken = await openGooglePopup();

      // Send to backend for verification and session creation
      const res = await apiRequest<{
        token: string;
        data: { user: { id: string; name: string; email: string; avatar?: string; subscription?: Session["user"]["subscription"] } };
      }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });

      if (res.token) {
        setStoredToken(res.token);
      }
      setSessionFlag(true);
      const session: Session = {
        user: {
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          image: res.data.user.avatar,
          subscription: res.data.user.subscription,
        },
      };
      saveSession(session);
      window.dispatchEvent(new Event("streamly:session-change"));

      // Navigate to callbackUrl if provided
      if (options?.callbackUrl) {
        window.location.href = options.callbackUrl;
      }

      return { ok: true, error: null };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Google Sign-In failed.",
      };
    }
  }

  // ── Credentials (email + password) ───────────────────────────────────────
  if (provider !== "credentials") {
    return {
      ok: false,
      error: `${provider} sign-in is not supported.`,
    };
  }

  const { email = "", password = "" } = options ?? {};

  // 1. Backend Authentication
  try {
    const res = await apiRequest<{
      token?: string;
      data: { user: { id: string; name: string; email: string; role?: string; avatar?: string; subscription?: Session["user"]["subscription"] } };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.token) {
      setStoredToken(res.token);
    }
    setSessionFlag(true);
    const session: Session = {
      user: {
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role || (res.data.user.email === "admin@streamly.com" ? "admin" : "user"),
        image: res.data.user.avatar,
        subscription: res.data.user.subscription,
      },
    };
    saveSession(session);
    window.dispatchEvent(new Event("streamly:session-change"));
    return { ok: true, error: null };
  } catch (backendError) {
    if (backendError instanceof Error) {
      if (backendError.message.toLowerCase().includes("verify your email")) {
        return { ok: false, error: backendError.message, requiresVerification: true, email };
      }
      return { ok: false, error: backendError.message };
    }
    return { ok: false, error: "Invalid email or password." };
  }
}

/**
 * verifyEmailOtp — verifies 6-digit registration OTP code and logs user in
 */
export async function verifyEmailOtp(
  email: string,
  otp: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await apiRequest<{
      status: string;
      message: string;
      token?: string;
      data: { user: { id: string; name: string; email: string; avatar?: string; subscription?: Session["user"]["subscription"] } };
    }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });

    if (res.token) {
      setStoredToken(res.token);
    }
    setSessionFlag(true);
    const session: Session = {
      user: {
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        image: res.data.user.avatar,
        subscription: res.data.user.subscription,
      },
    };
    saveSession(session);
    window.dispatchEvent(new Event("streamly:session-change"));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Verification failed. Invalid or expired OTP.",
    };
  }
}

/**
 * resendVerificationEmailOtp — triggers fresh 6-digit OTP code dispatch
 */
export async function resendVerificationEmailOtp(
  email: string
): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const res = await apiRequest<{ message: string }>("/auth/resend-verification-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { ok: true, message: res.message || "A new 6-digit OTP code has been sent." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to resend verification OTP.",
    };
  }
}

/**
 * registerUser — creates a new account via live backend API.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ ok: boolean; requiresVerification?: boolean; email?: string; error?: string }> {
  try {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { email: string; requiresVerification: boolean };
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    if (res?.data?.requiresVerification) {
      return { ok: true, requiresVerification: true, email: res.data.email };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Registration failed.",
    };
  }
}

/**
 * signOut — clears current session, tokens, and cookies via backend.
 */
export async function signOut(options?: { callbackUrl?: string }) {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch {
    // Ignore server error on logout
  }
  setStoredToken(null);
  setSessionFlag(false);
  saveSession(null);
  window.dispatchEvent(new Event("streamly:session-change"));
  window.location.href = options?.callbackUrl ?? "/";
}

/**
 * getProviders — returns available OAuth providers based on configuration.
 * Used by AuthForm to decide which buttons to enable.
 */
export async function getProviders(): Promise<Record<string, unknown>> {
  const providers: Record<string, unknown> = {};
  if (isGoogleConfigured()) {
    providers.google = { name: "Google", type: "oauth" };
  }
  return providers;
}
