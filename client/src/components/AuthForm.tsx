import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getProviders,
  registerUser,
  signIn,
  verifyEmailOtp,
  resendVerificationEmailOtp,
} from "@/lib/mockAuth";
import { apiRequest } from "@/lib/api";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  MailCheck,
  RotateCw,
} from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [email, setEmail] = useState(searchParams.get("email") ?? "");

  // Email verification state
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    getProviders().then((data) => setGoogleAvailable("google" in data));
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");

    if (!/^\S+@\S+\.\S+$/.test(email))
      return setMessage({ type: "error", text: "Enter a valid email address." });
    if (password.length < 8)
      return setMessage({
        type: "error",
        text: "Password must be at least 8 characters.",
      });
    if (
      mode === "register" &&
      (!/[A-Z]/.test(password) || !/\d/.test(password))
    )
      return setMessage({
        type: "error",
        text: "Use at least one uppercase letter and one number.",
      });

    setLoading(true);
    try {
      if (mode === "register") {
        const name = String(data.get("name") ?? "").trim();
        const regRes = await registerUser(name, email, password);
        if (!regRes.ok) throw new Error(regRes.error ?? "Registration failed.");

        if (regRes.requiresVerification) {
          setVerifyingEmail(true);
          setResendCooldown(60);
          setMessage({
            type: "success",
            text: "Account registered! Please enter the 6-digit OTP code sent to your email.",
          });
          return;
        }
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result.ok) {
        if (result.requiresVerification) {
          setVerifyingEmail(true);
          setResendCooldown(60);
          setMessage({
            type: "error",
            text: "Please verify your email address. A fresh 6-digit OTP code was sent to your email.",
          });
          return;
        }
        throw new Error(result.error ?? "Email or password is incorrect.");
      }

      setMessage({
        type: "success",
        text: mode === "register" ? "Account created. Welcome to Streamly!" : "Welcome back!",
      });

      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail === "demo@streamly.com" || cleanEmail === "admin@streamly.com") {
        setTimeout(() => navigate("/browse"), 200);
      } else {
        try {
          const res = await apiRequest<{ data: { subscription: { status: string; currentPeriodEnd: string | null } } }>("/payments/subscription");
          const sub = res?.data?.subscription;
          if (sub?.status === "active" && sub.currentPeriodEnd && new Date(sub.currentPeriodEnd).getTime() > Date.now()) {
            setTimeout(() => navigate("/browse"), 200);
          } else {
            setTimeout(() => navigate("/plans", { state: { required: true } }), 200);
          }
        } catch {
          setTimeout(() => navigate("/plans", { state: { required: true } }), 200);
        }
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (otpCode.length !== 6) {
      setMessage({ type: "error", text: "Please enter the complete 6-digit verification OTP." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await verifyEmailOtp(email, otpCode);
      if (!res.ok) throw new Error(res.error ?? "Verification failed.");

      setMessage({
        type: "success",
        text: "Email verified successfully! Welcome to Streamly.",
      });

      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail === "demo@streamly.com" || cleanEmail === "admin@streamly.com") {
        setTimeout(() => navigate("/browse"), 200);
      } else {
        setTimeout(() => navigate("/plans", { state: { required: true } }), 200);
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Invalid verification code.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setMessage(null);
    try {
      const res = await resendVerificationEmailOtp(email);
      if (!res.ok) throw new Error(res.error ?? "Failed to resend OTP.");
      setResendCooldown(60);
      setMessage({
        type: "success",
        text: res.message || "A fresh 6-digit OTP code has been dispatched to your inbox.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to resend verification OTP.",
      });
    } finally {
      setIsResending(false);
    }
  }

  async function handleGoogleSignIn() {
    if (googleLoading) return;
    setMessage(null);
    setGoogleLoading(true);
    try {
      const result = await signIn("google", { callbackUrl: "/browse" });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error ?? "Google Sign-In failed." });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Google Sign-In failed.",
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  // ── Render OTP Verification Step ──────────────────────────────────────────
  if (verifyingEmail) {
    return (
      <div className="w-full max-w-[450px] rounded-md bg-black/85 px-6 py-9 shadow-2xl backdrop-blur-md sm:px-14 sm:py-12 border border-white/10">
        <div className="flex flex-col items-center text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-red-950/60 border border-red-500/30 text-[#e50914] shadow-lg mb-4">
            <MailCheck className="size-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Verify Email</h1>
          <p className="mt-2 text-xs text-[#aaa] leading-relaxed">
            We sent a 6-digit verification OTP to <br />
            <strong className="text-white">{email}</strong>
          </p>
        </div>

        {message && (
          <div
            role="alert"
            className={`mt-5 flex items-start gap-2 rounded border px-3 py-2.5 text-xs ${
              message.type === "error"
                ? "border-red-500/40 bg-red-950/50 text-red-100"
                : "border-emerald-500/40 bg-emerald-950/50 text-emerald-100"
            }`}
          >
            {message.type === "error" ? (
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2 text-center">
              Enter 6-Digit OTP Code
            </label>
            <input
              type="text"
              maxLength={6}
              pattern="\d{6}"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              autoFocus
              required
              className="w-full text-center text-2xl tracking-[0.4em] font-mono rounded-xl border border-white/20 bg-black/60 px-4 py-3 text-white outline-none focus:border-[#e50914] focus:ring-2 focus:ring-[#e50914]/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="flex w-full items-center justify-center rounded-xl bg-[#e50914] py-3 text-sm font-semibold hover:bg-[#c80710] shadow-md shadow-red-950 disabled:opacity-50 transition-all"
          >
            {loading && <LoaderCircle className="mr-2 size-4 animate-spin" />}
            Verify & Complete Sign Up
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3 border-t border-white/10 pt-4 text-xs text-[#888]">
          <div className="flex items-center gap-1.5">
            <span>Didn't receive the OTP?</span>
            <button
              type="button"
              disabled={resendCooldown > 0 || isResending}
              onClick={handleResendOtp}
              className="font-semibold text-white hover:text-[#e50914] disabled:opacity-50 transition-colors inline-flex items-center gap-1"
            >
              {isResending && <RotateCw className="size-3 animate-spin" />}
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setVerifyingEmail(false);
              setMessage(null);
            }}
            className="text-[#666] hover:text-white transition-colors"
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[450px] rounded-md bg-black/80 px-6 py-9 shadow-2xl backdrop-blur-sm sm:px-14 sm:py-12">
      <h1 className="text-3xl font-bold">
        {mode === "login" ? "Sign In" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-[#aaa]">
        {mode === "login"
          ? "Welcome back. Your next story awaits."
          : "Unlimited entertainment starts here."}
      </p>

      {message && (
        <div
          role="alert"
          className={`mt-5 flex items-start gap-2 rounded border px-3 py-2.5 text-sm ${
            message.type === "error"
              ? "border-red-500/40 bg-red-950/50 text-red-100"
              : "border-emerald-500/40 bg-emerald-950/50 text-emerald-100"
          }`}
        >
          {message.type === "error" ? (
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "register" && (
          <label className="block">
            <span className="sr-only">Name</span>
            <input
              name="name"
              required
              minLength={2}
              autoComplete="name"
              placeholder="Full name"
              className="w-full rounded border border-white/25 bg-[#161616]/80 px-4 py-4 text-sm outline-none focus:border-white focus:ring-2 focus:ring-white/20"
            />
          </label>
        )}
        <label className="block">
          <span className="sr-only">Email address</span>
          <input
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            autoComplete="email"
            placeholder="Email address"
            className="w-full rounded border border-white/25 bg-[#161616]/80 px-4 py-4 text-sm outline-none focus:border-white focus:ring-2 focus:ring-white/20"
          />
        </label>
        <label className="relative block">
          <span className="sr-only">Password</span>
          <input
            name="password"
            required
            minLength={8}
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="Password"
            className="w-full rounded border border-white/25 bg-[#161616]/80 px-4 py-4 pr-12 text-sm outline-none focus:border-white focus:ring-2 focus:ring-white/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#aaa] hover:text-white"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-5" />
            ) : (
              <Eye className="size-5" />
            )}
          </button>
        </label>
        {mode === "register" && (
          <p className="text-xs leading-relaxed text-[#999]">
            At least 8 characters with one uppercase letter and one number.
          </p>
        )}
        <button
          disabled={loading}
          className="flex w-full items-center justify-center rounded bg-[#e50914] py-3 font-semibold hover:bg-[#c80710] disabled:opacity-60"
        >
          {loading && <LoaderCircle className="mr-2 size-4 animate-spin" />}
          {mode === "login" ? "Sign In" : "Get Started"}
        </button>
        {mode === "login" && (
          <div className="flex items-center justify-between text-xs text-[#aaa]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="remember"
                defaultChecked
                className="accent-[#e50914]"
              />
              Remember me
            </label>
            <Link to="#" className="hover:text-white hover:underline">
              Need help?
            </Link>
          </div>
        )}
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-[#777]">
        <span className="h-px flex-1 bg-white/15" />
        OR
        <span className="h-px flex-1 bg-white/15" />
      </div>

      {/* Google Sign-In Button */}
      {googleAvailable ? (
        <button
          id="google-signin-btn"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded border border-white/25 bg-white px-4 py-3 text-sm font-semibold text-[#171717] hover:bg-[#e8e8e8] disabled:opacity-60"
        >
          {googleLoading ? (
            <LoaderCircle className="size-5 animate-spin text-[#555]" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.24 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z"/>
              <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.15A11 11 0 0 0 1 12c0 1.77.42 3.44 1.15 4.93l3.69-2.84Z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.55 4.21 1.64l3.15-3.15A10.55 10.55 0 0 0 12 1 11 11 0 0 0 2.15 7.07l3.69 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/>
            </svg>
          )}
          {googleLoading ? "Connecting to Google…" : "Continue with Google"}
        </button>
      ) : (
        <div className="rounded border border-white/10 bg-white/5 px-4 py-3 text-center text-xs text-[#666]">
          Google Sign-In unavailable —{" "}
          <span className="font-mono text-[#888]">VITE_GOOGLE_CLIENT_ID</span> not configured
        </div>
      )}

      <p className="mt-7 text-sm text-[#aaa]">
        {mode === "login" ? "New to Streamly?" : "Already have an account?"}{" "}
        <Link
          to={mode === "login" ? "/register" : "/login"}
          className="font-semibold text-white hover:underline"
        >
          {mode === "login" ? "Sign up now" : "Sign in"}
        </Link>
      </p>
      <p className="mt-5 text-[11px] leading-relaxed text-[#777]">
        Protected by modern security controls. By continuing, you agree to our
        Terms of Use and Privacy Statement.
      </p>
    </div>
  );
}
