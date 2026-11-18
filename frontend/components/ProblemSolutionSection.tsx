"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Clock, Zap, Layers, Database, TrendingUp, Target } from "./icons";

interface ComparisonCard {
  problemIcon: React.ReactNode;
  problemTitle: string;
  problemDesc: string;
  solutionIcon: React.ReactNode;
  solutionTitle: string;
  solutionDesc: string;
}

export function ProblemSolutionSection() {
  const shouldReduceMotion = useReducedMotion();

  const cards: ComparisonCard[] = [
    {
      problemIcon: <Clock size={20} className="stroke-[2.2]" />,
      problemTitle: "Manual & Time-Consuming",
      problemDesc: "Finding and tracking properties takes hours.",
      solutionIcon: <Zap size={20} className="stroke-[2.2] fill-black" />,
      solutionTitle: "Automated Scraping",
      solutionDesc: "Get fresh listings from multiple sources instantly.",
    },
    {
      problemIcon: <Layers size={20} className="stroke-[2.2]" />,
      problemTitle: "Scattered & Incomplete Data",
      problemDesc: "Listings are spread across platforms with inconsistent information.",
      solutionIcon: <Database size={20} className="stroke-[2.2]" />,
      solutionTitle: "Unified Property Data",
      solutionDesc: "Get clean, deduplicated, and structured data in one place.",
    },
    {
      problemIcon: <TrendingUp size={20} className="stroke-[2.2]" />,
      problemTitle: "Low Deal Conversion",
      problemDesc: "Good leads often get missed due to lack of timely insights.",
      solutionIcon: <Target size={20} className="stroke-[2.2]" />,
      solutionTitle: "Higher Deal Success",
      solutionDesc: "AI lead matching, deal insights, and a built-in CRM to close more deals.",
    },
  ];

  return (
    <section
      id="problem-solution"
      className="py-20 sm:py-24 lg:py-28 bg-[#FFFFFF] text-[#111111] border-b border-[#EEEEEE] scroll-mt-20 select-none"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center">
          {/* Top Tag: Yellow Bar + Problem vs Solution */}
          <motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : -8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <span className="w-1.5 h-4 bg-[#F5C238] rounded-xs inline-block shrink-0" />
            <span className="text-xs sm:text-[13px] font-bold text-[#111111] tracking-wide font-sans">
              Problem vs Solution
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
            Real Estate Challenges,<br />
            Solved with PropFlow
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
            From scattered data to closed deals, PropFlow removes the friction from modern real estate operations.
          </motion.p>
        </div>

        {/* 3 Problem vs Solution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 mt-12 sm:mt-16">
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
              className="rounded-2xl sm:rounded-[22px] bg-white border border-[#EAEAEA] p-6 sm:p-7 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#D8D8D8] transition-all duration-300 flex flex-col justify-between"
            >
              {/* Problem Block */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#F4F5F7] text-[#111111] flex items-center justify-center shrink-0">
                  {card.problemIcon}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#888888] font-medium tracking-wide">
                    Problem
                  </span>
                  <h3 className="text-[15px] sm:text-base font-bold text-[#111111] mt-0.5 leading-snug">
                    {card.problemTitle}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#666666] mt-1 leading-relaxed">
                    {card.problemDesc}
                  </p>
                </div>
              </div>

              {/* Thin Divider Line */}
              <div className="w-full h-px bg-[#EDEDED] my-5 sm:my-6" />

              {/* Solution Block */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#F5C238] text-black flex items-center justify-center shrink-0 shadow-xs">
                  {card.solutionIcon}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#888888] font-medium tracking-wide">
                    Solution
                  </span>
                  <h3 className="text-[15px] sm:text-base font-bold text-[#111111] mt-0.5 leading-snug">
                    {card.solutionTitle}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#666666] mt-1 leading-relaxed">
                    {card.solutionDesc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
