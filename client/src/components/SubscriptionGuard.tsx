import { useEffect, useState, useRef, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSession } from "@/lib/mockAuth";
import { apiRequest } from "@/lib/api";

interface SubscriptionCheckResult {
  status: string;
  planId: string;
  currentPeriodEnd: string | null;
}

// Global in-memory cache across route transitions
interface SubCacheEntry {
  userId: string;
  isValid: boolean;
  checkedAt: number;
}

let memoryCache: SubCacheEntry | null = null;

const CACHE_KEY = "streamly_sub_cache_v2";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh cache

export function updateSubscriptionCache(email: string, isValid: boolean) {
  const cleanEmail = email.toLowerCase().trim();
  memoryCache = {
    userId: cleanEmail,
    isValid,
    checkedAt: Date.now(),
  };
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
  } catch {}
}

export function clearSubscriptionCache() {
  memoryCache = null;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

function checkSynchronousValidity(
  email: string,
  sessionSub?: { status?: string; currentPeriodEnd?: string | null }
): boolean | null {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();

  // 1. Instant pass for Demo user or Admin
  if (cleanEmail === "demo@streamly.com" || cleanEmail === "admin@streamly.com") {
    return true;
  }

  // 2. Check in-memory cache
  if (memoryCache && memoryCache.userId === cleanEmail) {
    if (Date.now() - memoryCache.checkedAt < CACHE_TTL_MS) {
      return memoryCache.isValid;
    }
  }

  // 3. Check sessionStorage cache
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed: SubCacheEntry = JSON.parse(raw);
      if (parsed.userId === cleanEmail && Date.now() - parsed.checkedAt < CACHE_TTL_MS) {
        memoryCache = parsed;
        return parsed.isValid;
      }
    }
  } catch {}

  // 4. Check session user subscription object if provided
  if (sessionSub?.status === "active" && sessionSub.currentPeriodEnd) {
    const isValid = new Date(sessionSub.currentPeriodEnd).getTime() > Date.now();
    if (isValid) {
      updateSubscriptionCache(cleanEmail, true);
      return true;
    }
  }

  return null;
}

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, status: authStatus } = useSession();

  const userEmail = session?.user?.email?.toLowerCase().trim() || "";
  const isDemoOrAdmin =
    userEmail === "demo@streamly.com" ||
    userEmail === "admin@streamly.com" ||
    session?.user?.role === "admin";

  // Initial state is computed SYNCHRONOUSLY — 0ms render without buffering
  const [isSubValid, setIsSubValid] = useState<boolean>(() => {
    if (isDemoOrAdmin) return true;
    const sync = checkSynchronousValidity(userEmail, session?.user?.subscription);
    return sync === true;
  });

  const [isChecking, setIsChecking] = useState<boolean>(() => {
    if (isDemoOrAdmin) return false;
    const sync = checkSynchronousValidity(userEmail, session?.user?.subscription);
    return sync === null;
  });

  const inFlightRef = useRef(false);

  useEffect(() => {
    // 1. Auth check
    if (authStatus === "unauthenticated") {
      navigate("/login", { replace: true, state: { from: location.pathname } });
      return;
    }

    if (authStatus === "loading" || !userEmail) return;

    if (isDemoOrAdmin) {
      setIsSubValid(true);
      setIsChecking(false);
      return;
    }

    // 2. If already valid and checked recently, skip network call completely
    if (memoryCache && memoryCache.userId === userEmail && Date.now() - memoryCache.checkedAt < 2 * 60 * 1000) {
      if (memoryCache.isValid) {
        setIsSubValid(true);
        setIsChecking(false);
        return;
      }
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    // 3. Silent background / initial verification
    let isMounted = true;
    apiRequest<{ data: { subscription: SubscriptionCheckResult } }>("/payments/subscription")
      .then((res) => {
        if (!isMounted) return;
        const sub = res?.data?.subscription;
        const valid =
          sub?.status === "active" &&
          !!sub?.currentPeriodEnd &&
          new Date(sub.currentPeriodEnd).getTime() > Date.now();

        updateSubscriptionCache(userEmail, valid);
        setIsSubValid(valid);
        setIsChecking(false);

        if (!valid) {
          const isExpired = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).getTime() <= Date.now() : false;
          navigate("/plans", {
            replace: true,
            state: {
              expired: isExpired,
              required: !isExpired,
              message: isExpired
                ? "Your subscription plan validity has expired. Please choose a plan to continue streaming."
                : "Please choose a subscription plan to unlock unlimited streaming.",
            },
          });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        // If network error, preserve cached valid session if available
        if (memoryCache?.userId === userEmail && memoryCache.isValid) {
          setIsSubValid(true);
          setIsChecking(false);
        } else {
          setIsSubValid(false);
          setIsChecking(false);
          navigate("/plans", {
            replace: true,
            state: {
              required: true,
              message: "Active subscription plan required to stream movies and series.",
            },
          });
        }
      })
      .finally(() => {
        inFlightRef.current = false;
      });

    return () => {
      isMounted = false;
    };
  }, [authStatus, userEmail, isDemoOrAdmin, navigate]);

  // If already valid (from synchronous cache), render children immediately (0ms delay)!
  if (isSubValid) {
    return <>{children}</>;
  }

  // Only show minimal spinner on first cold boot if completely unverified
  if (authStatus === "loading" || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="size-6 animate-spin rounded-full border-2 border-[#e50914] border-t-transparent" />
          <span className="text-[11px] text-gray-400 font-semibold tracking-wider uppercase">
            Loading Streamly...
          </span>
        </div>
      </div>
    );
  }

  return null;
}
