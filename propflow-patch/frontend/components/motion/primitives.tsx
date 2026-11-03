"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";

// ==========================================
// 1. COUNT UP PRIMITIVE
// ==========================================
interface CountUpProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function CountUp({
  value,
  duration = 1.2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: CountUpProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? value : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const startTime = performance.now();
    const durationMs = duration * 1000;

    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out quad
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(end);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [value, duration, shouldReduceMotion]);

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString("en-IN");

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

// ==========================================
// 2. SCROLL FLOAT (PARALLAX / TILT)
// ==========================================
interface ScrollFloatProps {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}

export function ScrollFloat({
  children,
  offset = 24,
  className = "",
}: ScrollFloatProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [4, 0, -4]);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      style={{ y, rotateX, transformPerspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ==========================================
// 3. BOB (FLOATING BADGES / CHIPS)
// ==========================================
interface BobProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}

export function Bob({
  children,
  delay = 0,
  duration = 3.5,
  distance = 7,
  className = "",
}: BobProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [-distance, distance, -distance] }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ==========================================
// 4. REVEAL (ENTRANCE ANIMATION)
// ==========================================
interface RevealProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
}

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className = "",
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const offset = 32;
  const initialMap = {
    up: { opacity: 0, y: offset },
    down: { opacity: 0, y: -offset },
    left: { opacity: 0, x: offset },
    right: { opacity: 0, x: -offset },
  };

  return (
    <motion.div
      initial={initialMap[direction]}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ==========================================
// 5. SCALE IN
// ==========================================
interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
}: ScaleInProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ==========================================
// 6. MAGNETIC HOVER
// ==========================================
interface MagneticProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export function Magnetic({
  children,
  strength = 15,
  className = "",
}: MagneticProps) {
  const shouldReduceMotion = useReducedMotion();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = ((e.clientX - (left + width / 2)) / (width / 2)) * strength;
    const y = ((e.clientY - (top + height / 2)) / (height / 2)) * strength;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", damping: 15, stiffness: 200, mass: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ==========================================
// 7. PINNED STEPS (WORKFLOW SECTION)
// ==========================================
export interface StepData {
  step: string;
  phase: string;
  title: string;
  tag: string;
  tagColor: string;
  summary: string;
  details: { label: string; val: string }[];
  highlight: string;
}

interface PinnedStepsProps {
  steps: StepData[];
  activeStepIndex: number;
  onSelectStep: (idx: number) => void;
  renderDetail: (step: StepData, idx: number) => React.ReactNode;
  className?: string;
}

export function PinnedSteps({
  steps,
  activeStepIndex,
  onSelectStep,
  renderDetail,
  className = "",
}: PinnedStepsProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Step Tabs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 font-sans">
        {steps.map((item, idx) => {
          const isActive = activeStepIndex === idx;
          return (
            <motion.button
              key={idx}
              type="button"
              onClick={() => onSelectStep(idx)}
              whileHover={{ scale: shouldReduceMotion ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-3.5 rounded-2xl border text-left transition-colors duration-200 flex flex-col justify-between cursor-pointer ${
                isActive
                  ? "bg-[#FF5C1C] border-[#FF5C1C] text-white shadow-md"
                  : "bg-[#1B1B1B] border-[#262626] text-slate-300 hover:bg-[#262626]"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xl font-serif font-bold">{item.step}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive ? "bg-white" : "bg-slate-500"
                  }`}
                />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase truncate">
                {item.phase}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Cross-fading Detail Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStepIndex}
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : -12 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {renderDetail(steps[activeStepIndex], activeStepIndex)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
