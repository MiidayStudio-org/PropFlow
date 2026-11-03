"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2, RefreshCw } from "./icons";
import { useStats, useFeaturedProperties, formatINR } from "@/lib/api";
import { CountUp, ScrollFloat, Bob } from "./motion/primitives";

export function Hero() {
  const [activeTab, setActiveTab] = useState<"crm" | "scraper" | "ai">("crm");
  const { data: stats } = useStats();
  const { featured, loading: featuredLoading } = useFeaturedProperties();
  const shouldReduceMotion = useReducedMotion();

  const featuredProperty = featured.length > 0 ? featured[0] : null;

  // Headline word stagger variants
  const headlineWords1 = ["AI–Powered", "Real", "Estate"];
  const headlineWords2 = ["Platform"];

  return (
    <section className="relative pt-36 pb-24 md:pt-44 md:pb-28 overflow-hidden bg-[#111111] text-white border-b border-[#262626]">
      {/* Background Decorative Ambient Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FF5C1C]/10 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDEEE6] border border-[#FF5C1C]/20 text-[#FF5C1C] text-xs font-semibold tracking-wide mb-6 shadow-xs">
            <Sparkles size={14} className="text-[#FF5C1C]" />
            <span>Automated Property Scraping & AI Matching</span>
          </div>

          {/* Title with Editorial Serif Font & Overlapping Orange Accent Circle behind "Intelligence" */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-[1.15] mb-6">
            {headlineWords1.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: "easeOut" }}
                className="inline-block mr-2"
              >
                {word}
              </motion.span>
            ))}
            <br className="hidden sm:inline" />
            <span className="relative inline-block z-10 mx-1">
              <span className="absolute -top-3 -left-3 w-16 h-16 md:w-20 md:h-20 bg-[#FF5C1C] rounded-full -z-10 opacity-90" aria-hidden="true" />
              <motion.span
                initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.28, ease: "easeOut" }}
                className="relative z-10 text-white inline-block"
              >
                Intelligence
              </motion.span>
            </span>{" "}
            {headlineWords2.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.36 + i * 0.08, ease: "easeOut" }}
                className="inline-block mr-2"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 font-sans leading-relaxed font-normal max-w-2xl mx-auto">
            Automate public property scraping, AI lead-property matching, site-visit logistics, and deal pipelines in a single unified operating system.
          </p>

          {/* Action Pill CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full bg-[#FF5C1C] hover:bg-[#E04809] text-white text-sm font-semibold transition-all shadow-md hover:scale-[1.02]"
            >
              <span>Launch CRM</span>
              <span className="w-6 h-6 rounded-full bg-white text-[#FF5C1C] flex items-center justify-center text-xs font-bold">
                &rarr;
              </span>
            </a>
            <a
              href="#scraper-service"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#1B1B1B] hover:bg-[#262626] text-white border border-[#262626] text-sm font-semibold transition-all"
            >
              <span>Inspect Scraper Engine</span>
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400 font-sans font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#FF5C1C]" />
              Playwright Stealth Scraper
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#FF5C1C]" />
              Prisma Database Deduplication
            </span>
          </div>
        </div>

        {/* Dashboard Product UI Card (Warm Editorial Theme with rounded-3xl) with ScrollFloat */}
        <ScrollFloat offset={18} className="max-w-5xl mx-auto mt-12">
          <div className="rounded-3xl bg-[#1B1B1B] border border-[#262626] shadow-2xl p-5 sm:p-7">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF5C1C] text-white flex items-center justify-center font-bold text-xs">
                  PF
                </div>
                <div>
                  <h2 className="text-sm font-serif font-bold text-white">Executive Dashboard</h2>
                  <p className="text-[11px] font-sans text-slate-400">Live Scraped Inventory & AI Match Engine</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("crm")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === "crm" ? "bg-white text-[#111111]" : "bg-[#262626] text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Pipeline CRM
                </button>
                <button
                  onClick={() => setActiveTab("scraper")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === "scraper" ? "bg-[#FF5C1C] text-white" : "bg-[#262626] text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Scraper Telemetry
                </button>
              </div>
            </div>

            {/* Quick Metrics Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 font-sans">
              <div className="bg-[#111111] p-4 rounded-2xl border border-[#262626]">
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Active Pipeline</span>
                <span className="text-xl font-serif font-bold text-white">
                  {formatINR(stats.activePipeline)}
                </span>
                <Bob delay={0.1} distance={3} className="inline-block">
                  <span className="text-[10px] text-[#FF5C1C] font-semibold block mt-1">
                    {stats.leadsGrowthPct !== null ? `+${stats.leadsGrowthPct}% this month` : "Live telemetry"}
                  </span>
                </Bob>
              </div>

              <div className="bg-[#111111] p-4 rounded-2xl border border-[#262626]">
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Scraped Properties</span>
                <span className="text-xl font-serif font-bold text-white">
                  <CountUp value={stats.scrapedProperties} />
                </span>
                <span className="text-[10px] text-[#FF5C1C] font-semibold block mt-1">100% Deduplicated</span>
              </div>

              <div className="bg-[#111111] p-4 rounded-2xl border border-[#262626]">
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Active Leads</span>
                <span className="text-xl font-serif font-bold text-white">
                  <CountUp value={stats.activeLeads} />
                </span>
                <span className="text-[10px] text-[#FF5C1C] font-semibold block mt-1">High Intent</span>
              </div>

              <div className="bg-[#111111] p-4 rounded-2xl border border-[#262626]">
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Match Accuracy</span>
                <span className="text-xl font-serif font-bold text-[#FF5C1C]">
                  <CountUp value={stats.matchAccuracyPct || 0} decimals={1} suffix="%" />
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">MatchScore™ AI</span>
              </div>
            </div>

            {/* Feature Showcase Box (Live Featured Property) */}
            <div className="relative rounded-2xl overflow-hidden bg-[#111111] text-white p-6 sm:p-8 min-h-[260px] flex flex-col justify-between border border-[#262626]">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5C1C]/10 rounded-full blur-2xl pointer-events-none" />

              {featuredLoading ? (
                <div className="relative z-10 py-12 text-center text-slate-400 text-sm">
                  Loading live scraped inventory...
                </div>
              ) : featuredProperty ? (
                <>
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FDEEE6] text-[#FF5C1C] text-[11px] font-semibold mb-3">
                        <RefreshCw size={12} className="animate-spin text-[#FF5C1C]" />
                        Live Syncing Scraper Engine
                      </span>
                      <h3 className="text-xl sm:text-2xl font-serif font-semibold text-white mb-2">
                        {featuredProperty.title}
                      </h3>
                      <p className="text-xs text-slate-300 font-sans max-w-xl leading-relaxed">
                        {featuredProperty.description ||
                          `Automatically extracted via Playwright stealth scraper. Parsed carpet area (${featuredProperty.carpetAreaSqFt || 780} SqFt), ${featuredProperty.bedrooms || 2} BHK / ${featuredProperty.bathrooms || 2} Baths, price ${formatINR(featuredProperty.numericPrice || 8500000)}, and normalized amenities into PostgreSQL database.`}
                      </p>
                    </div>
                    <Bob delay={0.4} distance={5}>
                      <span className="px-3.5 py-1.5 rounded-full bg-[#FF5C1C] text-white font-bold text-sm shadow-md whitespace-nowrap block">
                        MatchScore: {featuredProperty.topScore || 92}%
                      </span>
                    </Bob>
                  </div>

                  <div className="relative z-10 flex flex-wrap items-center justify-between pt-6 border-t border-[#262626] gap-4 mt-6">
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-sans font-medium">
                      <span>Location: {featuredProperty.locality}, {featuredProperty.city}</span>
                      <span>•</span>
                      <span>Source: {featuredProperty.sourcePortal || "Housing.com"} Portal</span>
                      <span>•</span>
                      <span>Status: Upserted & Deduplicated</span>
                    </div>
                    <a
                      href="/dashboard"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5C1C] hover:text-white transition-colors"
                    >
                      <span>View Full Property Intelligence</span>
                      <ArrowRight size={14} />
                    </a>
                  </div>
                </>
              ) : (
                <div className="relative z-10 py-10 text-center">
                  <p className="text-sm text-slate-400 mb-2">No properties scraped yet</p>
                  <p className="text-xs text-slate-500">Run the Maharashtra property scraper to sync live inventory.</p>
                </div>
              )}
            </div>
          </div>
        </ScrollFloat>
      </div>
    </section>
  );
}
