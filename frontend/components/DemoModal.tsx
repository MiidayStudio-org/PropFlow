"use client";

import React, { useState, useEffect } from "react";
import { X, Play, Zap, Sparkles, Handshake, CheckCircle2 } from "./icons";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function DemoModal({ isOpen, onClose, title = "PropFlow Interactive Architecture Demo" }: DemoModalProps) {
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md select-none font-sans"
    >
      <div className="relative w-full max-w-4xl bg-[#0E0F12] border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#14151A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F5C238] text-black flex items-center justify-center font-bold text-xs">
              PF
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">{title}</h3>
              <p className="text-[11px] text-neutral-400">Live system walkthrough and workflow telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-white/10 bg-[#121318] px-6 text-xs font-semibold overflow-x-auto">
          {[
            { label: "1. Scraping Engine", icon: <Zap size={14} className="text-[#F5C238]" /> },
            { label: "2. AI Match Scoring", icon: <Sparkles size={14} className="text-[#F5C238]" /> },
            { label: "3. CRM & Deal Closure", icon: <Handshake size={14} className="text-[#F5C238]" /> },
          ].map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx as 0 | 1 | 2)}
              className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeStep === idx
                  ? "border-[#F5C238] text-[#F5C238] font-bold"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Visual Simulated Screen Area */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6 bg-[#0E0F12]">
          {activeStep === 0 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#18191F] border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#22C55E] font-mono flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
                    LIVE SCRAPER CLUSTER: 3 THREADS ACTIVE
                  </span>
                  <span className="text-neutral-400">Target: Maharashtra Micro-Markets</span>
                </div>
                <div className="font-mono text-xs text-neutral-300 space-y-1 bg-[#101115] p-3 rounded-xl border border-white/5">
                  <p className="text-[#22C55E]">✓ Housing.com: Ingested 18 listings from Dombivli East & Worli</p>
                  <p className="text-[#22C55E]">✓ 99Acres: 12 verified builder entries extracted</p>
                  <p className="text-neutral-400">→ Normalizing price currencies, carpet areas (sqft), and RERA coordinates...</p>
                  <p className="text-[#F5C238]">★ 30 new records deduplicated and upserted into PostgreSQL database</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-neutral-400 block">Scraped Today</span>
                  <span className="text-xl font-bold text-white mt-1 block">8,240</span>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-neutral-400 block">Deduplication Rate</span>
                  <span className="text-xl font-bold text-[#F5C238] mt-1 block">99.4%</span>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-neutral-400 block">Average Latency</span>
                  <span className="text-xl font-bold text-[#22C55E] mt-1 block">850 ms</span>
                </div>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#18191F] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-[#F5C238]" />
                    AI Instant Buyer Fit Calculator
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FFF7D6] text-[#A17000] text-xs font-bold">
                    96% High Fit
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#101115] border border-white/5 text-xs space-y-2">
                  <div className="flex justify-between text-neutral-300">
                    <span>Lead: Vikram Malhotra (2 BHK in Dombivli, Budget: ₹80L-₹95L)</span>
                    <span className="text-[#22C55E] font-bold">Matched: Lodha Lakeshore Greens</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="w-[96%] h-full bg-[#F5C238] rounded-full" />
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Budget Fit: 40/40 • BHK Configuration: 30/30 • Locality & Amenities: 26/30
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#18191F] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E]" />
                    Automated WhatsApp Walkthrough Dispatch
                  </span>
                  <span className="text-xs text-[#22C55E] font-bold">Ready for Site Visit</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed bg-[#101115] p-3.5 rounded-xl border border-white/5">
                  &quot;Hi Vikram, Vikram here from PropFlow! We found a 96% matching 2 BHK home at Lodha Lakeshore Greens in Dombivli East (₹85L). Would you like to schedule a physical walkthrough this Saturday?&quot;
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#14151A] flex items-center justify-between text-xs">
          <span className="text-neutral-400">Step {activeStep + 1} of 3</span>
          <div className="flex items-center gap-3">
            {activeStep > 0 && (
              <button
                onClick={() => setActiveStep((prev) => (prev - 1) as 0 | 1 | 2)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer transition-colors"
              >
                Previous
              </button>
            )}
            {activeStep < 2 ? (
              <button
                onClick={() => setActiveStep((prev) => (prev + 1) as 0 | 1 | 2)}
                className="px-5 py-2 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black font-bold cursor-pointer transition-colors"
              >
                Next Step
              </button>
            ) : (
              <a
                href="/dashboard"
                className="px-5 py-2 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black font-bold cursor-pointer transition-colors"
              >
                Open Dashboard →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

