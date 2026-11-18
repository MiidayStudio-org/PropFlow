"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "./icons";
import { Logo } from "./Logo";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: shouldReduceMotion ? 0 : -15, opacity: shouldReduceMotion ? 1 : 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#F4F5F7]/95 backdrop-blur-md border-b border-black/5 py-4 shadow-xs"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between">
          {/* Brand Logo: Clean Official PropFlow Squircle & Wordmark */}
          <a
            href="/"
            className="flex items-center group focus-visible:outline-none"
            aria-label="PropFlow Home"
          >
            <Logo size="md" theme="dark" className="group-hover:opacity-95 transition-opacity" />
          </a>

          {/* Navigation Links (Uppercase & Tracked) */}
          <nav
            className="hidden md:flex items-center gap-8 lg:gap-10 text-xs font-semibold tracking-widest"
            aria-label="Main Navigation"
          >
            <a
              href="/"
              className="text-[#111111] font-bold hover:text-black transition-colors"
            >
              HOME
            </a>
            <a
              href="#problem-solution"
              className="text-[#333333] hover:text-black transition-colors"
            >
              SOLUTIONS
            </a>
            <a
              href="#scraper-service"
              className="text-[#333333] hover:text-black transition-colors"
            >
              SCRAPER ENGINE
            </a>
            <a
              href="#workflow"
              className="text-[#333333] hover:text-black transition-colors"
            >
              WORKFLOW
            </a>
          </nav>

          {/* Action: GET STARTED Outline Button */}
          <div className="hidden md:flex items-center">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xs border border-[#111111] text-[#111111] text-xs font-bold tracking-widest uppercase hover:bg-[#111111] hover:text-white transition-all duration-200"
            >
              GET STARTED
            </a>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center md:hidden gap-3">
            <a
              href="/dashboard"
              className="text-[11px] font-bold tracking-wider uppercase bg-[#111111] text-white px-3 py-1.5 rounded-xs"
            >
              GET STARTED
            </a>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded text-neutral-800 hover:text-black border border-black/15"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-black/10 bg-[#F4F5F7]/98 backdrop-blur-xl px-6 pt-4 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2.5 text-xs font-bold tracking-widest text-[#333333]">
            <a
              href="/"
              onClick={() => setIsOpen(false)}
              className="py-1.5 text-[#111111]"
            >
              HOME
            </a>
            <a
              href="#problem-solution"
              onClick={() => setIsOpen(false)}
              className="py-1.5 hover:text-black"
            >
              SOLUTIONS
            </a>
            <a
              href="#scraper-service"
              onClick={() => setIsOpen(false)}
              className="py-1.5 hover:text-black"
            >
              SCRAPER ENGINE
            </a>
            <a
              href="#workflow"
              onClick={() => setIsOpen(false)}
              className="py-1.5 hover:text-black"
            >
              WORKFLOW
            </a>
          </nav>
        </div>
      )}
    </motion.header>
  );
}
