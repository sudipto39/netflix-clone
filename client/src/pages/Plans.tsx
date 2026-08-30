import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ShieldCheck,
  CreditCard,
  QrCode,
  Building,
  Lock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  LogOut,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useSession, signOut } from "@/lib/mockAuth";
import { useApp } from "@/components/AppProvider";
import { apiRequest } from "@/lib/api";
import { DEFAULT_PLANS, getActivePlans, type SubscriptionPlanItem } from "@/lib/plansStore";
import { updateSubscriptionCache } from "@/components/SubscriptionGuard";

export default function PlansPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session } = useSession();
  const { showToast } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>(getActivePlans());
  const [selectedPlanId, setSelectedPlanId] = useState<string>("premium");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "netbanking">("card");

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState(session?.user?.name || "");

  // UPI form state
  const [upiId, setUpiId] = useState("");

  // Netbanking state
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentSub, setCurrentSub] = useState<{ status: string; planId: string; currentPeriodEnd: string | null } | null>(null);

  const locationState = location.state as { expired?: boolean; message?: string; required?: boolean } | null;

  useEffect(() => {
    // Sync available plans from store
    const active = getActivePlans();
    if (active.length > 0) setPlans(active);

    // Fetch live subscription to see if already active
    apiRequest<{ data: { subscription: { status: string; planId: string; currentPeriodEnd: string | null } } }>("/payments/subscription")
      .then((res) => {
        if (res?.data?.subscription) {
          setCurrentSub(res.data.subscription);
          if (res.data.subscription.planId && res.data.subscription.planId !== "none") {
            setSelectedPlanId(res.data.subscription.planId);
          }
        }
      })
      .catch(() => {});
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0] || DEFAULT_PLANS[2];

  // Helper formatting for card inputs
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4));
  };

  // Submit subscription payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (paymentMethod === "card") {
      const cleanNumber = cardNumber.replace(/\s/g, "");
      if (cleanNumber.length < 15) {
        setErrorMsg("Please enter a valid 16-digit card number.");
        return;
      }
      if (cardExpiry.length < 5) {
        setErrorMsg("Please enter a valid expiry date (MM/YY).");
        return;
      }
      if (cardCvv.length < 3) {
        setErrorMsg("Please enter a valid 3 or 4 digit CVV.");
        return;
      }
    } else if (paymentMethod === "upi") {
      if (!upiId.trim() || !upiId.includes("@")) {
        setErrorMsg("Please enter a valid UPI ID (e.g. yourname@okhdfcbank).");
        return;
      }
    }

    setLoading(true);
    try {
      const cleanCard = cardNumber.replace(/\s/g, "");
      const last4 = cleanCard.length >= 4 ? cleanCard.slice(-4) : "8821";

      const res = await apiRequest<{
        status: string;
        message: string;
        data: { subscription: Record<string, unknown>; invoice: Record<string, unknown> };
      }>("/payments/subscribe", {
        method: "POST",
        body: JSON.stringify({
          planId: selectedPlan.id,
          paymentMethod,
          cardLast4: paymentMethod === "card" ? last4 : "UPI",
          cardBrand: paymentMethod === "card" ? "Visa" : "UPI",
          durationDays: selectedPlan.durationDays || 30,
        }),
      });

      if (res.status === "success") {
        updateSubscriptionCache(session?.user?.email || "", true);
        showToast(`🎉 Payment of ${selectedPlan.price} received! Your ${selectedPlan.name} plan is now active.`, "success");
        setTimeout(() => {
          navigate("/browse", { replace: true });
        }, 400);
      } else {
        throw new Error(res.message || "Payment processing failed. Please try again.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to activate subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const calculateExpiryDate = (days = 30) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  const isCurrentPlanActive =
    currentSub?.status === "active" &&
    currentSub?.currentPeriodEnd &&
    new Date(currentSub.currentPeriodEnd).getTime() > Date.now();

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col justify-between selection:bg-[#e50914] selection:text-white">
      {/* ── Top Navigation Header ── */}
      <header className="border-b border-white/10 bg-[#141414]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
          <Link to="/" className="text-3xl sm:text-4xl font-black tracking-tighter text-[#e50914] drop-shadow-[0_0_15px_rgba(229,9,20,0.7)]">
            STREAMLY
          </Link>

          <div className="flex items-center gap-4">
            {session?.user?.email && (
              <span className="hidden sm:inline-block text-xs text-[#aaa] font-medium">
                Signed in as <span className="text-white font-semibold">{session.user.email}</span>
              </span>
            )}

            {isCurrentPlanActive && (
              <button
                onClick={() => navigate("/browse")}
                className="rounded bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition flex items-center gap-1.5"
              >
                Go to Browse <ChevronRight className="size-3.5" />
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded border border-white/20 bg-transparent px-3 py-1.5 text-xs font-semibold text-[#ccc] hover:bg-white/10 hover:text-white transition"
            >
              <LogOut className="size-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Plan Selection & Payment Body ── */}
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 flex-1">
        {/* Notice alert if redirected due to expiry or required plan */}
        {(locationState?.expired || locationState?.required || locationState?.message) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 shadow-lg"
          >
            <AlertCircle className="size-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-300">
                {locationState.expired ? "Subscription Expired" : "Active Subscription Required"}
              </p>
              <p className="mt-0.5 text-amber-200/90 text-xs sm:text-sm">
                {locationState.message ||
                  "To browse unlimited movies and series on Streamly, please select a plan and complete your payment below."}
              </p>
            </div>
          </motion.div>
        )}

        {/* Step Indicator */}
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#e50914] px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-widest text-white">
              STEP {step} OF 2
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {step === 1 ? "Choose the plan that's right for you" : "Set up your payment in INR (₹)"}
            </h2>
          </div>

          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-[#aaa] hover:text-white underline underline-offset-4"
            >
              ← Change Plan
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            /* ═══════════════════════════════════════════════════════════════════ */
            /* STEP 1: PLAN SELECTION TIERS IN INR (₹)                            */
            /* ═══════════════════════════════════════════════════════════════════ */
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Feature Highlights */}
              <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#bbb]">
                <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3 border border-white/5">
                  <Check className="size-4 text-[#e50914]" />
                  <span>Watch all you want. Ad-free.</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3 border border-white/5">
                  <Check className="size-4 text-[#e50914]" />
                  <span>Recommendations just for you.</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3 border border-white/5">
                  <Check className="size-4 text-[#e50914]" />
                  <span>Change or cancel your plan anytime.</span>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const isPopular = plan.isPopular || plan.id === "premium";

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative flex flex-col justify-between rounded-2xl border cursor-pointer transition-all duration-300 p-6 ${
                        isSelected
                          ? "border-[#e50914] bg-gradient-to-b from-[#e50914]/20 via-[#1f1f1f] to-[#181818] shadow-[0_0_30px_rgba(229,9,20,0.35)] scale-[1.02]"
                          : "border-white/10 bg-[#1a1a1a] hover:border-white/25 hover:bg-[#202020]"
                      }`}
                    >
                      {isPopular && (
                        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#e50914] to-[#ff4b4b] px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-md flex items-center gap-1">
                          <Sparkles className="size-3" /> Most Popular
                        </span>
                      )}

                      <div>
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black tracking-tight text-white">{plan.name}</h3>
                          <div
                            className={`grid size-6 place-items-center rounded-full border ${
                              isSelected ? "border-[#e50914] bg-[#e50914]" : "border-white/30"
                            }`}
                          >
                            {isSelected && <Check className="size-3.5 text-white stroke-[3]" />}
                          </div>
                        </div>

                        {/* Price Display */}
                        <div className="mt-4 pb-4 border-b border-white/10">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-white">{plan.price}</span>
                          </div>
                          <p className="mt-1 text-xs text-[#aaa] flex items-center gap-1">
                            <Clock className="size-3 text-[#e50914]" /> Validity: 30 Days
                          </p>
                        </div>

                        {/* Plan Specs Breakdown */}
                        <div className="mt-5 space-y-3 text-xs">
                          <div className="flex justify-between py-1 border-b border-white/5">
                            <span className="text-[#888]">Video Quality</span>
                            <span className="font-semibold text-white">{plan.quality || "Great"}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-white/5">
                            <span className="text-[#888]">Resolution</span>
                            <span className="font-semibold text-white">{plan.resolution || "1080p Full HD"}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-white/5">
                            <span className="text-[#888]">Screens at once</span>
                            <span className="font-semibold text-white">{plan.screens || "2 Screens"}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-white/5">
                            <span className="text-[#888]">Supported Devices</span>
                            <span className="font-semibold text-white text-right max-w-[150px]">
                              {plan.id === "mobile" ? "Phone, Tablet" : "TV, Computer, Phone, Tablet"}
                            </span>
                          </div>
                        </div>

                        {/* Features List */}
                        <div className="mt-5 space-y-2">
                          {plan.features.map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-[#ccc]">
                              <Check className="size-3.5 text-[#e50914] shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Select Button */}
                      <button
                        onClick={() => {
                          setSelectedPlanId(plan.id);
                          setStep(2);
                        }}
                        className={`mt-6 w-full rounded-lg py-3 text-xs font-bold uppercase tracking-wider transition ${
                          isSelected
                            ? "bg-[#e50914] text-white hover:bg-[#c80710] shadow-[0_0_15px_rgba(229,9,20,0.5)]"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        {isSelected ? "Proceed to Payment →" : `Select ${plan.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Action */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#1a1a1a] p-6">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Selected: <span className="text-[#e50914] font-bold">{selectedPlan.name}</span> ({selectedPlan.price})
                  </p>
                  <p className="text-xs text-[#888] mt-0.5">
                    Streamly provides full access immediately upon payment confirmation.
                  </p>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto rounded-lg bg-[#e50914] px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(229,9,20,0.6)] hover:bg-[#c80710] transition flex items-center justify-center gap-2"
                >
                  Continue to Payment <ArrowRight className="size-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            /* ═══════════════════════════════════════════════════════════════════ */
            /* STEP 2: PAYMENT METHOD & CHECKOUT IN INR (₹)                        */
            /* ═══════════════════════════════════════════════════════════════════ */
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Payment Methods & Inputs */}
              <div className="lg:col-span-7 space-y-6">
                {/* Payment Gateway Tabs */}
                <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("card");
                      setErrorMsg(null);
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                      paymentMethod === "card"
                        ? "bg-[#e50914] text-white shadow-md"
                        : "text-[#aaa] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <CreditCard className="size-4" /> Credit / Debit Card
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("upi");
                      setErrorMsg(null);
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                      paymentMethod === "upi"
                        ? "bg-[#e50914] text-white shadow-md"
                        : "text-[#aaa] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <QrCode className="size-4" /> UPI / QR Code
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("netbanking");
                      setErrorMsg(null);
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                      paymentMethod === "netbanking"
                        ? "bg-[#e50914] text-white shadow-md"
                        : "text-[#aaa] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Building className="size-4" /> NetBanking
                  </button>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Form based on selected payment method */}
                <form onSubmit={handlePaymentSubmit} className="rounded-2xl border border-white/10 bg-[#181818] p-6 shadow-xl space-y-4">
                  {paymentMethod === "card" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#aaa]">Cards Accepted</span>
                        <span className="text-[11px] font-semibold text-[#888]">Visa • Mastercard • RuPay • Amex</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Name on Card</label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="e.g. Rajkrishna Das"
                          className="w-full rounded-lg border border-white/15 bg-[#101010] px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#e50914] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Card Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="4532 0123 4567 8910"
                            maxLength={19}
                            className="w-full rounded-lg border border-white/15 bg-[#101010] px-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-500 focus:border-[#e50914] focus:outline-none tracking-wider"
                          />
                          <CreditCard className="absolute right-3 top-3 size-4 text-[#888]" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">Expiration (MM/YY)</label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            placeholder="08/29"
                            maxLength={5}
                            className="w-full rounded-lg border border-white/15 bg-[#101010] px-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-500 focus:border-[#e50914] focus:outline-none text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">Security Code (CVV)</label>
                          <input
                            type="password"
                            required
                            value={cardCvv}
                            onChange={handleCvvChange}
                            placeholder="•••"
                            maxLength={4}
                            className="w-full rounded-lg border border-white/15 bg-[#101010] px-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-500 focus:border-[#e50914] focus:outline-none text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "upi" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#aaa]">Instant UPI Payment</span>
                        <span className="text-[11px] font-semibold text-emerald-400">Zero Transaction Fees</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Enter UPI ID / VPA</label>
                        <input
                          type="text"
                          required
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. rajkrishna@okaxis or 9876543210@paytm"
                          className="w-full rounded-lg border border-white/15 bg-[#101010] px-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-500 focus:border-[#e50914] focus:outline-none"
                        />
                      </div>

                      {/* Supported UPI Apps */}
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        {["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => (
                          <div
                            key={app}
                            onClick={() => setUpiId(`user@${app.toLowerCase()}`)}
                            className="rounded-lg border border-white/10 bg-white/5 py-2 text-center text-xs font-semibold text-[#bbb] hover:border-[#e50914] hover:text-white cursor-pointer transition"
                          >
                            {app}
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-[#888]">
                        A collect request will be sent to your UPI app for authorization.
                      </p>
                    </div>
                  )}

                  {paymentMethod === "netbanking" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#aaa]">Select Your Bank</span>
                        <span className="text-[11px] font-semibold text-gray-400">All Major Banks</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Punjab National Bank"].map((bank) => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => setSelectedBank(bank)}
                            className={`rounded-lg border p-3 text-left text-xs font-semibold transition ${
                              selectedBank === bank
                                ? "border-[#e50914] bg-[#e50914]/15 text-white"
                                : "border-white/10 bg-white/5 text-[#aaa] hover:text-white"
                            }`}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Security Guarantee Note */}
                  <div className="flex items-center gap-2 pt-2 text-[11px] text-[#888]">
                    <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                    <span>256-bit encrypted checkout. PCI-DSS Level 1 Compliant.</span>
                  </div>

                  {/* Submit Pay Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[#e50914] py-4 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_25px_rgba(229,9,20,0.6)] hover:bg-[#c80710] disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Lock className="size-4" /> Pay {selectedPlan.price.replace(" / mo", "")} & Start Watching
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: Order Summary & Plan Specs */}
              <div className="lg:col-span-5 space-y-6">
                <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 className="text-base font-bold text-white">Order Summary</h3>
                    <span className="rounded bg-[#e50914]/20 px-2 py-0.5 text-[10px] font-bold text-[#e50914] uppercase">
                      INR Currency
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#aaa]">Selected Tier</span>
                      <span className="font-bold text-white">{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#aaa]">Video Quality</span>
                      <span className="font-semibold text-white">{selectedPlan.quality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#aaa]">Resolution</span>
                      <span className="font-semibold text-white">{selectedPlan.resolution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#aaa]">Screens Watching</span>
                      <span className="font-semibold text-white">{selectedPlan.screens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#aaa]">Billing Duration</span>
                      <span className="font-semibold text-white">30 Days (1 Month)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#aaa]">Plan Valid Until</span>
                      <span className="font-semibold text-emerald-400">{calculateExpiryDate(30)}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 flex justify-between items-baseline">
                    <div>
                      <p className="text-xs text-[#888]">Total Amount Due</p>
                      <p className="text-[11px] text-[#666]">Includes all applicable taxes</p>
                    </div>
                    <span className="text-2xl font-black text-white">{selectedPlan.price.replace(" / mo", "")}</span>
                  </div>

                  <div className="rounded-lg bg-white/5 p-3.5 text-[11px] text-[#888] space-y-1.5 border border-white/5">
                    <p className="text-gray-300 font-semibold flex items-center gap-1.5">
                      <Sparkles className="size-3 text-[#e50914]" /> Streamly Instant Access
                    </p>
                    <p>
                      Your subscription activates immediately upon payment. When your 30-day validity ends, you can renew or change your plan at any time.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-[#101010] py-6 text-center text-xs text-[#666]">
        <div className="mx-auto max-w-7xl px-4">
          <p>© {new Date().getFullYear()} Streamly Inc. (India). All payments processed in Indian Rupees (INR ₹).</p>
          <div className="mt-2 flex justify-center gap-4 text-[#888]">
            <Link to="/help" className="hover:underline">Help Center</Link>
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:underline">Terms of Use</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
