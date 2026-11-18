"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Layers, Database, Sparkles, Handshake, ArrowRight, Play } from "./icons";
import { DemoModal } from "./DemoModal";

interface WorkflowStep {
  step: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

export function WorkflowSection() {
  const shouldReduceMotion = useReducedMotion();
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const steps: WorkflowStep[] = [
    {
      step: "01",
      title: "Scrape",
      desc: "Collect listings from multiple trusted sources.",
      icon: <Layers size={22} className="stroke-[2.2] text-[#111111]" />,
    },
    {
      step: "02",
      title: "Enrich",
      desc: "Clean, structure, and add key property details.",
      icon: <Database size={22} className="stroke-[2.2] text-[#111111]" />,
    },
    {
      step: "03",
      title: "Match",
      desc: "Use AI to find the right properties and leads.",
      icon: <Sparkles size={22} className="stroke-[2.2] text-[#111111]" />,
    },
    {
      step: "04",
      title: "Convert",
      desc: "Turn matched opportunities into real deals.",
      icon: <Handshake size={22} className="stroke-[2.2] text-[#111111]" />,
    },
  ];

  return (
    <section
      id="workflow"
      className="py-20 sm:py-24 lg:py-28 bg-[#FFFFFF] text-[#111111] border-b border-[#EEEEEE] scroll-mt-20 select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center">
          {/* Top Tag: Yellow Bar + Workflow */}
          <motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : -8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <span className="w-1.5 h-4 bg-[#F5C238] rounded-xs inline-block shrink-0" />
            <span className="text-xs sm:text-[13px] font-bold text-[#111111] tracking-wide font-sans">
              Workflow
            </span>
          </motion.div>

          {/* Heading with Yellow Accent Period Dot */}
          <motion.h2
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black text-[#111111] tracking-[-0.03em] leading-[1.08] font-hero"
            style={{
              fontFamily: 'var(--font-inter), var(--font-sans), "Inter", "Plus Jakarta Sans", sans-serif',
            }}
          >
            How PropFlow Works
            <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#F5C238] ml-2 align-baseline" />
          </motion.h2>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="mt-4 sm:mt-5 text-[#666666] font-sans text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            From data collection to deal closure, a simple and automated workflow.
          </motion.p>
        </div>

        {/* 4 Step Cards Pipeline with Connecting Line & Nodes */}
        <div className="mt-12 sm:mt-16">
          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 relative">
            {steps.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                className="rounded-2xl bg-white border border-[#EAEAEA] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#D0D0D0] transition-all duration-300 flex flex-col items-start h-full relative"
              >
                {/* Horizontal Pipeline Connector between this card and the next card */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-[52%] left-full w-6 xl:w-8 -translate-y-1/2 items-center justify-center z-20 pointer-events-none">
                    {/* Continuous grey connecting line */}
                    <div className="w-full h-[1.5px] bg-[#E5E5E5]" />
                    {/* Perfectly centered yellow ring node */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-[#F5C238] bg-white shrink-0 shadow-2xs" />
                  </div>
                )}

                {/* Icon Box */}
                <div className="w-12 h-12 rounded-xl bg-[#F4F5F7] text-black flex items-center justify-center mb-6 shrink-0 shadow-2xs">
                  {item.icon}
                </div>

                {/* Step Number */}
                <span className="text-xs font-bold text-[#888888] tracking-wider block mb-1">
                  {item.step}
                </span>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-bold text-[#111111] leading-snug mb-1.5">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-[13px] text-[#666666] leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Buttons */}
        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3.5 mt-12 sm:mt-14"
        >
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#F5C238] hover:bg-[#E5B228] text-black font-bold text-xs sm:text-sm shadow-xs transition-all duration-200"
          >
            <span>See Full Workflow</span>
            <ArrowRight size={16} />
          </a>

          <button
            type="button"
            onClick={() => setIsDemoOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-[#D5D5D5] hover:border-black text-[#111111] font-bold text-xs sm:text-sm shadow-xs transition-all duration-200 cursor-pointer"
          >
            <Play size={12} className="fill-black stroke-none" />
            <span>Watch Demo</span>
          </button>
        </motion.div>
      </div>

      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </section>
  );
}
