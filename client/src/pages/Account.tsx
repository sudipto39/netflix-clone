import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  KeyRound,
  Lock,
  Mail,
  Search,
  Shield,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/components/AppProvider";
import { useSession, signOut } from "@/lib/mockAuth";
import { apiRequest } from "@/lib/api";
import { PlanModal } from "@/components/PlanModal";
import { getPlanById } from "@/lib/plansStore";
import { StripePaymentModal, type SubscriptionData } from "@/components/StripePaymentModal";

interface SubscriptionState {
  email: string;
  name: string;
  subscription: {
    status: string;
    planId: string;
    planName: string;
    planSpecs: string;
    cardLast4: string;
    cardBrand: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
}

interface ParentalSettings {
  maturityLevel: string;
  pinRequired: boolean;
  pin: string;
}

const DEFAULT_PARENTAL: ParentalSettings = {
  maturityLevel: "All Maturity Ratings (18+)",
  pinRequired: false,
  pin: "",
};

export default function AccountPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const { profile, showToast } = useApp();

  const isDemo = session?.user?.email?.toLowerCase().trim() === "demo@streamly.com";

  const [subData, setSubData] = useState<SubscriptionState>({
    email: session?.user?.email || (isDemo ? "demo@streamly.com" : ""),
    name: session?.user?.name || (isDemo ? "Demo User" : ""),
    subscription: {
      status: "active",
      planId: "premium",
      planName: "PREMIUM",
      planSpecs: "Ultra HD 4K + HDR (4 Screens at once)",
      cardLast4: isDemo ? "4242" : "",
      cardBrand: isDemo ? "visa" : "",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    },
  });

  const [parental, setParental] = useState<ParentalSettings>(() => {
    try {
      const saved = localStorage.getItem("streamly-parental-controls");
      return saved ? JSON.parse(saved) : DEFAULT_PARENTAL;
    } catch {
      return DEFAULT_PARENTAL;
    }
  });

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const userKey = session?.user?.email?.toLowerCase().trim() || session?.user?.id || "default";
  const readNotifsKey = `streamly_read_notifs_${userKey}`;

  const INITIAL_ACCOUNT_NOTIFICATIONS = [
    {
      id: "n1",
      title: "New 4K Release",
      desc: "Dune: Part Two is now streaming in Ultra 4K HDR.",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: "n2",
      title: "Subscription Active",
      desc: "Your Ultra 4K HDR plan is active. Next renewal is on schedule.",
      time: "1 day ago",
      unread: true,
    },
    {
      id: "n3",
      title: "Trending Series",
      desc: "Stranger Things Season 5 is currently #1 worldwide.",
      time: "3 days ago",
      unread: false,
    },
    {
      id: "n4",
      title: "Security Notice",
      desc: "New login verified on Chrome (Windows).",
      time: "5 days ago",
      unread: false,
    },
  ];

  const [notifications, setNotifications] = useState(() => {
    try {
      const readIds = (JSON.parse(localStorage.getItem(readNotifsKey) || "[]") as string[]) || [];
      return INITIAL_ACCOUNT_NOTIFICATIONS.map((n) => ({
        ...n,
        unread: readIds.includes(n.id) ? false : n.unread,
      }));
    } catch {
      return INITIAL_ACCOUNT_NOTIFICATIONS;
    }
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleToggleNotifications = () => {
    const nextState = !notifOpen;
    setNotifOpen(nextState);
    setMenuOpen(false);

    if (nextState && unreadCount > 0) {
      setNotifications((prev) => {
        const updated = prev.map((n) => ({ ...n, unread: false }));
        try {
          const allIds = updated.map((n) => n.id);
          localStorage.setItem(readNotifsKey, JSON.stringify(allIds));
        } catch { /* ignore */ }
        return updated;
      });

      try {
        apiRequest("/notifications/mark-all-read", { method: "PATCH" }).catch(() => {});
      } catch { /* ignore */ }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, unread: false }));
      try {
        const allIds = updated.map((n) => n.id);
        localStorage.setItem(readNotifsKey, JSON.stringify(allIds));
      } catch { /* ignore */ }
      return updated;
    });
    try {
      apiRequest("/notifications/mark-all-read", { method: "PATCH" }).catch(() => {});
    } catch { /* ignore */ }
  };

  // Close search bar on outside click only if there's no text entered
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        searchOpen &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        if (!searchQuery.trim()) {
          setSearchOpen(false);
        }
      }
    };

    if (searchOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [searchOpen, searchQuery]);

  // Form States for Email/Password Modals
  const [newEmail, setNewEmail] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // BUG-4: Start with empty array — populated from real /payments/invoices API response
  const [invoices, setInvoices] = useState<Array<{ id: string; date: string; description: string; amount: string; status: string; card: string }>>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

  useEffect(() => {
    // Fetch live subscription status from API
    // CLIENT-SIDE GUARD: Strip any mock card data for non-demo accounts
    const userEmail = session?.user?.email?.toLowerCase().trim() ?? "";
    const isExactDemo = userEmail === "demo@streamly.com";

    apiRequest<{ data: SubscriptionState }>("/payments/subscription")
      .then((res) => {
        if (res.data) {
          const safeData = { ...res.data };
          if (!isExactDemo) {
            // For all non-demo accounts: always clear card details
            // regardless of what the server sends (guards against stale server code)
            safeData.subscription = {
              ...safeData.subscription,
              cardLast4: "",
              cardBrand: "",
            };
          }
          setSubData(safeData);
        }
      })
      .catch(() => {
        // Fallback to local session defaults
      });

    // Fetch live billing invoices from API
    // CLIENT-SIDE GUARD: Even if the server sends invoices, only render them
    // for the exact demo account. All other users must see an empty history.

    apiRequest<{ data: { invoices: typeof invoices } }>("/payments/invoices")
      .then((res) => {
        if (res?.data?.invoices && isExactDemo) {
          // Only demo account can see mock/real invoices from API
          setInvoices(res.data.invoices);
        }
        // All other accounts always stay at empty array — no billing history shown
      })
      .catch(() => { /* invoices remain empty — no fake data fallback */ })
      .finally(() => setInvoicesLoading(false));
  }, []);

  async function handlePlanChange(planId: string) {
    try {
      const res = await apiRequest<{ data: { subscription: SubscriptionState["subscription"] } }>(
        "/payments/change-plan",
        {
          method: "POST",
          body: JSON.stringify({ planId }),
        }
      );
      if (res.data?.subscription) {
        setSubData((prev) => ({ ...prev, subscription: res.data.subscription }));
      }
    } catch {
      // Local fallback update
      const plan = getPlanById(planId);
      if (plan) {
        setSubData((prev) => ({
          ...prev,
          subscription: {
            ...prev.subscription,
            planId: plan.id,
            planName: plan.name.toUpperCase(),
            planSpecs: `${plan.resolution} (${plan.screens})`,
          },
        }));
      }
    }
  }

  async function handleEmailUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setModalMessage(null);
    try {
      await apiRequest("/payments/update-credentials", {
        method: "POST",
        body: JSON.stringify({ email: newEmail }),
      });
      setSubData((prev) => ({ ...prev, email: newEmail }));
      setShowEmailModal(false);
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : "Failed to update email.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setModalMessage(null);
    try {
      await apiRequest("/payments/update-credentials", {
        method: "POST",
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      setShowPasswordModal(false);
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  // MF-3: Cancel subscription handler
  async function handleCancelSubscription() {
    if (!window.confirm(
      "Are you sure you want to cancel your subscription? You will still have access until the end of your current billing period."
    )) return;

    setCancelingSubscription(true);
    try {
      await apiRequest("/payments/cancel-subscription", { method: "POST" });
      setSubData((prev) => ({
        ...prev,
        subscription: { ...prev.subscription, cancelAtPeriodEnd: true },
      }));
      showToast("Subscription scheduled for cancellation at end of billing period.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to cancel subscription.", "error");
    } finally {
      setCancelingSubscription(false);
    }
  }

  const formattedDate = new Date(subData.subscription.currentPeriodEnd).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/90 px-6 py-4 backdrop-blur-md sm:px-12">
        <div className="flex items-center gap-8">
          <Logo href="/browse" />
          <nav className="hidden items-center gap-5 text-sm text-[#ccc] md:flex">
            <Link to="/browse" className="hover:text-white">Home</Link>
            <Link to="/browse?type=tv" className="hover:text-white">TV Shows</Link>
            <Link to="/browse?type=movie" className="hover:text-white">Movies</Link>
            <Link to="/browse" className="hover:text-white">New & Popular</Link>
            <Link to="/browse#mylist" className="hover:text-white">My List</Link>
          </nav>
        </div>

        <div className="flex items-center gap-5 text-white">
          {/* Functional Search Toggle */}
          <div ref={searchContainerRef} className="relative flex items-center">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                  placeholder="Titles, people, genres"
                  className="w-44 sm:w-64 rounded-full border-2 border-[#e50914] bg-black/90 px-4 py-1.5 text-xs text-white placeholder-[#888] outline-none shadow-[0_0_18px_rgba(229,9,20,0.5)] ring-1 ring-[#e50914]/50 search-glow-enter focus:border-[#e50914]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="ml-1.5 grid size-7 place-items-center rounded-full text-red-400 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Close search"
                >
                  <X className="size-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="text-[#ccc] hover:text-white transition-colors"
                title="Search catalog"
              >
                <Search className="size-5" />
              </button>
            )}
          </div>

          {/* Functional Notifications Bell with Popover */}
          <div className="relative">
            <button
              onClick={handleToggleNotifications}
              aria-label="Notifications"
              className="relative text-[#ccc] hover:text-white transition-colors focus:outline-none"
              title="Notifications"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-2.5 items-center justify-center rounded-full bg-[#e50914] text-[8px] font-bold ring-2 ring-black" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-9 z-50 w-80 sm:w-96 rounded-xl border border-white/15 bg-black/95 p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-[#e50914] px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] font-medium text-[#aaa] hover:text-white transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto divide-y divide-white/5 pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`pt-2.5 pb-2 transition-colors rounded px-2 ${
                        n.unread ? "bg-white/[0.04]" : "opacity-75"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-white">{n.title}</p>
                        <span className="text-[10px] text-[#777] shrink-0">{n.time}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#bbb] leading-relaxed">{n.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 border-t border-white/10 pt-2 text-center">
                  <Link
                    to="/browse"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs font-semibold text-[#e50914] hover:underline"
                  >
                    Explore trending releases
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 focus:outline-none"
            >
              <div
                style={{ background: profile?.avatar || "linear-gradient(135deg,#0072d2,#62d5ff)" }}
                className="grid size-8 place-items-center rounded bg-blue-600 font-bold text-white shadow"
              >
                {profile?.name?.charAt(0) || "A"}
              </div>
              <ChevronDown className="size-4 text-[#aaa]" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 w-48 rounded border border-white/15 bg-black/95 py-2 shadow-2xl backdrop-blur-md">
                <Link
                  to="/profiles"
                  className="block px-4 py-2 text-sm text-[#ccc] hover:bg-white/10 hover:text-white"
                >
                  Switch Profiles
                </Link>
                <Link
                  to="/account"
                  className="block px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Account Settings
                </Link>
                <hr className="my-1 border-white/10" />
                <button
                  onClick={() => signOut()}
                  className="w-full text-left px-4 py-2 text-sm text-[#ccc] hover:bg-white/10 hover:text-white"
                >
                  Sign Out of Streamly
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Account</h1>
        <hr className="my-5 border-white/15" />

        {/* ── MEMBERSHIP & BILLING ── */}
        <div className="rounded-xl border border-white/10 bg-[#181818] p-6 shadow-xl sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#aaa]">
            <Shield className="size-4 text-[#e50914]" />
            <span>MEMBERSHIP & BILLING</span>
          </div>

          <div className="mt-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-base font-semibold text-white">{subData.email}</p>
              <p className="mt-1 text-sm text-[#aaa]">Password: ••••••••••••</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEmailModal(true)}
                className="rounded border border-white/20 bg-[#262626] px-4 py-2 text-xs font-semibold text-white hover:bg-[#333]"
              >
                Change Email
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="rounded border border-white/20 bg-[#262626] px-4 py-2 text-xs font-semibold text-white hover:bg-[#333]"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Payment Method / Credit Card Row */}
          <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className={`grid size-10 place-items-center rounded ${subData.subscription.cardLast4 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-white/5 text-[#888]'}`}>
                <CreditCard className="size-6" />
              </div>
              <div>
                {subData.subscription.cardLast4 ? (
                  <>
                    <p className="text-base font-bold tracking-wider text-white">
                      {(subData.subscription.cardBrand || 'Card').toUpperCase()} •••• {subData.subscription.cardLast4}
                    </p>
                    <p className="mt-0.5 text-xs text-[#aaa]">
                      Your next billing date is {formattedDate}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-bold text-[#aaa]">
                      No payment method on file
                    </p>
                    <p className="mt-0.5 text-xs text-[#666]">
                      Add a payment method to manage your subscription.
                    </p>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="rounded bg-[#e50914] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#c80710]"
            >
              {subData.subscription.cardLast4 ? "Manage Payment Info" : "Add Payment Method"}
            </button>
          </div>
        </div>

        {/* ── PLAN DETAILS ── */}
        <div className="mt-6 rounded-xl border border-white/10 bg-[#181818] p-6 shadow-xl sm:p-8">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-[#aaa]">PLAN DETAILS</p>
            {subData.subscription.status === "active" && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Membership
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="rounded bg-[#e50914] px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white">
                {subData.subscription.planName}
              </span>
              <p className="text-base font-bold text-white">{subData.subscription.planSpecs}</p>
            </div>

            <div className="flex items-center gap-3">
              {subData.subscription.status === "active" ? (
                <>
                  <button
                    onClick={() => setShowPlanModal(true)}
                    className="rounded border border-white/20 bg-[#262626] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#333]"
                  >
                    Change Plan
                  </button>
                  {/* MF-3: Cancel subscription button */}
                  {!subData.subscription.cancelAtPeriodEnd ? (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={cancelingSubscription}
                      className="rounded border border-red-700/60 bg-transparent px-5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-950/40 disabled:opacity-50"
                    >
                      {cancelingSubscription ? "Canceling..." : "Cancel Subscription"}
                    </button>
                  ) : (
                    <span className="rounded border border-yellow-700/50 bg-yellow-950/30 px-4 py-2 text-xs font-semibold text-yellow-400">
                      Cancels on {formattedDate}
                    </span>
                  )}
                </>
              ) : (
                <button
                  onClick={() => navigate("/plans", { state: { required: true } })}
                  className="rounded bg-[#e50914] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c80710] shadow-[0_0_15px_rgba(229,9,20,0.5)] transition"
                >
                  Choose / Renew Plan in INR (₹)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── PROFILES & PARENTAL CONTROLS ── */}
        <div className="mt-6 rounded-xl border border-white/10 bg-[#181818] p-6 shadow-xl sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#aaa]">
              <Lock className="size-4 text-[#e50914]" />
              <span>PROFILES & PARENTAL CONTROLS</span>
            </div>
            <button
              onClick={() => navigate("/profiles")}
              className="flex items-center gap-1 text-xs font-semibold text-[#aaa] hover:text-white"
            >
              Switch Profile <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mt-6 flex flex-col justify-between gap-6 border-b border-white/10 pb-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div
                style={{ background: profile?.avatar || "linear-gradient(135deg,#0072d2,#62d5ff)" }}
                className="grid size-14 place-items-center rounded-xl bg-blue-600 text-xl font-black text-white shadow-lg"
              >
                {(profile?.name || session?.user?.name || "P").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {profile?.name || session?.user?.name || "Primary Profile"}
                </p>
                <p className="text-xs text-[#888]">
                  {parental.maturityLevel} • PIN Lock: {parental.pinRequired ? "Active" : "Off"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  const newPinReq = !parental.pinRequired;
                  const updated = { ...parental, pinRequired: newPinReq };
                  setParental(updated);
                  localStorage.setItem("streamly-parental-controls", JSON.stringify(updated));
                  showToast(
                    newPinReq ? "Profile PIN lock enabled." : "Profile PIN lock disabled.",
                    "success"
                  );
                }}
                className={`rounded border px-4 py-2 text-xs font-semibold transition ${
                  parental.pinRequired
                    ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40"
                    : "border-white/20 bg-[#262626] text-white hover:bg-[#333]"
                }`}
              >
                {parental.pinRequired ? "PIN Lock: ON" : "Enable PIN Lock"}
              </button>

              <button
                onClick={() => setShowPinModal(true)}
                className="rounded border border-white/20 bg-[#262626] px-4 py-2 text-xs font-semibold text-white hover:bg-[#333]"
              >
                Change PIN
              </button>
            </div>
          </div>

          {/* Maturity Restrictions Selector */}
          <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-white">Viewing Restrictions</p>
              <p className="mt-0.5 text-xs text-[#888]">
                Titles with maturity ratings above this will require your PIN to watch.
              </p>
            </div>

            <select
              value={parental.maturityLevel}
              onChange={(e) => {
                const updated = { ...parental, maturityLevel: e.target.value };
                setParental(updated);
                localStorage.setItem("streamly-parental-controls", JSON.stringify(updated));
                showToast(`Viewing restrictions set to: ${e.target.value}`, "info");
              }}
              className="rounded-lg border border-white/20 bg-[#262626] px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-[#e50914]"
            >
              <option value="All Maturity Ratings (18+)">All Maturity Ratings (18+)</option>
              <option value="16+ (Teens & Mature)">16+ (Teens & Mature)</option>
              <option value="13+ (PG-13 & Teens)">13+ (PG-13 & Teens)</option>
              <option value="7+ (Kids & Family)">7+ (Kids & Family)</option>
            </select>
          </div>
        </div>

        {/* ── BILLING & PAYMENT HISTORY ── */}
        <div className="mt-6 rounded-xl border border-white/10 bg-[#181818] p-6 shadow-xl sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#aaa]">
            <FileText className="size-4 text-[#e50914]" />
            <span>BILLING HISTORY & INVOICES</span>
          </div>

          <div className="mt-6 overflow-x-auto">
            {invoicesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#666]">
                No billing history available yet.
              </p>
            ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[#888] font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Invoice</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Payment Method</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#ccc]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 pl-2 font-mono text-white font-semibold">{inv.id}</td>
                    <td className="py-3.5">{inv.date}</td>
                    <td className="py-3.5 font-medium text-white">{inv.description}</td>
                    <td className="py-3.5 text-[#888]">{inv.card}</td>
                    <td className="py-3.5 font-bold text-white">{inv.amount}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <button
                        onClick={() => showToast(`Downloaded invoice ${inv.id} (PDF)`, "success")}
                        className="inline-flex items-center gap-1 text-[#aaa] hover:text-white transition"
                        title="Download Receipt"
                      >
                        <Download className="size-3.5" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
      </section>

      {/* ── PIN SETUP MODAL ── */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-xl border border-white/10 bg-[#181818] p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => { setShowPinModal(false); setNewPin(""); }}
              className="absolute right-4 top-4 rounded-full p-2 text-[#aaa] hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#e50914]/20 p-2.5 text-[#e50914]">
                <Lock className="size-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Profile PIN Lock</h3>
                <p className="text-xs text-[#aaa]">Enter a 4-digit PIN for this profile.</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPin.length !== 4) return;
                const updated = { ...parental, pin: newPin, pinRequired: true };
                setParental(updated);
                localStorage.setItem("streamly-parental-controls", JSON.stringify(updated));
                showToast("Profile PIN set successfully!", "success");
                setShowPinModal(false);
                setNewPin("");
              }}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#888]">
                  4-Digit Security PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="mt-2 w-full text-center text-2xl tracking-[0.5em] font-mono rounded border border-white/20 bg-black/60 px-4 py-3 text-white outline-none focus:border-[#e50914]"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setShowPinModal(false); setNewPin(""); }}
                  className="rounded border border-white/20 px-4 py-2 text-xs font-semibold text-[#ccc] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newPin.length !== 4}
                  className="rounded bg-[#e50914] px-5 py-2 text-xs font-semibold text-white hover:bg-[#c80710] disabled:opacity-50"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PLAN SELECTION MODAL ── */}
      {showPlanModal && (
        <PlanModal
          currentPlanId={subData.subscription.planId}
          onClose={() => setShowPlanModal(false)}
          onSelectPlan={handlePlanChange}
        />
      )}

      {/* ── MANAGE PAYMENT INFO MODAL (Stripe Elements — PCI-DSS compliant) ── */}
      {showPaymentModal && (
        <StripePaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(sub: SubscriptionData) =>
            setSubData((prev) => ({ ...prev, subscription: sub }))
          }
        />
      )}

      {/* ── CHANGE EMAIL MODAL ── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#181818] p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-[#aaa] hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-900/40 p-2.5 text-blue-400">
                <Mail className="size-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Change Email Address</h3>
                <p className="text-xs text-[#aaa]">Enter your new account email.</p>
              </div>
            </div>

            {modalMessage && (
              <p className="mt-3 rounded border border-red-500/40 bg-red-950/50 p-2.5 text-xs text-red-200">
                {modalMessage}
              </p>
            )}

            <form onSubmit={handleEmailUpdate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#ccc]">New Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1.5 w-full rounded border border-white/20 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-white"
                  placeholder="newemail@example.com"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="rounded border border-white/20 px-4 py-2 text-xs font-semibold text-[#ccc] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="rounded bg-[#e50914] px-5 py-2 text-xs font-semibold text-white hover:bg-[#c80710]"
                >
                  {loading ? "Updating..." : "Update Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#181818] p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-[#aaa] hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-900/40 p-2.5 text-amber-400">
                <KeyRound className="size-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Change Password</h3>
                <p className="text-xs text-[#aaa]">Update your account password.</p>
              </div>
            </div>

            {modalMessage && (
              <p className="mt-3 rounded border border-red-500/40 bg-red-950/50 p-2.5 text-xs text-red-200">
                {modalMessage}
              </p>
            )}

            <form onSubmit={handlePasswordUpdate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#ccc]">Current Password</label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="mt-1.5 w-full rounded border border-white/20 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#ccc]">New Password</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="mt-1.5 w-full rounded border border-white/20 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded border border-white/20 px-4 py-2 text-xs font-semibold text-[#ccc] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="rounded bg-[#e50914] px-5 py-2 text-xs font-semibold text-white hover:bg-[#c80710]"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
