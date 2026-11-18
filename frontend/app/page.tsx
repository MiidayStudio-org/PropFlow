import React from "react";
import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { ProblemSolutionSection } from "../components/ProblemSolutionSection";
import { ScraperEngineSection } from "../components/ScraperEngineSection";
import { WorkflowSection } from "../components/WorkflowSection";
import { FinalCTASection } from "../components/FinalCTASection";
import { Footer } from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#111111] font-sans selection:bg-[#F5C238] selection:text-black">
      {/* 1. Header Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. Problem vs Solution Section */}
        <ProblemSolutionSection />

        {/* 4. Scraper Engine Section */}
        <ScraperEngineSection />

        {/* 5. Workflow Section */}
        <WorkflowSection />

        {/* 6. Final Lead Capture CTA Block */}
        <FinalCTASection />
      </main>

      {/* 7. Footer */}
      <Footer />
    </div>
  );
}
