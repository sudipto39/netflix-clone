import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { AppProvider } from "@/components/AppProvider";
import { ToastContainer } from "@/components/ToastContainer";

const HomePage = lazy(() => import("@/pages/Home"));
const LoginPage = lazy(() => import("@/pages/Login"));
const RegisterPage = lazy(() => import("@/pages/Register"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPassword"));
const ProfilesPage = lazy(() => import("@/pages/Profiles"));
const BrowsePage = lazy(() => import("@/pages/Browse"));
const TVShowsPage = lazy(() => import("@/pages/TVShows"));
const MoviesPage = lazy(() => import("@/pages/Movies"));
const NewPopularPage = lazy(() => import("@/pages/NewPopular"));
const MyListPage = lazy(() => import("@/pages/MyList"));
const WatchPage = lazy(() => import("@/pages/Watch"));
const AccountPage = lazy(() => import("@/pages/Account"));
const SearchPage = lazy(() => import("@/pages/Search"));
const HelpPage = lazy(() => import("@/pages/Help"));
const TitleDetailPage = lazy(() => import("@/pages/TitleDetail"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPolicy"));
const NotFoundPage = lazy(() => import("@/pages/NotFound"));
const PlansPage = lazy(() => import("@/pages/Plans"));
const AdminPage = lazy(() => import("@/pages/Admin"));
const AdminLoginPage = lazy(() => import("@/pages/AdminLogin"));
import { AdminRouteGuard } from "@/components/AdminRouteGuard";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";

/**
 * Animated Streamly Logo Startup Splash Screen (Plays on initial app load)
 * Left-to-right unfold transition: First 'S' appears, then each subsequent letter emerges from behind the previous one
 */
function StartupSplashScreen({ onComplete }: { onComplete: () => void }) {
  const letters = ["S", "T", "R", "E", "A", "M", "L", "Y"];

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden select-none"
    >
      {/* Radial Crimson Background Glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.6, 0.4, 0.8, 0], scale: [0.4, 1.2, 1.7, 2.5] }}
        transition={{ duration: 5.0, ease: "easeInOut" }}
        className="absolute size-[420px] rounded-full bg-[#e50914] blur-[140px] pointer-events-none"
      />

      {/* Main Animated Streamly Logo (Unfolds from left to right from behind 'S') */}
      <div className="relative flex flex-col items-center">
        <div className="relative flex items-center justify-center space-x-1 sm:space-x-2">
          {letters.map((char, index) => {
            const isFirst = index === 0;
            return (
              <motion.span
                key={index}
                style={{ zIndex: 20 - index }}
                initial={
                  isFirst
                    ? { opacity: 0, scale: 0.35, filter: "blur(12px)", y: 20 }
                    : { opacity: 0, x: -65, scale: 0.5, filter: "blur(8px)" }
                }
                animate={
                  isFirst
                    ? { opacity: 1, scale: [0.35, 1.15, 1], filter: "blur(0px)", y: 0 }
                    : { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }
                }
                transition={
                  isFirst
                    ? { duration: 0.8, ease: "easeOut", delay: 0.4 }
                    : {
                        type: "spring" as const,
                        damping: 18,
                        stiffness: 90,
                        mass: 0.9,
                        delay: 0.4 + index * 0.28,
                      }
                }
                className="relative inline-block text-5xl sm:text-7xl font-black tracking-[-0.05em] text-[#e50914] drop-shadow-[0_0_35px_rgba(229,9,20,0.95)]"
              >
                {char}
              </motion.span>
            );
          })}

          {/* Synchronized Mirror Shimmer Light Sweep */}
          <motion.div
            initial={{ x: "-120%", opacity: 0 }}
            animate={{ x: "240%", opacity: [0, 0.95, 0.95, 0] }}
            transition={{ duration: 2.8, ease: "easeInOut", delay: 0.4 }}
            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-25deg] pointer-events-none"
          />
        </div>

        {/* Expanding Red Accent Line in sync with unfolding logo */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2.8, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
          className="mt-6 h-1 w-48 sm:w-64 origin-left rounded-full bg-gradient-to-r from-transparent via-[#e50914] to-transparent shadow-[0_0_20px_#e50914]"
        />
      </div>
    </motion.div>
  );
}

/**
 * Animated Streamly Logo Fallback for React Suspense route transitions
 * Left-to-right sliding wave animation
 */
function PageLoader() {
  const letters = ["S", "T", "R", "E", "A", "M", "L", "Y"];

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#141414]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center space-x-1 sm:space-x-2">
          {letters.map((char, index) => (
            <motion.span
              key={index}
              style={{ zIndex: 20 - index }}
              animate={{
                opacity: [0.3, 1, 0.5, 0.3],
                x: index === 0 ? [0, 0, 0, 0] : [-12, 0, -6, -12],
                scale: [0.9, 1.2, 1, 0.9],
                textShadow: [
                  "0 0 5px rgba(229,9,20,0.2)",
                  "0 0 35px rgba(229,9,20,1)",
                  "0 0 15px rgba(229,9,20,0.6)",
                  "0 0 5px rgba(229,9,20,0.2)",
                ],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.14,
              }}
              className="relative inline-block text-3xl sm:text-5xl font-black tracking-[-0.05em] text-[#e50914]"
            >
              {char}
            </motion.span>
          ))}
        </div>

        <div className="h-1 w-32 overflow-hidden rounded-full bg-white/10 mt-2">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-1/2 rounded-full bg-[#e50914] shadow-[0_0_15px_#e50914]"
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isStartingUp, setIsStartingUp] = useState(true);

  return (
    <BrowserRouter>
      <AppProvider>
        <AnimatePresence mode="wait">
          {isStartingUp && (
            <StartupSplashScreen key="splash" onComplete={() => setIsStartingUp(false)} />
          )}
        </AnimatePresence>

        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route
              path="/profiles"
              element={
                <SubscriptionGuard>
                  <ProfilesPage />
                </SubscriptionGuard>
              }
            />
            <Route
              path="/browse"
              element={
                <SubscriptionGuard>
                  <BrowsePage />
                </SubscriptionGuard>
              }
            />
            <Route
              path="/tv-shows"
              element={
                <SubscriptionGuard>
                  <TVShowsPage />
                </SubscriptionGuard>
              }
            />
            <Route
              path="/movies"
              element={
                <SubscriptionGuard>
                  <MoviesPage />
                </SubscriptionGuard>
              }
            />
            <Route
              path="/latest"
              element={
                <SubscriptionGuard>
                  <NewPopularPage />
                </SubscriptionGuard>
              }
            />
            <Route
              path="/my-list"
              element={
                <SubscriptionGuard>
                  <MyListPage />
                </SubscriptionGuard>
              }
            />
            <Route
              path="/watch"
              element={
                <SubscriptionGuard>
                  <WatchPage />
                </SubscriptionGuard>
              }
            />
            <Route path="/account" element={<AccountPage />} />
            <Route
              path="/search"
              element={
                <SubscriptionGuard>
                  <SearchPage />
                </SubscriptionGuard>
              }
            />
            <Route path="/help" element={<HelpPage />} />
            <Route
              path="/title/:id"
              element={
                <SubscriptionGuard>
                  <TitleDetailPage />
                </SubscriptionGuard>
              }
            />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <AdminRouteGuard>
                  <AdminPage />
                </AdminRouteGuard>
              }
            />
            {/* Catch-all → 404 */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>

        {/* Global toast notifications */}
        <ToastContainer />
      </AppProvider>
    </BrowserRouter>
  );
}


