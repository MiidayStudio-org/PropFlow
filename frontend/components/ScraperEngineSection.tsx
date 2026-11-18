"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Zap,
  Layers,
  Clock,
  Home,
  Globe,
  MapPin,
  LayoutGrid,
  MoreVertical,
  Database,
  CheckCircle2,
  BarChart2,
  Play,
  ArrowRight,
  Check,
} from "./icons";
import { DemoModal } from "./DemoModal";
import { useScraperStatus } from "@/lib/api";

export function ScraperEngineSection() {
  const shouldReduceMotion = useReducedMotion();
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const { status: scraperStatus } = useScraperStatus();

  const totalPropsDisplay = scraperStatus?.totalProperties && scraperStatus.totalProperties > 0
    ? scraperStatus.totalProperties.toLocaleString("en-IN")
    : "8,240";

  const features = [
    {
      icon: <Zap size={19} className="stroke-[2.2] fill-black" />,
      iconBg: "bg-[#FEF6E0] text-black",
      title: "Multi-Source Scraping",
      desc: "Capture listings from leading real estate platforms.",
    },
    {
      icon: <Layers size={19} className="stroke-[2.2] text-[#111111]" />,
      iconBg: "bg-[#F4F5F7] text-[#111111]",
      title: "Smart Data Extraction",
      desc: "Get clean, structured and enriched property details.",
    },
    {
      icon: <Clock size={19} className="stroke-[2.2] text-[#111111]" />,
      iconBg: "bg-[#F4F5F7] text-[#111111]",
      title: "Scheduled & Continuous",
      desc: "Run automatically and keep your data always fresh.",
    },
  ];

  return (
    <section
      id="scraper-service"
      className="py-20 sm:py-24 lg:py-28 bg-[#FFFFFF] text-[#111111] border-b border-[#EEEEEE] scroll-mt-20 select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column: Heading, Features & CTAs */}
          <div className="lg:col-span-6 flex flex-col items-start">
            {/* Top Tag: Yellow Bar + Scraper Engine */}
            <motion.div
              initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : -8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <span className="w-1.5 h-4 bg-[#F5C238] rounded-xs inline-block shrink-0" />
              <span className="text-xs sm:text-[13px] font-bold text-[#111111] tracking-wide font-sans">
                Scraper Engine
              </span>
            </motion.div>

            {/* Headline with Yellow Accent Dot */}
            <motion.h2
              initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[50px] font-black text-[#111111] tracking-[-0.03em] leading-[1.08] font-hero"
              style={{
                fontFamily: 'var(--font-inter), var(--font-sans), "Inter", "Plus Jakarta Sans", sans-serif',
              }}
            >
              Automate Property<br />
              Discovery at Scale
              <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#F5C238] ml-2 align-baseline" />
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="mt-4 text-[#666666] font-sans text-sm sm:text-base max-w-lg leading-relaxed"
            >
              Extract verified listings from multiple public sources and turn them into actionable property data.
            </motion.p>

            {/* 3 Features */}
            <div className="mt-8 sm:mt-9 space-y-5 w-full">
              {features.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + idx * 0.08 }}
                  className="flex items-start gap-4"
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-sm sm:text-[15px] font-bold text-[#111111] leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#666666] mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.45 }}
              className="flex flex-wrap items-center gap-3.5 mt-8 sm:mt-10"
            >
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#F5C238] hover:bg-[#E5B228] text-black font-bold text-xs sm:text-sm shadow-xs transition-all duration-200"
              >
                <span>Explore Scraper Engine</span>
                <ArrowRight size={16} />
              </a>

              <button
                type="button"
                onClick={() => setIsDemoOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-[#D5D5D5] hover:border-black text-[#111111] font-bold text-xs sm:text-sm shadow-xs transition-all duration-200 cursor-pointer"
              >
                <Play size={12} className="fill-black stroke-none" />
                <span>See How It Works</span>
              </button>
            </motion.div>
          </div>

          {/* Right Column: Terminal UI + Overlapping Floating Stats */}
          <div className="lg:col-span-6 relative pt-4 pb-12 sm:pb-14">
            {/* Subtle light-grey backdrop card tilted slightly */}
            <div className="absolute top-0 right-0 left-4 bottom-8 bg-[#EDF0F5]/80 rounded-[32px] -z-10 transform -rotate-1 hidden sm:block" />

            {/* Main Dark Terminal Card */}
            <motion.div
              initial={{ opacity: shouldReduceMotion ? 1 : 0, scale: shouldReduceMotion ? 1 : 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative bg-[#191B1F] rounded-3xl p-6 sm:p-7 text-white shadow-2xl border border-white/10"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F5C238] text-black flex items-center justify-center shrink-0 shadow-xs">
                    <Zap size={16} className="stroke-[2.4] fill-black" />
                  </div>
                  <span className="font-bold text-sm sm:text-[15px] text-white tracking-tight">
                    PropFlow Scraper Engine
                  </span>
                </div>

                {/* Live Running Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#182C20] border border-[#22C55E]/30 text-[#22C55E] text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  <span>Running</span>
                </div>
              </div>

              {/* 2-Column Interior */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pb-6">
                {/* Left 6 Columns: Sources Checklist */}
                <div className="sm:col-span-6 space-y-2.5">
                  {/* Housing.com */}
                  <div className="bg-[#24272D] border border-white/5 rounded-xl px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-4.5 h-4.5 rounded bg-[#F5C238] flex items-center justify-center text-black shrink-0">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                      <Home size={15} className="text-neutral-400 shrink-0" />
                      <span className="text-xs sm:text-[13px] font-medium text-white">Housing.com</span>
                    </div>
                    <MoreVertical size={14} className="text-neutral-500 shrink-0" />
                  </div>

                  {/* 99Acres */}
                  <div className="bg-[#24272D] border border-white/5 rounded-xl px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-4.5 h-4.5 rounded bg-[#F5C238] flex items-center justify-center text-black shrink-0">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                      <Globe size={15} className="text-neutral-400 shrink-0" />
                      <span className="text-xs sm:text-[13px] font-medium text-white">99Acres</span>
                    </div>
                    <MoreVertical size={14} className="text-neutral-500 shrink-0" />
                  </div>

                  {/* MagicBricks */}
                  <div className="bg-[#24272D] border border-white/5 rounded-xl px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-4.5 h-4.5 rounded bg-[#F5C238] flex items-center justify-center text-black shrink-0">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                      <MapPin size={15} className="text-neutral-400 shrink-0" />
                      <span className="text-xs sm:text-[13px] font-medium text-white">MagicBricks</span>
                    </div>
                    <MoreVertical size={14} className="text-neutral-500 shrink-0" />
                  </div>

                  {/* Other Sources */}
                  <div className="bg-transparent hover:bg-white/5 rounded-xl px-3 py-2.5 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-4.5 h-4.5 rounded border border-neutral-600 shrink-0" />
                      <LayoutGrid size={15} className="text-neutral-500 shrink-0" />
                      <span className="text-xs sm:text-[13px] font-medium text-neutral-400">Other Sources</span>
                    </div>
                    <MoreVertical size={14} className="text-neutral-600 shrink-0" />
                  </div>
                </div>

                {/* Right 6 Columns: Telemetry & Progress */}
                <div className="sm:col-span-6 flex flex-col justify-between sm:border-l sm:border-white/10 sm:pl-5 pt-2 sm:pt-0">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-neutral-300 font-medium">Scraping in Progress...</span>
                      <span className="font-bold text-white">72%</span>
                    </div>
                    <div className="w-full bg-[#2C3038] h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "72%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="h-full bg-[#F5C238] rounded-full"
                      />
                    </div>
                  </div>

                  {/* Metrics Rows */}
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-white">
                        <Database size={15} className="text-neutral-400" />
                        <span className="font-bold text-sm sm:text-base text-white">8,240</span>
                      </div>
                      <span className="text-neutral-400 text-[11px] sm:text-xs">Listings Found</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-white">
                        <CheckCircle2 size={15} className="text-neutral-400" />
                        <span className="font-bold text-sm sm:text-base text-white">7,982</span>
                      </div>
                      <span className="text-neutral-400 text-[11px] sm:text-xs">Valid Entries</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-white">
                        <Layers size={15} className="text-neutral-400" />
                        <span className="font-bold text-sm sm:text-base text-white">97%</span>
                      </div>
                      <span className="text-neutral-400 text-[11px] sm:text-xs">Data Quality</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating White Bottom Card Overlapping Terminal */}
              <div className="absolute -bottom-7 left-4 right-4 sm:left-6 sm:right-6 bg-white rounded-2xl p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.12)] border border-[#EDEDED] flex items-center justify-between">
                {/* Metric 1 */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <Layers size={22} className="stroke-[2.2] text-[#111111] shrink-0" />
                  <div>
                    <span className="font-black text-base sm:text-lg text-[#111111] block leading-none">
                      3+
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-[#777777] font-medium block mt-1">
                      Data Sources
                    </span>
                  </div>
                </div>

                <div className="w-px h-7 bg-neutral-200" />

                {/* Metric 2 */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <Database size={22} className="stroke-[2.2] text-[#111111] shrink-0" />
                  <div>
                    <span className="font-black text-base sm:text-lg text-[#111111] block leading-none">
                      10K+
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-[#777777] font-medium block mt-1">
                      Listings / Day
                    </span>
                  </div>
                </div>

                <div className="w-px h-7 bg-neutral-200" />

                {/* Metric 3 */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <BarChart2 size={22} className="stroke-[2.2] text-[#111111] shrink-0" />
                  <div>
                    <span className="font-black text-base sm:text-lg text-[#111111] block leading-none">
                      97%
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-[#777777] font-medium block mt-1">
                      Accuracy
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

