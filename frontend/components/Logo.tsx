"use client";

import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  theme?: "dark" | "light"; // "dark" = dark text for light bg; "light" = white text for dark bg
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export function Logo({
  size = "md",
  theme = "dark",
  showText = true,
  subtitle,
  className = "",
}: LogoProps) {
  const iconSizeClasses = {
    sm: "w-7 h-7 rounded-[8px]",
    md: "w-8 h-8 rounded-[9px]",
    lg: "w-9 h-9 rounded-[10px]",
    xl: "w-11 h-11 rounded-[12px]",
  };

  const textClasses = {
    sm: "text-base font-bold tracking-tight",
    md: "text-lg sm:text-[20px] font-bold tracking-tight",
    lg: "text-2xl font-bold tracking-tight",
    xl: "text-3xl font-extrabold tracking-tight",
  };

  const textColor = theme === "light" ? "text-white" : "text-[#121212]";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Original PropFlow Icon: Yellow Rounded Squircle with Architectural Arch & Knob */}
      <div className={`${iconSizeClasses[size]} shrink-0 shadow-2xs overflow-hidden`}>
        <svg
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Yellow Rounded Squircle */}
          <rect width="512" height="512" rx="96" fill="#F5C238" />

          {/* Outer Arch Shape */}
          <path
            d="M166 438V240C166 190.294 206.294 150 256 150C305.706 150 346 190.294 346 240V438H296V240C296 217.909 278.091 200 256 200C233.909 200 216 217.909 216 240V438H166Z"
            fill="#121212"
          />

          {/* Right Door Panel Block */}
          <path
            d="M296 240C296 217.909 278.091 200 256 200V150C305.706 150 346 190.294 346 240V438H296V240Z"
            fill="#121212"
          />

          {/* Door Knob Dot */}
          <circle cx="260" cy="295" r="16" fill="#121212" />
        </svg>
      </div>

      {/* PropFlow Brand Name & Subtitle */}
      {showText && (
        subtitle ? (
          <div className="flex flex-col justify-center leading-tight">
            <span className={`font-sans font-bold text-[15px] tracking-tight ${textColor}`}>
              PropFlow
            </span>
            <span className="text-[11px] text-neutral-400 font-medium tracking-normal">
              {subtitle}
            </span>
          </div>
        ) : (
          <span className={`font-sans font-bold tracking-tight ${textColor} ${textClasses[size]}`}>
            PropFlow
          </span>
        )
      )}
    </div>
  );
}
