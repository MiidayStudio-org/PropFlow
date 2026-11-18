"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GoogleIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "@/components/icons";
import { Logo } from "@/components/Logo";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const urlError = searchParams.get("error");

  const [authState, setAuthState] = useState<"idle" | "loading" | "error" | "success">(
    urlError ? "error" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string>(urlError || "");

  useEffect(() => {
    if (urlError) {
      setErrorMessage(decodeURIComponent(urlError));
      setAuthState("error");
    }
  }, [urlError]);

  // Genuine Google Sign In: Handled completely via backend/.env
  const handleGoogleSignIn = () => {
    setAuthState("loading");
    setErrorMessage("");
    // Navigates directly to backend Google OAuth route
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  return (
    <main className="min-h-screen w-full bg-[#FAF7F2] text-[#111111] flex flex-col justify-between relative overflow-hidden selection:bg-[#F5C238] selection:text-black font-sans">
      {/* Background Decorative Ambient Radial Disc */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-[#F5C238]/12 rounded-full blur-3xl z-0"
        aria-hidden="true"
      />

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center group focus-visible:outline-none"
          aria-label="PropFlow Home"
        >
          <Logo size="lg" theme="dark" className="group-hover:opacity-95 transition-opacity" />
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A7A7A] hover:text-[#111111] transition-colors py-2 px-4 rounded-full bg-white border border-[#EAE3D8] shadow-2xs"
        >
          <span>Back to Home</span>
          <ArrowRight size={13} />
        </Link>
      </header>

      {/* Centered Minimalist Sign In Container */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-12 my-auto flex flex-col items-center">
        {/* Sign In Card */}
        <div className="w-full rounded-3xl bg-white border border-[#EAE3D8] p-8 sm:p-10 shadow-md relative">
          {/* Top Yellow Accent Line */}
          <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#F5C238] to-transparent" />

          {/* Card Header */}
          <div className="space-y-2 mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#111111] font-hero">
              Sign in to PropFlow
            </h1>
            <p className="text-sm text-[#7A7A7A] font-sans leading-relaxed">
              Access your real estate CRM dashboard and AI workspace
            </p>
          </div>

          {/* Authentication Action */}
          <div className="space-y-4 font-sans">
            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authState === "loading" || authState === "success"}
              className={`w-full relative group flex items-center justify-center gap-3 px-6 py-3.5 rounded-full font-semibold text-sm transition-all duration-200 cursor-pointer ${
                authState === "loading"
                  ? "bg-[#FAF7F2] text-[#7A7A7A] border border-[#EAE3D8] cursor-wait"
                  : authState === "success"
                  ? "bg-[#F5C238] text-black border border-[#F5C238] shadow-md font-bold"
                  : "bg-white hover:bg-[#FFFDF5] text-[#111111] border border-[#EAE3D8] hover:border-[#F5C238] shadow-2xs hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none"
              }`}
              aria-label="Continue with Google"
            >
              {authState === "loading" ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-[#F5C238]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Redirecting to Google...</span>
                </>
              ) : authState === "success" ? (
                <>
                  <CheckCircle2 size={18} className="text-black" />
                  <span>Authenticated! Redirecting...</span>
                </>
              ) : (
                <>
                  <GoogleIcon size={19} className="shrink-0" />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Error Message Alert */}
            {authState === "error" && (
              <div
                className="p-3.5 rounded-2xl bg-[#FFF5F5] border border-[#FED7D7] flex items-start gap-2.5 text-xs text-[#C53030] animate-fadeIn"
                role="alert"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Terms and Privacy Notice */}
            <div className="pt-2">
              <p className="text-[11px] text-[#7A7A7A] text-center leading-relaxed">
                By continuing, you agree to PropFlow&apos;s{" "}
                <span className="text-[#111111] hover:underline cursor-pointer">Terms of Service</span> and{" "}
                <span className="text-[#111111] hover:underline cursor-pointer">Privacy Policy</span>.
              </p>
            </div>
          </div>

          {/* Switcher: New user link */}
          <div className="mt-8 pt-6 border-t border-[#EAE3D8] flex items-center justify-between text-xs text-[#7A7A7A] font-sans">
            <span>New to PropFlow?</span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[#111111] hover:text-[#E08A28] font-bold transition-colors group focus-visible:outline-none focus-visible:underline"
            >
              <span>Get Started</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Security Verification Badge */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#7A7A7A] font-medium font-sans">
            <ShieldCheck size={14} className="text-[#22C55E]" />
            <span>256-Bit SSL Encrypted Session</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A7A7A] gap-2 border-t border-[#EAE3D8] font-sans">
        <div>
          © {new Date().getFullYear()} PropFlow Inc. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-[#7A7A7A]">
          <Link href="/" className="hover:text-[#111111] transition-colors">Home</Link>
          <span>•</span>
          <span className="hover:text-[#111111] transition-colors cursor-pointer">Security Overview</span>
          <span>•</span>
          <span className="hover:text-[#111111] transition-colors cursor-pointer">Support</span>
        </div>
      </footer>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBF9F4] flex items-center justify-center font-sans text-xs text-neutral-500">
          Loading PropFlow Authentication...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
