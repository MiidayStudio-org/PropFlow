"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Users,
  Search,
  Bell,
  Sparkles,
  TrendingUp,
  MapPin,
  Calendar,
  Plus,
  UserPlus,
  LogOut,
  CheckCircle2,
  Briefcase,
  X,
  MessageSquare,
  DollarSign,
} from "@/components/icons";
import {
  useDashboard,
  useLeads,
  useProperties,
  useSiteVisits,
  useDeals,
  useBrokers,
  createLead,
  createSiteVisit,
  createBroker,
  updateSiteVisit,
  formatINR,
  cleanPhoneForWhatsApp,
  LeadItem,
  PropertyItem,
  SiteVisitItem,
  DealItem,
  TeamMemberItem,
} from "@/lib/api";

// ==========================================
// DATA TYPES
// ==========================================
export type TabType = "overview" | "leads" | "properties" | "visits" | "deals" | "team" | "ai-copilot";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIntentFilter, setSelectedIntentFilter] = useState<string>("All");

  // Modals state
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isScheduleVisitOpen, setIsScheduleVisitOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Form states for Add Lead
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadBhk, setNewLeadBhk] = useState("2 BHK");
  const [newLeadLocation, setNewLeadLocation] = useState("Dombivli East");
  const [newLeadBudgetMin, setNewLeadBudgetMin] = useState(8000000);
  const [newLeadBudgetMax, setNewLeadBudgetMax] = useState(9500000);
  const [newLeadIntent, setNewLeadIntent] = useState<"High" | "Medium" | "Low">("High");

  // Form states for Invite Member
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMemberItem["role"]>("Senior Broker");

  // Form states for Schedule Visit
  const [visitLeadId, setVisitLeadId] = useState("");
  const [visitPropertyId, setVisitPropertyId] = useState("");
  const [visitDateTime, setVisitDateTime] = useState("");
  const [visitAgent, setVisitAgent] = useState("Aarav Sharma");

  // Real Data Hooks
  const { data: dashboardData, loading: dashLoading, reload: reloadDashboard } = useDashboard();
  const { leads, loading: leadsLoading, reload: reloadLeads } = useLeads(
    selectedIntentFilter === "All" ? undefined : selectedIntentFilter,
    searchQuery
  );
  const { properties, loading: propsLoading } = useProperties({ q: searchQuery });
  const { visits: siteVisits, loading: visitsLoading, reload: reloadVisits } = useSiteVisits();
  const { deals, loading: dealsLoading, reload: reloadDeals } = useDeals();
  const { brokers: team, loading: teamLoading, reload: reloadTeam } = useBrokers();

  // Show temporary toast feedback
  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 4000);
  };

  // Add Lead Handler (POST /api/leads)
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) return;

    try {
      const created = await createLead({
        name: newLeadName,
        phone: newLeadPhone,
        email: newLeadEmail || undefined,
        preferredBhk: newLeadBhk,
        preferredLocalities: [newLeadLocation],
        budgetMin: Number(newLeadBudgetMin),
        budgetMax: Number(newLeadBudgetMax),
        intent: newLeadIntent,
      });

      setIsAddLeadOpen(false);
      setNewLeadName("");
      setNewLeadPhone("");
      setNewLeadEmail("");
      showToast(`Lead "${created.name}" added successfully with instant AI matching!`);
      reloadLeads();
      reloadDashboard();
    } catch (err: any) {
      showToast(err.message || "Failed to create lead");
    }
  };

  // Invite Team Member Handler (POST /api/brokers)
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    try {
      const created = await createBroker({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        avatar: inviteName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      });

      setIsInviteModalOpen(false);
      setInviteEmail("");
      setInviteName("");
      showToast(`Invitation sent to ${created.email} for role: ${created.role}`);
      reloadTeam();
      reloadDashboard();
    } catch (err: any) {
      showToast(err.message || "Failed to invite member");
    }
  };

  // Schedule Visit Handler (POST /api/site-visits)
  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitLeadId || !visitDateTime) return;

    try {
      await createSiteVisit({
        leadId: visitLeadId,
        propertyId: visitPropertyId || null,
        scheduledAt: new Date(visitDateTime).toISOString(),
        agentName: visitAgent,
      });

      setIsScheduleVisitOpen(false);
      setVisitLeadId("");
      setVisitPropertyId("");
      setVisitDateTime("");
      showToast("Site visit scheduled successfully.");
      reloadVisits();
      reloadLeads();
      reloadDashboard();
    } catch (err: any) {
      showToast(err.message || "Failed to schedule visit");
    }
  };

  // Confirm Visit Handler (PATCH /api/site-visits/:id)
  const handleConfirmVisit = async (visitId: string, leadName: string) => {
    try {
      await updateSiteVisit(visitId, { status: "Confirmed" });
      showToast(`Visit for ${leadName} confirmed.`);
      reloadVisits();
      reloadDashboard();
    } catch (err: any) {
      showToast(err.message || "Failed to confirm visit");
    }
  };

  // Helper WhatsApp generator
  const getWhatsAppLink = (phone: string, name: string, propTitle?: string) => {
    const cleanDigits = cleanPhoneForWhatsApp(phone);
    const msg = propTitle
      ? `Hi ${name}, Vikram here from PropIQ! We found a high-scoring matching property for your requirement: "${propTitle}". Would you like to schedule a physical walkthrough this weekend?`
      : `Hi ${name}, Vikram here from PropIQ! I have updated property intelligence matching your requirements. Let me know when you'd like to connect.`;
    return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(msg)}`;
  };

  // Safe KPI counts
  const totalLeadsCount = dashboardData?.counts.leads ?? leads.length;
  const totalPropsCount = dashboardData?.counts.properties ?? properties.length;
  const totalVisitsCount = dashboardData?.counts.visits ?? siteVisits.length;
  const totalDealsCount = dashboardData?.counts.deals ?? deals.length;
  const totalTeamCount = dashboardData?.counts.team ?? team.length;

  const activePipelineVal = dashboardData?.kpis.activePipeline || 0;
  const growthPct = dashboardData?.kpis.leadsGrowthPct ?? null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#111111] flex font-sans antialiased selection:bg-[#FF5C1C] selection:text-white">
      {/* Toast Notification Banner */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#111111] text-white shadow-2xl border border-[#262626]">
          <CheckCircle2 size={18} className="text-[#FF5C1C] shrink-0" />
          <span className="text-sm font-medium">{notificationMsg}</span>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ============================================================
          SIDEBAR NAVIGATION (Editorial Design System)
         ============================================================ */}
      <aside className="w-64 border-r border-[#EAE3D8] bg-[#FAF7F2] flex flex-col justify-between hidden md:flex shrink-0 z-30">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-[#EAE3D8] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-[#FF5C1C] p-1 flex items-center justify-center text-white font-bold shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Image
                  src="/logo.svg"
                  alt="PropIQ Logo"
                  width={24}
                  height={24}
                  className="w-full h-full object-contain filter invert brightness-200"
                />
              </div>
              <div>
                <span className="text-xl font-serif font-bold tracking-tight text-[#111111] leading-none block">PropIQ</span>
                <span className="text-[10px] font-sans font-bold text-[#FF5C1C] tracking-wider block mt-0.5">AGENCY WORKSPACE</span>
              </div>
            </Link>
          </div>

          {/* Nav List */}
          <nav className="p-4 space-y-1.5 text-xs font-medium" aria-label="Dashboard Navigation">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-[#111111] text-white font-bold shadow-xs border-l-4 border-[#FF5C1C]"
                  : "text-[#111111]/70 hover:text-[#111111] hover:bg-[#FDEEE6]/50 font-semibold"
              }`}
            >
              <TrendingUp size={17} className={activeTab === "overview" ? "text-[#FF5C1C]" : ""} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("leads")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                activeTab === "leads"
                  ? "bg-[#111111] text-white font-bold shadow-xs border-l-4 border-[#FF5C1C]"
                  : "text-[#111111]/70 hover:text-[#111111] hover:bg-[#FDEEE6]/50 font-semibold"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={17} className={activeTab === "leads" ? "text-[#FF5C1C]" : ""} />
                <span>Leads & Buyers</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "leads" ? "bg-[#FF5C1C] text-white" : "bg-[#FDEEE6] text-[#FF5C1C]"
              }`}>
                {totalLeadsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("properties")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                activeTab === "properties"
                  ? "bg-[#111111] text-white font-bold shadow-xs border-l-4 border-[#FF5C1C]"
                  : "text-[#111111]/70 hover:text-[#111111] hover:bg-[#FDEEE6]/50 font-semibold"
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 size={17} className={activeTab === "properties" ? "text-[#FF5C1C]" : ""} />
                <span>Properties</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111]/70">
                {totalPropsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("visits")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                activeTab === "visits"
                  ? "bg-[#111111] text-white font-bold shadow-xs border-l-4 border-[#FF5C1C]"
                  : "text-[#111111]/70 hover:text-[#111111] hover:bg-[#FDEEE6]/50 font-semibold"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar size={17} className={activeTab === "visits" ? "text-[#FF5C1C]" : ""} />
                <span>Site Visits</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-[#FDEEE6] text-[#FF5C1C]">
                {totalVisitsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("deals")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                activeTab === "deals"
                  ? "bg-[#111111] text-white font-bold shadow-xs border-l-4 border-[#FF5C1C]"
                  : "text-[#111111]/70 hover:text-[#111111] hover:bg-[#FDEEE6]/50 font-semibold"
              }`}
            >
              <Briefcase size={17} className={activeTab === "deals" ? "text-[#FF5C1C]" : ""} />
              <span>Deal Pipeline</span>
            </button>

            <button
              onClick={() => setActiveTab("team")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                activeTab === "team"
                  ? "bg-[#111111] text-white font-bold shadow-xs border-l-4 border-[#FF5C1C]"
                  : "text-[#111111]/70 hover:text-[#111111] hover:bg-[#FDEEE6]/50 font-semibold"
              }`}
            >
              <div className="flex items-center gap-3">
                <UserPlus size={17} className={activeTab === "team" ? "text-[#FF5C1C]" : ""} />
                <span>Team & Invites</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                {totalTeamCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("ai-copilot")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                activeTab === "ai-copilot"
                  ? "bg-[#111111] text-white font-bold shadow-xs border-l-4 border-[#FF5C1C]"
                  : "text-[#111111]/70 hover:text-[#111111] hover:bg-[#FDEEE6]/50 font-semibold"
              }`}
            >
              <Sparkles size={17} className="text-[#FF5C1C]" />
              <span>AI Match Engine</span>
            </button>
          </nav>
        </div>

        {/* User Account & Sign Out */}
        <div className="p-4 border-t border-[#EAE3D8] space-y-3">
          <div className="p-3.5 rounded-2xl bg-white border border-[#EAE3D8] flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[#FF5C1C] text-white font-serif font-bold text-xs flex items-center justify-center">
              AS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#111111] truncate">Aarav Sharma</p>
              <p className="text-[11px] text-slate-500 truncate">Senior Broker • Admin</p>
            </div>
          </div>

          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-xs font-bold text-slate-600 hover:text-[#FF5C1C] hover:bg-[#FDEEE6]/60 transition-colors"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* ============================================================
          MAIN CONTENT AREA
         ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top App Bar */}
        <header className="sticky top-0 z-20 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#EAE3D8] px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads, BHK, locations, properties..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white border border-[#EAE3D8] text-xs sm:text-sm text-[#111111] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5C1C]/30 focus:border-[#FF5C1C] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#111111] text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FDEEE6] hover:bg-[#FDEEE6]/80 text-[#FF5C1C] text-xs font-bold transition-all border border-[#FF5C1C]/20 cursor-pointer"
            >
              <UserPlus size={15} />
              <span>Invite Team</span>
            </button>

            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF5C1C] hover:bg-[#E04809] text-white text-xs font-bold transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Lead</span>
            </button>

            {/* Notification Icon */}
            <div className="relative p-2.5 rounded-full bg-white border border-[#EAE3D8] text-[#111111] hover:text-[#FF5C1C] cursor-pointer transition-colors shadow-xs">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5C1C]" />
            </div>
          </div>
        </header>

        {/* Mobile Navigation Pills */}
        <div className="flex md:hidden overflow-x-auto gap-2 p-3 bg-[#FAF7F2] border-b border-[#EAE3D8] text-xs font-medium shrink-0">
          {(["overview", "leads", "properties", "visits", "deals", "team", "ai-copilot"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-full capitalize shrink-0 font-bold cursor-pointer ${
                activeTab === tab ? "bg-[#FF5C1C] text-white" : "bg-white border border-[#EAE3D8] text-slate-700"
              }`}
            >
              {tab.replace("-", " ")}
            </button>
          ))}
        </div>

        {/* Main Dashboard Body */}
        <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* ============================================================
              TAB: OVERVIEW
             ============================================================ */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Executive Welcome Greeting */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAE3D8]">
                <div>
                  <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-[#111111]">
                    Welcome back, Aarav 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Here is what is happening across your PropIQ Real Estate Agency pipeline today.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FDEEE6] text-[#FF5C1C] border border-[#FF5C1C]/20 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#FF5C1C] animate-pulse" />
                    PropIQ AI Telemetry Active
                  </span>
                </div>
              </div>

              {/* KPI Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Metric 1 */}
                <div className="p-6 rounded-3xl bg-white border border-[#EAE3D8] shadow-xs hover:border-[#FF5C1C]/40 transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Total Active Leads</span>
                    <div className="p-2.5 rounded-2xl bg-[#FDEEE6] text-[#FF5C1C]">
                      <Users size={18} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-serif font-bold text-[#111111]">{totalLeadsCount}</div>
                    {growthPct !== null ? (
                      <div className="text-xs text-emerald-700 font-bold flex items-center gap-1 mt-1">
                        <TrendingUp size={13} /> +{growthPct}% from last week
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 font-medium mt-1">Live database total</div>
                    )}
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="p-6 rounded-3xl bg-white border border-[#EAE3D8] shadow-xs hover:border-[#FF5C1C]/40 transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Active Deal Pipeline</span>
                    <div className="p-2.5 rounded-2xl bg-[#FDEEE6] text-[#FF5C1C]">
                      <DollarSign size={18} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-serif font-bold text-[#111111]">
                      {formatINR(activePipelineVal)}
                    </div>
                    <div className="text-xs text-emerald-700 font-bold flex items-center gap-1 mt-1">
                      <TrendingUp size={13} /> {totalDealsCount > 0 ? `${totalDealsCount} deals in pipeline` : "Live telemetry"}
                    </div>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="p-6 rounded-3xl bg-white border border-[#EAE3D8] shadow-xs hover:border-[#FF5C1C]/40 transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Scheduled Site Visits</span>
                    <div className="p-2.5 rounded-2xl bg-[#FDEEE6] text-[#FF5C1C]">
                      <Calendar size={18} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-serif font-bold text-[#111111]">{totalVisitsCount}</div>
                    <div className="text-xs text-[#FF5C1C] font-bold flex items-center gap-1 mt-1">
                      Upcoming this weekend
                    </div>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="p-6 rounded-3xl bg-white border border-[#EAE3D8] shadow-xs hover:border-[#FF5C1C]/40 transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Team Members</span>
                    <div className="p-2.5 rounded-2xl bg-[#FDEEE6] text-[#FF5C1C]">
                      <UserPlus size={18} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-serif font-bold text-[#111111]">{totalTeamCount} Brokers</div>
                    <div className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-1">
                      Active agency roster
                    </div>
                  </div>
                </div>
              </div>

              {/* Split Content: High Priority Leads + Upcoming Site Visits */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* High Priority Leads (Cols 1-7) */}
                <div className="lg:col-span-7 rounded-3xl bg-white border border-[#EAE3D8] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#EAE3D8] pb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-[#FF5C1C]" />
                      <h3 className="text-lg font-serif font-bold text-[#111111]">AI Priority Matched Leads</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("leads")}
                      className="text-xs font-bold text-[#FF5C1C] hover:underline cursor-pointer"
                    >
                      View All Leads →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {dashLoading ? (
                      <div className="p-8 text-center text-xs text-slate-400">Loading priority matches...</div>
                    ) : dashboardData && dashboardData.priorityMatches.length > 0 ? (
                      dashboardData.priorityMatches.slice(0, 4).map((item) => (
                        <div
                          key={item.leadId}
                          onClick={() => {
                            const fullLead = leads.find((l) => l.id === item.leadId);
                            if (fullLead) setSelectedLead(fullLead);
                          }}
                          className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] hover:border-[#FF5C1C]/50 hover:bg-[#FDEEE6]/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-bold text-[#111111] text-base">{item.leadName}</span>
                              <span className="px-2.5 py-0.5 rounded-full bg-[#FDEEE6] text-[#FF5C1C] text-[10px] font-extrabold border border-[#FF5C1C]/20">
                                {item.matchScore}% Match
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {item.leadBhk} • {item.leadLocation} • <span className="font-bold text-[#111111]">{item.leadBudget}</span>
                            </p>
                            <p className="text-xs text-[#FF5C1C] font-semibold flex items-center gap-1">
                              <Building2 size={13} /> {item.matchedProperty}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-[#FAF7F2] rounded-2xl border border-[#EAE3D8]">
                        <p className="text-sm font-bold text-[#111111]">No leads yet - Add your first lead</p>
                        <p className="text-xs text-slate-500 mt-1">Click &apos;Add Lead&apos; above to ingest a new prospective buyer.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming Site Visits (Cols 8-12) */}
                <div className="lg:col-span-5 rounded-3xl bg-white border border-[#EAE3D8] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#EAE3D8] pb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-[#FF5C1C]" />
                      <h3 className="text-lg font-serif font-bold text-[#111111]">Upcoming Site Visits</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("visits")}
                      className="text-xs font-bold text-[#FF5C1C] hover:underline cursor-pointer"
                    >
                      Calendar →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {dashLoading ? (
                      <div className="p-8 text-center text-xs text-slate-400">Loading upcoming visits...</div>
                    ) : siteVisits.length > 0 ? (
                      siteVisits.slice(0, 3).map((vis) => (
                        <div
                          key={vis.id}
                          className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-serif font-bold text-[#111111] text-sm">{vis.leadName}</span>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              vis.status === "Confirmed"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-[#FDEEE6] text-[#FF5C1C] border border-[#FF5C1C]/20"
                            }`}>
                              {vis.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-semibold truncate">
                            {vis.propertyTitle} ({vis.location})
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-[#EAE3D8]">
                            <span>🗓️ {new Date(vis.dateTime).toLocaleDateString("en-IN", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</span>
                            <span>Broker: {vis.agent}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-[#FAF7F2] rounded-2xl border border-[#EAE3D8]">
                        <p className="text-sm font-bold text-[#111111]">No site visits scheduled yet</p>
                        <p className="text-xs text-slate-500 mt-1">Schedule a client walkthrough from the leads list.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              TAB: LEADS MANAGEMENT
             ============================================================ */}
          {activeTab === "leads" && (
            <div className="space-y-6">
              {/* Header & Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#111111] tracking-tight">Leads & Client Intelligence</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Track buyer requirements, intent scoring, and automated matches</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Intent Filter */}
                  <div className="flex items-center gap-1 bg-white border border-[#EAE3D8] p-1 rounded-full text-xs font-bold">
                    {["All", "High", "Medium"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSelectedIntentFilter(filter)}
                        className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                          selectedIntentFilter === filter
                            ? "bg-[#111111] text-white shadow-xs"
                            : "text-slate-600 hover:text-[#111111]"
                        }`}
                      >
                        {filter === "All" ? "All Intents" : `${filter} Intent`}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setIsAddLeadOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF5C1C] hover:bg-[#E04809] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>New Lead</span>
                  </button>
                </div>
              </div>

              {/* Leads Table Container */}
              <div className="rounded-3xl bg-white border border-[#EAE3D8] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#111111] text-white text-xs uppercase font-serif tracking-wider">
                      <tr>
                        <th className="py-4 px-5">Lead Name</th>
                        <th className="py-4 px-5">Requirement</th>
                        <th className="py-4 px-5">Budget</th>
                        <th className="py-4 px-5">AI Match</th>
                        <th className="py-4 px-5">Status</th>
                        <th className="py-4 px-5">Assigned Broker</th>
                        <th className="py-4 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3D8] text-[#111111] font-medium">
                      {leadsLoading ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                            Loading leads from database...
                          </td>
                        </tr>
                      ) : leads.length > 0 ? (
                        leads.map((lead) => (
                          <tr
                            key={lead.id}
                            className="hover:bg-[#FDEEE6]/40 transition-colors cursor-pointer"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <td className="py-4 px-5">
                              <div className="font-serif font-bold text-[#111111] text-base">{lead.name}</div>
                              <div className="text-xs text-slate-500">{lead.phone}</div>
                            </td>
                            <td className="py-4 px-5">
                              <div className="font-semibold">{lead.bhk}</div>
                              <div className="text-xs text-slate-500">{lead.location}</div>
                            </td>
                            <td className="py-4 px-5 font-serif font-bold text-[#111111]">{lead.budget}</td>
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#FF5C1C] text-sm">{lead.matchScore}%</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FDEEE6] text-[#FF5C1C] font-bold border border-[#FF5C1C]/20">
                                  {lead.intent} Intent
                                </span>
                              </div>
                              <div className="text-xs text-slate-600 truncate max-w-xs">{lead.matchedProperty}</div>
                            </td>
                            <td className="py-4 px-5">
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {lead.status}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-slate-600 font-semibold">{lead.agent}</td>
                            <td className="py-4 px-5 text-right">
                              <a
                                href={getWhatsAppLink(lead.phone, lead.name, lead.matchedProperty)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1.5 rounded-full bg-[#FF5C1C] hover:bg-[#E04809] text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
                              >
                                <MessageSquare size={13} />
                                <span>WhatsApp</span>
                              </a>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            <p className="font-bold text-sm text-[#111111]">No leads yet - Add your first lead</p>
                            <p className="text-xs text-slate-400 mt-1">Ingest new buyer leads to trigger AI MatchScore against live scraped properties.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              TAB: PROPERTIES INVENTORY
             ============================================================ */}
          {activeTab === "properties" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#111111] tracking-tight">Property Listings & Inventory</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Live builder inventory mapped with automated buyer matching</p>
                </div>
              </div>

              {propsLoading ? (
                <div className="p-12 text-center text-slate-400 text-xs">Loading live scraped properties...</div>
              ) : properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {properties.map((prop) => (
                    <div
                      key={prop.id}
                      className="rounded-3xl bg-white border border-[#EAE3D8] overflow-hidden shadow-xs hover:border-[#FF5C1C]/40 transition-all flex flex-col justify-between"
                    >
                      <div className="p-6 sm:p-8 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-[#FF5C1C] uppercase tracking-wider">{prop.developer}</span>
                            <h3 className="text-xl font-serif font-bold text-[#111111] mt-1">{prop.title}</h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin size={14} className="text-[#FF5C1C]" /> {prop.location}
                            </p>
                          </div>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FDEEE6] text-[#FF5C1C] border border-[#FF5C1C]/20">
                            {prop.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 py-4 border-y border-[#EAE3D8] text-xs">
                          <div>
                            <span className="text-slate-500 block">Configurations</span>
                            <span className="font-bold text-[#111111] text-sm">{prop.type}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Price Range</span>
                            <span className="font-bold text-[#111111] text-sm">{prop.price}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Units Available</span>
                            <span className="font-bold text-emerald-700 text-sm">{prop.unitsAvailable} Units</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-4 bg-[#FAF7F2] border-t border-[#EAE3D8] flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">
                          ✨ <span className="font-bold text-[#111111]">{prop.matchCount} High-Intent Buyers</span> matched
                        </span>
                        <button
                          onClick={() => {
                            setActiveTab("leads");
                            setSearchQuery(prop.locality || prop.city);
                          }}
                          className="font-bold text-[#FF5C1C] hover:underline cursor-pointer"
                        >
                          View Matched Leads →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE3D8]">
                  <p className="text-sm font-bold text-[#111111]">No properties found - Run scraper to sync inventory</p>
                  <p className="text-xs text-slate-500 mt-1">Execute `npm run scrape:maharashtra` in backend to ingest properties.</p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB: SITE VISITS
             ============================================================ */}
          {activeTab === "visits" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#111111] tracking-tight">Site Visits & Follow-Up Calendar</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Scheduled client walkthroughs, builder slots, and visit logs</p>
                </div>

                <button
                  onClick={() => setIsScheduleVisitOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF5C1C] hover:bg-[#E04809] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Schedule Site Visit</span>
                </button>
              </div>

              {visitsLoading ? (
                <div className="p-12 text-center text-slate-400 text-xs">Loading site visits...</div>
              ) : siteVisits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {siteVisits.map((vis) => (
                    <div
                      key={vis.id}
                      className="p-6 rounded-3xl bg-white border border-[#EAE3D8] shadow-xs space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400 font-bold">{vis.id.slice(0, 8)}</span>
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                          vis.status === "Confirmed"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : vis.status === "Pending Confirmation"
                            ? "bg-[#FDEEE6] text-[#FF5C1C] border border-[#FF5C1C]/20"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {vis.status}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-serif font-bold text-[#111111]">{vis.leadName}</h3>
                        <p className="text-xs text-[#FF5C1C] font-bold mt-0.5">{vis.propertyTitle}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin size={13} /> {vis.location}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] text-xs space-y-1">
                        <div className="font-bold text-[#111111]">
                          🗓️ {new Date(vis.dateTime).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-slate-500">Lead Broker: {vis.agent}</div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {vis.status !== "Confirmed" && (
                          <button
                            onClick={() => handleConfirmVisit(vis.id, vis.leadName)}
                            className="flex-1 py-2.5 rounded-full bg-[#111111] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            Confirm Slot
                          </button>
                        )}
                        <a
                          href={getWhatsAppLink(vis.leadPhone, vis.leadName, vis.propertyTitle)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-full bg-[#FDEEE6] text-[#FF5C1C] hover:bg-[#FF5C1C] hover:text-white transition-colors"
                          title="Send WhatsApp Reminder"
                        >
                          <MessageSquare size={16} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE3D8]">
                  <p className="text-sm font-bold text-[#111111]">No site visits scheduled yet</p>
                  <p className="text-xs text-slate-500 mt-1">Click &apos;Schedule Site Visit&apos; to arrange an inspection.</p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB: DEALS & NEGOTIATION
             ============================================================ */}
          {activeTab === "deals" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#111111] tracking-tight">Deal Pipeline & Commission Guard</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Real-time buyer vs builder spread mapping and brokerage protection</p>
              </div>

              {dealsLoading ? (
                <div className="p-12 text-center text-slate-400 text-xs">Loading deal pipeline...</div>
              ) : deals.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {deals.map((dl) => (
                    <div
                      key={dl.id}
                      className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EAE3D8] shadow-xs space-y-5"
                    >
                      <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D8]">
                        <div>
                          <span className="text-xs font-mono font-bold text-[#FF5C1C]">{dl.id.slice(0, 8)}</span>
                          <h3 className="text-xl font-serif font-bold text-[#111111]">{dl.leadName}</h3>
                        </div>
                        <span className="text-xs px-3.5 py-1 rounded-full font-bold bg-[#FDEEE6] text-[#FF5C1C] border border-[#FF5C1C]/20">
                          {dl.stage}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-bold">{dl.propertyTitle}</p>

                      <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] text-xs">
                        <div>
                          <span className="text-slate-500 block">Buyer Bid</span>
                          <span className="font-serif font-bold text-[#111111] text-base">{dl.buyerBid}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Developer Counter</span>
                          <span className="font-serif font-bold text-[#111111] text-base">{dl.builderCounter}</span>
                        </div>
                        <div className="pt-3 border-t border-[#EAE3D8]">
                          <span className="text-slate-500 block">Target Agreed Price</span>
                          <span className="font-serif font-bold text-emerald-700 text-base">{dl.agreedPrice}</span>
                        </div>
                        <div className="pt-3 border-t border-[#EAE3D8]">
                          <span className="text-slate-500 block">Secured Brokerage</span>
                          <span className="font-serif font-bold text-[#FF5C1C] text-base">{dl.commission}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE3D8]">
                  <p className="text-sm font-bold text-[#111111]">No active deals in negotiation yet</p>
                  <p className="text-xs text-slate-500 mt-1">Deals will appear as prospective buyers place bids and negotiate terms.</p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB: TEAM & INVITES
             ============================================================ */}
          {activeTab === "team" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#111111] tracking-tight">Team Management & Invites</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Invite brokers, assign agency territories, and manage permissions</p>
                </div>

                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#FF5C1C] hover:bg-[#E04809] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <UserPlus size={15} />
                  <span>Invite New Member</span>
                </button>
              </div>

              {teamLoading ? (
                <div className="p-12 text-center text-slate-400 text-xs">Loading agency roster...</div>
              ) : team.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {team.map((member) => (
                    <div
                      key={member.id}
                      className="p-6 rounded-3xl bg-white border border-[#EAE3D8] shadow-xs space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-[#111111] text-white font-serif font-bold text-sm flex items-center justify-center">
                            {member.avatar ||
                              member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                          </div>
                          <span className={`text-[10px] px-3 py-0.5 rounded-full font-bold ${
                            member.status === "Active"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-[#FDEEE6] text-[#FF5C1C] border border-[#FF5C1C]/20"
                          }`}>
                            {member.status}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-serif font-bold text-[#111111]">{member.name}</h3>
                          <p className="text-xs text-[#FF5C1C] font-bold">{member.role}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{member.email}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#EAE3D8] grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Deals Closed</span>
                          <span className="font-serif font-bold text-[#111111] text-sm">{member.dealsClosed}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Active Leads</span>
                          <span className="font-serif font-bold text-[#111111] text-sm">{member.activeLeads}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE3D8]">
                  <p className="text-sm font-bold text-[#111111]">No team members invited yet</p>
                  <p className="text-xs text-slate-500 mt-1">Click &apos;Invite New Member&apos; to onboard brokers and associates.</p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB: AI COPILOT & MATCH ENGINE
             ============================================================ */}
          {activeTab === "ai-copilot" && (
            <div className="space-y-6">
              <div className="p-8 sm:p-10 rounded-3xl bg-[#111111] text-white space-y-6 shadow-xl relative overflow-hidden border border-[#262626]">
                <div className="flex items-center gap-2 text-[#FF5C1C] text-xs font-mono font-bold tracking-wider">
                  <Sparkles size={16} />
                  <span>PropIQ AUTONOMOUS MATCH ENGINE</span>
                </div>

                <div className="max-w-2xl space-y-3">
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold leading-tight">Ask AI Copilot for Instant Broker Intelligence</h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Search your entire inventory and database with natural language queries to instantly find matching high-intent buyers.
                  </p>
                </div>

                {/* Command Bar */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {[
                    "Find buyers for 2 BHK in Dombivli under ₹95L",
                    "Show leads with 90%+ match score",
                    "Generate WhatsApp follow-up for top lead",
                    "List deals ready for token agreement",
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        showToast(`Running AI Query: "${prompt}"`);
                        setActiveTab("leads");
                      }}
                      className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-[#FF5C1C] text-white border border-white/15 text-xs font-semibold transition-all text-left flex items-center gap-2 cursor-pointer"
                    >
                      <span>⚡ {prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================
          MODAL: ADD NEW LEAD
         ============================================================ */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl border border-[#EAE3D8] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsAddLeadOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-[#111111] cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-serif font-bold text-[#111111] mb-1">Add New Buyer Lead</h2>
            <p className="text-xs text-slate-500 mb-6">Triggers instant AI MatchScore against scraped inventory.</p>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:ring-2 focus:ring-[#FF5C1C]/40 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    placeholder="+91 98201 00000"
                    className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:ring-2 focus:ring-[#FF5C1C]/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    placeholder="vikram@gmail.com"
                    className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:ring-2 focus:ring-[#FF5C1C]/40 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">BHK Preference</label>
                  <select
                    value={newLeadBhk}
                    onChange={(e) => setNewLeadBhk(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:outline-none"
                  >
                    <option value="1 BHK">1 BHK</option>
                    <option value="2 BHK">2 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="4 BHK Luxury">4 BHK Luxury</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Locality</label>
                  <input
                    type="text"
                    value={newLeadLocation}
                    onChange={(e) => setNewLeadLocation(e.target.value)}
                    placeholder="Dombivli East"
                    className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Budget Min (₹)</label>
                  <input
                    type="number"
                    value={newLeadBudgetMin}
                    onChange={(e) => setNewLeadBudgetMin(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Budget Max (₹)</label>
                  <input
                    type="number"
                    value={newLeadBudgetMax}
                    onChange={(e) => setNewLeadBudgetMax(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Buyer Intent</label>
                <select
                  value={newLeadIntent}
                  onChange={(e) => setNewLeadIntent(e.target.value as "High" | "Medium" | "Low")}
                  className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:outline-none"
                >
                  <option value="High">High Intent</option>
                  <option value="Medium">Medium Intent</option>
                  <option value="Low">Low Intent</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EAE3D8]">
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#FF5C1C] hover:bg-[#E04809] text-white font-bold shadow-xs cursor-pointer"
                >
                  Add Lead & Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: INVITE TEAM MEMBER
         ============================================================ */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl border border-[#EAE3D8] max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-serif font-bold text-[#111111] mb-1">Invite Team Member</h2>
            <p className="text-xs text-slate-500 mb-6">Send invitation link for agency workspace access.</p>

            <form onSubmit={handleInviteMember} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Member Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Rohan Deshmukh"
                  className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="rohan@agency.com"
                  className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Role & Permissions</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMemberItem["role"])}
                  className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:outline-none"
                >
                  <option value="Senior Broker">Senior Broker (Full pipeline + deals)</option>
                  <option value="Field Agent">Field Agent (Site visits + leads)</option>
                  <option value="Property Consultant">Property Consultant</option>
                  <option value="Agency Admin">Agency Admin (Full access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EAE3D8]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#FF5C1C] hover:bg-[#E04809] text-white font-bold shadow-xs cursor-pointer"
                >
                  Send Invite Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: SCHEDULE SITE VISIT
         ============================================================ */}
      {isScheduleVisitOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl border border-[#EAE3D8] max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsScheduleVisitOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-serif font-bold text-[#111111] mb-1">Schedule Site Visit</h2>
            <p className="text-xs text-slate-500 mb-6">Coordinate client inspection slot with broker attendance.</p>

            <form onSubmit={handleScheduleVisit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Buyer Lead</label>
                <select
                  required
                  value={visitLeadId}
                  onChange={(e) => setVisitLeadId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:outline-none"
                >
                  <option value="">Choose Lead...</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Property</label>
                <select
                  value={visitPropertyId}
                  onChange={(e) => setVisitPropertyId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:outline-none"
                >
                  <option value="">Choose Property (Optional)...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={visitDateTime}
                  onChange={(e) => setVisitDateTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Host Broker</label>
                <input
                  type="text"
                  value={visitAgent}
                  onChange={(e) => setVisitAgent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#EAE3D8] text-[#111111] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EAE3D8]">
                <button
                  type="button"
                  onClick={() => setIsScheduleVisitOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#FF5C1C] hover:bg-[#E04809] text-white font-bold shadow-xs cursor-pointer"
                >
                  Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          DRAWER / MODAL: LEAD DETAILS & AI INSIGHTS
         ============================================================ */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#EAE3D8] p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D8]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5C1C] text-white font-serif font-bold text-sm flex items-center justify-center">
                  {selectedLead.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#111111]">{selectedLead.name}</h3>
                  <p className="text-xs text-slate-500">{selectedLead.phone} • {selectedLead.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Match Highlight */}
            <div className="p-4 rounded-2xl bg-[#FDEEE6] border border-[#FF5C1C]/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF5C1C]">AI Property Match</span>
                <span className="text-xs font-extrabold text-[#FF5C1C]">{selectedLead.matchScore}% Match Score</span>
              </div>
              <p className="text-sm font-serif font-bold text-[#111111]">{selectedLead.matchedProperty}</p>
              <p className="text-xs text-slate-600">
                Matches budget ({selectedLead.budget}) and {selectedLead.bhk} preference in {selectedLead.location}.
              </p>
            </div>

            {/* Lead Meta */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8]">
                <span className="text-slate-400 block">Lead Status</span>
                <span className="font-bold text-[#111111]">{selectedLead.status}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8]">
                <span className="text-slate-400 block">Assigned Broker</span>
                <span className="font-bold text-[#111111]">{selectedLead.agent}</span>
              </div>
            </div>

            {/* AI Next Best Action */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
              <Sparkles size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold block">AI Recommended Next Step</span>
                <span>Send WhatsApp brochure and schedule physical site visit for Saturday.</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <a
                href={getWhatsAppLink(selectedLead.phone, selectedLead.name, selectedLead.matchedProperty)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSelectedLead(null)}
                className="flex-1 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <MessageSquare size={15} />
                <span>Send WhatsApp</span>
              </a>
              <button
                onClick={() => {
                  setVisitLeadId(selectedLead.id);
                  setSelectedLead(null);
                  setIsScheduleVisitOpen(true);
                }}
                className="flex-1 py-3 rounded-full bg-[#FF5C1C] hover:bg-[#E04809] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Calendar size={15} />
                <span>Schedule Visit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
