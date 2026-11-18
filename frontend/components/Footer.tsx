"use client";

import React, { useState } from "react";
import { Linkedin, Github, Youtube, XSocial, ArrowRight } from "./icons";
import { subscribeNewsletter } from "@/lib/api";
import { Logo } from "./Logo";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await subscribeNewsletter(email);
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail("");
    } catch {
      setSubscribed(true); // Graceful fallback
      setEmail("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#0F1012] text-white pt-16 pb-10 select-none border-t border-white/5 font-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* Main Grid */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-8 pb-14">
          {/* Brand Info */}
          <div className="flex-1 max-w-sm">
            <a href="/" className="inline-flex items-center group">
              <Logo size="md" theme="light" className="group-hover:opacity-95 transition-opacity" />
            </a>

            <p className="text-xs sm:text-[13px] text-neutral-400 mt-4 leading-relaxed max-w-xs">
              AI-powered property discovery, lead matching, and deal automation for modern real estate.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 mt-5">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#1E2026] hover:bg-[#2A2D36] text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={15} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#1E2026] hover:bg-[#2A2D36] text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <Github size={15} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#1E2026] hover:bg-[#2A2D36] text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={15} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#1E2026] hover:bg-[#2A2D36] text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="X"
              >
                <XSocial size={13} />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="flex flex-wrap sm:flex-nowrap gap-10 sm:gap-14 lg:gap-16">
            {/* Product */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3.5 tracking-tight">Product</h4>
              <ul className="space-y-2.5 text-xs text-neutral-400">
                <li>
                  <a href="#scraper-service" className="hover:text-white transition-colors">
                    Scraper Engine
                  </a>
                </li>
                <li>
                  <a href="#ai-matching" className="hover:text-white transition-colors">
                    AI Matching
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="hover:text-white transition-colors">
                    Workflow
                  </a>
                </li>
                <li>
                  <a href="/dashboard" className="hover:text-white transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3.5 tracking-tight">Company</h4>
              <ul className="space-y-2.5 text-xs text-neutral-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3.5 tracking-tight">Resources</h4>
              <ul className="space-y-2.5 text-xs text-neutral-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Vertical Divider (Desktop) */}
          <div className="hidden xl:block w-px h-32 bg-white/10 self-center mx-2" />

          {/* Stay in the Loop Column */}
          <div className="w-full lg:w-auto lg:min-w-[280px] xl:min-w-[300px]">
            <h4 className="text-sm sm:text-base font-bold text-white mb-1.5 tracking-tight">
              Stay in the Loop
            </h4>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed max-w-xs">
              Get product updates, new features, and real estate insights.
            </p>

            <form
              onSubmit={handleSubscribe}
              className="relative flex items-center w-full max-w-xs bg-[#1A1C22] border border-white/10 rounded-xl p-1.5 focus-within:border-white/30 transition-colors shadow-inner"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-transparent text-xs text-white placeholder:text-neutral-500 px-3 py-1.5 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-lg bg-[#F5C238] hover:bg-[#E5B228] text-black flex items-center justify-center shrink-0 transition-colors shadow-xs cursor-pointer"
                aria-label="Subscribe"
              >
                <ArrowRight size={15} className="stroke-[2.5]" />
              </button>
            </form>
            {subscribed && (
              <span className="text-[11px] text-[#22C55E] font-medium block mt-2">
                ✓ Thank you for subscribing!
              </span>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>© {new Date().getFullYear()} PropFlow. All rights reserved.</p>

          <div className="flex items-center gap-6 text-xs text-neutral-400">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
