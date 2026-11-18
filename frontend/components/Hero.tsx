"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Layers, Sparkles, TrendingUp } from "./icons";
import { useStats, formatINR } from "@/lib/api";

export function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const { data: stats } = useStats();

  const pipelineDisplay = stats?.activePipeline && stats.activePipeline > 0 ? formatINR(stats.activePipeline) : "14.8 Cr+";
  const propertiesDisplay = stats?.scrapedProperties && stats.scrapedProperties > 0 ? `${stats.scrapedProperties}+` : "1.24K+";
  const accuracyDisplay = stats?.matchAccuracyPct && stats.matchAccuracyPct > 0 ? `${stats.matchAccuracyPct}%` : "98.4%";

  return (
    <section className="relative min-h-[720px] lg:min-h-screen w-full bg-[#000000] overflow-hidden flex flex-col justify-between pt-28 sm:pt-36 pb-10 sm:pb-14 select-none">
      {/* 1. ARCHITECTURAL DAYLIGHT BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none -z-0">
        <img
          src="/images/hero-bg-daylight.jpg"
          alt="PropFlow Architecture"
          className="w-full h-full object-cover object-[20%_center] md:object-[30%_center] lg:object-center"
        />
        {/* Smooth bottom fade into deep black for the stats bar */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
      </div>

      {/* 2. HOTSPOT 1: TOP-LEFT ("SCRAPE LISTINGS FROM MULTIPLE SOURCES.") */}
      <div className="hidden xl:block absolute top-[16%] left-[4.5%] 2xl:left-[6%] z-20 pointer-events-none">
        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-3 relative"
        >
          {/* Yellow Icon Box with Line attached directly to its bottom center */}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#F5C238] text-black flex items-center justify-center shadow-xs">
              <Layers size={18} className="stroke-[2.4]" />
            </div>

            {/* Connecting L-Line & White Square Dot matching mockup */}
            <svg
              className="overflow-visible absolute top-full left-1/2 -translate-x-[0.5px] pointer-events-none"
              width="250"
              height="160"
            >
              <path
                d="M 0 0 L 0 135 L 210 135"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
              <rect
                x="206"
                y="131"
                width="8"
                height="8"
                fill="#FFFFFF"
              />
            </svg>
          </div>

          <div className="text-[10px] sm:text-[11px] font-black text-[#111111] uppercase tracking-wider leading-[1.25]">
            SCRAPE<br />
            LISTINGS FROM<br />
            MULTIPLE SOURCES.
          </div>
        </motion.div>
      </div>

      {/* 3. HOTSPOT 2: CENTER-LEFT ("AI LEAD MATCHING & DEAL INSIGHTS.") */}
      <div className="hidden xl:block absolute top-[16%] left-[28%] 2xl:left-[29%] z-20 pointer-events-none">
        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex items-center gap-3 relative"
        >
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#F5C238] text-black flex items-center justify-center shadow-xs">
              <Sparkles size={18} className="stroke-[2.4]" />
            </div>

            {/* Connecting Line & Glowing White Square */}
            <svg
              className="overflow-visible absolute top-full left-1/2 -translate-x-[0.5px] pointer-events-none"
              width="70"
              height="250"
            >
              <path
                d="M 0 0 L 0 215 L 25 215"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
              <rect
                x="21"
                y="211"
                width="8"
                height="8"
                fill="#FFFFFF"
              />
            </svg>
          </div>

          <div className="text-[10px] sm:text-[11px] font-black text-[#111111] uppercase tracking-wider leading-[1.25]">
            AI LEAD<br />
            MATCHING<br />
            & DEAL INSIGHTS.
          </div>
        </motion.div>
      </div>

      {/* 4. HOTSPOT 3: RIGHT ("UNIFIED CRM & PIPELINE MANAGEMENT.") - POSITIONED SAFELY BELOW HEADLINE */}
      <div className="hidden xl:block absolute top-[58%] 2xl:top-[60%] right-[5%] 2xl:right-[8%] z-20 pointer-events-none">
        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0, x: shouldReduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex items-center gap-3 relative"
        >
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#F5C238] text-black flex items-center justify-center shadow-xs">
              <TrendingUp size={18} className="stroke-[2.4]" />
            </div>

            {/* Connecting Line pointing left to concrete horizontal ledge */}
            <svg
              className="overflow-visible absolute top-1/2 right-full pointer-events-none -translate-y-1/2"
              width="170"
              height="24"
            >
              <path
                d="M 170 12 L 0 12"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
              <rect
                x="-4"
                y="8"
                width="8"
                height="8"
                fill="#FFFFFF"
              />
            </svg>
          </div>

          <div className="text-[10px] sm:text-[11px] font-black text-[#111111] uppercase tracking-wider leading-[1.25]">
            UNIFIED CRM<br />
            & PIPELINE<br />
            MANAGEMENT.
          </div>
        </motion.div>
      </div>

      {/* 5. MAIN HEADLINE & CONTENT (RIGHT COLUMN - POSITIONED OVER CLEAR SKY) */}
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12 relative z-10 flex flex-col lg:flex-row justify-between items-start pt-2 sm:pt-6 mb-auto">
        {/* Left Spacer ensuring headline stays strictly on the right side over bright sky */}
        <div className="hidden lg:block lg:w-[52%] xl:w-[54%] 2xl:w-[56%] pointer-events-none" />

        {/* Right Main Copy */}
        <div className="w-full lg:w-[48%] xl:w-[46%] 2xl:w-[44%] flex flex-col items-start">
          {/* Top Tag: Vertical Yellow Bar + Uppercase Tag */}
          <motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 mb-3 sm:mb-4"
          >
            <span className="w-1.5 h-4 sm:h-4.5 bg-[#F5C238] rounded-xs inline-block shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold tracking-widest text-[#111111] uppercase font-sans">
              AI-POWERED REAL ESTATE OPERATING SYSTEM
            </span>
          </motion.div>

          {/* Big Bold All-Caps Headline in crisp high-contrast */}
          <motion.h1
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[42px] xl:text-[50px] 2xl:text-[56px] font-black text-[#111111] tracking-[-0.035em] leading-[1.0] font-hero uppercase select-none"
            style={{
              fontFamily: 'var(--font-inter), var(--font-sans), "Inter", "Plus Jakarta Sans", sans-serif',
            }}
          >
            <span className="block whitespace-nowrap">PROPFLOW</span>
            <span className="block mt-1 sm:mt-1.5 whitespace-nowrap">THE AI CRM FOR</span>
            <span className="block mt-1 sm:mt-1.5 whitespace-nowrap">
              MODERN REAL ESTATE
              <span className="inline-block w-[0.16em] h-[0.16em] rounded-full bg-[#F5C238] ml-[0.12em] align-middle mb-[0.06em]" />
            </span>
          </motion.h1>
        </div>
      </div>

      {/* 6. BOTTOM TELEMETRY STATS ROW (AGAINST SOLID BLACK BAR) */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 w-full relative z-10 pt-16 sm:pt-20">
        <div className="inline-flex flex-wrap sm:flex-nowrap items-center gap-6 sm:gap-10">
          {/* Stat 1 */}
          <div className="sm:border-r sm:border-white/20 sm:pr-8 lg:pr-12">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight block">
              {pipelineDisplay}
            </span>
            <span className="text-[10px] sm:text-[11px] text-neutral-400 font-bold tracking-widest uppercase mt-1 block">
              ACTIVE PIPELINE
            </span>
          </div>

          {/* Stat 2 */}
          <div className="sm:border-r sm:border-white/20 sm:pr-8 lg:pr-12">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight block">
              {propertiesDisplay}
            </span>
            <span className="text-[10px] sm:text-[11px] text-neutral-400 font-bold tracking-widest uppercase mt-1 block">
              SCRAPED PROPERTIES
            </span>
          </div>

          {/* Stat 3 */}
          <div>
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight block">
              {accuracyDisplay}
            </span>
            <span className="text-[10px] sm:text-[11px] text-neutral-400 font-bold tracking-widest uppercase mt-1 block">
              MATCH ACCURACY
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
