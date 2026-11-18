"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play, Check } from "./icons";
import { DemoModal } from "./DemoModal";

export function FinalCTASection() {
  const shouldReduceMotion = useReducedMotion();
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const benefits = [
    "Automated Property Data",
    "AI-Powered Lead Matching",
    "Faster Deal Conversions",
  ];

  return (
    <section id="cta" className="py-12 sm:py-16 lg:py-20 bg-[#FFFFFF] text-[#111111] select-none w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="w-full relative rounded-2xl sm:rounded-3xl bg-[#131417] text-white p-8 sm:p-12 lg:p-14 xl:p-16 border border-white/5 shadow-2xl overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-8 w-full">
            {/* Left Content */}
            <div className="flex-1 max-w-3xl">
              {/* Tag: Yellow Bar + Get Started with PropFlow */}
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-1.5 h-4 bg-[#F5C238] rounded-xs inline-block shrink-0" />
                <span className="text-xs sm:text-[13px] font-bold text-white tracking-wide font-sans">
                  Get Started with PropFlow
                </span>
              </div>

              {/* Headline with Yellow Accent Dot */}
              <h2
                className="text-3xl sm:text-4xl lg:text-[44px] xl:text-[48px] font-black text-white tracking-[-0.03em] leading-[1.1] font-hero"
                style={{
                  fontFamily: 'var(--font-inter), var(--font-sans), "Inter", "Plus Jakarta Sans", sans-serif',
                }}
              >
                Ready to Turn<br />
                Property Data into Deals?
                <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#F5C238] ml-2 align-baseline" />
              </h2>

              {/* Subheading */}
              <p className="mt-4 text-neutral-400 font-sans text-sm sm:text-base max-w-md leading-relaxed">
                Automate discovery, find the right leads, and close deals faster with PropFlow.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 mt-8 sm:mt-10">
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#F5C238] hover:bg-[#E5B228] text-black font-bold text-xs sm:text-sm shadow-xs transition-all duration-200"
                >
                  <span>Get Started Today</span>
                  <ArrowRight size={16} />
                </a>

                <button
                  type="button"
                  onClick={() => setIsDemoOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-transparent border border-white/20 hover:border-white text-white font-bold text-xs sm:text-sm shadow-xs transition-all duration-200 cursor-pointer"
                >
                  <Play size={12} className="fill-white stroke-none" />
                  <span>Watch Demo</span>
                </button>
              </div>
            </div>

            {/* Vertical Divider Line (Desktop) */}
            <div className="hidden lg:block w-px h-40 bg-white/10 shrink-0 mx-2 xl:mx-6" />

            {/* Right Side: Benefits Checklist */}
            <div className="flex flex-col justify-center space-y-5 lg:min-w-[280px] xl:min-w-[320px]">
              {benefits.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3.5">
                  <div className="w-6 h-6 rounded-md bg-[#F5C238] text-black flex items-center justify-center shrink-0 shadow-xs">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-white tracking-tight font-sans">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </section>
  );
}
