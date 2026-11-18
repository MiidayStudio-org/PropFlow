"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Home,
  Layers,
  ChevronDown,
  Trash2,
} from "@/components/icons";
import { Logo } from "@/components/Logo";
import {
  useDashboard,
  useLeads,
  useProperties,
  useSiteVisits,
  useDeals,
  useBrokers,
  createLead,
  deleteLead,
  createSiteVisit,
  updateSiteVisit,
  deleteSiteVisit,
  createProperty,
  deleteProperty,
  createDeal,
  updateDeal,
  deleteDeal,
  createBroker,
  deleteBroker,
  runAiQuery,
  logoutUser,
  setStoredToken,
  fetchCurrentUser,
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIntentFilter, setSelectedIntentFilter] = useState<string>("All");

  // Notifications & Profile Dropdowns
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  }>({
    id: "",
    name: "User",
    email: "",
    role: "Agency Admin",
    avatar: "U",
  });

  // Handle Google OAuth callback redirect token & load user profile
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check if token was passed in URL query from Google OAuth callback
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setStoredToken(token);
      // Clean query string from browser URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    // 2. Load stored user from localStorage
    const savedUser = localStorage.getItem("propflow_user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {}
    }

    // 3. Verify and sync latest user profile from backend /api/auth/me
    fetchCurrentUser()
      .then((res) => {
        if (res?.user) {
          setCurrentUser(res.user);
          localStorage.setItem("propflow_user", JSON.stringify(res.user));
        }
      })
      .catch(() => {});
  }, []);

  // Modals state
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isScheduleVisitOpen, setIsScheduleVisitOpen] = useState(false);
  const [isRescheduleVisitOpen, setIsRescheduleVisitOpen] = useState(false);
  const [selectedVisitToReschedule, setSelectedVisitToReschedule] = useState<SiteVisitItem | null>(null);
  const [rescheduleDateTime, setRescheduleDateTime] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);

  // Form states for Add Lead
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadBhk, setNewLeadBhk] = useState("2 BHK");
  const [newLeadLocation, setNewLeadLocation] = useState("");
  const [newLeadBudgetMin, setNewLeadBudgetMin] = useState(0);
  const [newLeadBudgetMax, setNewLeadBudgetMax] = useState(0);
  const [newLeadIntent, setNewLeadIntent] = useState<"High" | "Medium" | "Low">("High");

  // Form states for Add Property
  const [newPropTitle, setNewPropTitle] = useState("");
  const [newPropDeveloper, setNewPropDeveloper] = useState("");
  const [newPropLocation, setNewPropLocation] = useState("");
  const [newPropPrice, setNewPropPrice] = useState("");
  const [newPropType, setNewPropType] = useState("2 BHK");
  const [newPropUnits, setNewPropUnits] = useState(1);

  // Form states for Add Deal
  const [newDealLeadId, setNewDealLeadId] = useState("");
  const [newDealPropertyId, setNewDealPropertyId] = useState("");
  const [newDealBuyerBid, setNewDealBuyerBid] = useState("");
  const [newDealBuilderCounter, setNewDealBuilderCounter] = useState("");
  const [newDealAgreedPrice, setNewDealAgreedPrice] = useState("");
  const [newDealCommission, setNewDealCommission] = useState("");
  const [newDealStage, setNewDealStage] = useState("Negotiation");

  // Form states for Invite Member
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMemberItem["role"]>("Senior Broker");

  // Form states for Schedule Visit
  const [visitLeadId, setVisitLeadId] = useState("");
  const [visitPropertyId, setVisitPropertyId] = useState("");
  const [visitDateTime, setVisitDateTime] = useState("");
  const [visitAgent, setVisitAgent] = useState("");

  // AI Copilot state
  const [aiQueryInput, setAiQueryInput] = useState("");
  const [aiIsSearching, setAiIsSearching] = useState(false);
  const [aiQueryResult, setAiQueryResult] = useState<{
    query: string;
    summary: string;
    matches: Array<{ leadName: string; phone: string; matchScore: number; reason: string }>;
  } | null>(null);

  // Real Data Hooks
  const { data: dashboardData, loading: dashLoading, reload: reloadDashboard } = useDashboard();
  const { leads, loading: leadsLoading, reload: reloadLeads } = useLeads(
    selectedIntentFilter === "All" ? undefined : selectedIntentFilter,
    searchQuery
  );
  const { properties, loading: propsLoading, reload: reloadProperties } = useProperties({ q: searchQuery });
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

  // Sign out handler
  const handleSignOut = () => {
    logoutUser();
    router.push("/login");
  };

  // ==========================================
  // HANDLERS: LEADS
  // ==========================================
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

  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete lead "${name}"?`)) return;
    try {
      await deleteLead(id);
      showToast(`Lead "${name}" deleted.`);
      reloadLeads();
      reloadDashboard();
    } catch (err: any) {
      showToast(err.message || "Failed to delete lead");
    }
  };

  // ==========================================
  // HANDLERS: PROPERTIES
  // ==========================================
  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropTitle || !newPropLocation) return;

    try {
      const numPrice = Number(newPropPrice.replace(/[^0-9]/g, "")) || 8500000;
      const created = await createProperty({
        title: newPropTitle,
        price: numPrice,
        propertyType: newPropType,
        address: newPropLocation,
        locality: newPropLocation.split(",")[0]?.trim() || newPropLocation,
        city: newPropLocation.split(",")[1]?.trim() || "Thane",
        description: newPropDeveloper ? `Developed by ${newPropDeveloper}` : undefined,
      });

      setIsAddPropertyOpen(false);
      setNewPropTitle("");
      setNewPropDeveloper("");
      setNewPropLocation("");
      showToast(`Property "${created.title}" added to inventory.`);
      reloadProperties();
      reloadDashboard();
    } catch (err: any) {
      showToast(err.message || "Failed to create property");
    }
  };

  const handleDeleteProperty = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete property "${title}"?`)) return;
    try {
      await deleteProperty(id);
      showToast(`Property "${title}" deleted.`);
      reloadProperties();
      reloadDashboard();
    } catch (err: any) {
      showToast(err.message || "Failed to delete property");
    }
  };

  // ==========================================
  // HANDLERS: DEALS
  // ==========================================
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealLeadId) return;

    try {
      const bid = Number(newDealBuyerBid.replace(/[^0-9]/g, "")) || 9000000;
      const ask = Number(newDealBuilderCounter.replace(/[^0-9]/g, "")) || 9500000;
      const agreed = Number(newDealAgreedPrice.replace(/[^0-9]/g, "")) || 9250000;

      const created = await createDeal({
        leadId: newDealLeadId,
        propertyId: newDealPropertyId || undefined,
        buyerBid: bid,
        builderAsk: ask,
        agreedPrice: agreed,
        stage: newDealStage,
      });

      setIsAddDealOpen(false);
      setNewDealLeadId("");
      setNewDealPropertyId("");
      showToast(`Deal added in stage "${created.stage}".`);
      reloadDeals();
      reloadDashboard();
    } catch (err: any) {
      showToast(err.message || "Failed to create deal");
    }
  };

  const handleUpdateDealStage = async (id: string, stage: DealItem["stage"]) => {
    try {
      await updateDeal(id, { stage });
      showToast(`Deal moved to stage "${stage}".`);
      reloadDeals();
      reloadDashboard();
    } catch (err: any) {
      showToast(err.message || "Failed to update deal stage");
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm("Are you sure you want to remove this deal?")) return;
    try {
      await deleteDeal(id);
      showToast("Deal removed from pipeline.");
      reloadDeals();
      reloadDashboard();
    } catch (err: any) {
      showToast(err.message || "Failed to delete deal");
    }
  };

  // ==========================================
  // HANDLERS: SITE VISITS
  // ==========================================
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
      reloadDashboard();
    } catch (err: any) {
      showToast(err.message || "Failed to schedule visit");
    }
  };

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

  const handleRescheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitToReschedule || !rescheduleDateTime) return;

    try {
      await updateSiteVisit(selectedVisitToReschedule.id, {
        dateTime: new Date(rescheduleDateTime).toISOString(),
        status: "Pending Confirmation",
      });
      setIsRescheduleVisitOpen(false);
      setSelectedVisitToReschedule(null);
      setRescheduleDateTime("");
      showToast("Site visit rescheduled.");
      reloadVisits();
      reloadDashboard();
    } catch (err: any) {
      showToast(err.message || "Failed to reschedule visit");
    }
  };

  const handleDeleteVisit = async (id: string, leadName: string) => {
    if (!confirm(`Cancel and delete site visit for ${leadName}?`)) return;
    try {
      await deleteSiteVisit(id);
      showToast("Site visit cancelled.");
      reloadVisits();
      reloadDashboard();
    } catch (err: any) {
      showToast(err.message || "Failed to cancel visit");
    }
  };

  // ==========================================
  // HANDLERS: TEAM
  // ==========================================
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

  const handleDeleteBroker = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your agency team?`)) return;
    try {
      await deleteBroker(id);
      showToast(`Team member "${name}" removed.`);
      reloadTeam();
      reloadDashboard();
    } catch (err: any) {
      showToast(err.message || "Failed to remove member");
    }
  };

  // ==========================================
  // HANDLERS: AI COPILOT
  // ==========================================
  const handleExecuteAiQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setAiIsSearching(true);
    setAiQueryInput(queryText);
    try {
      const res = await runAiQuery(queryText);
      const mapped = (res.leads || []).map((l) => ({
        leadName: l.name,
        phone: l.phone,
        matchScore: l.matchScore,
        reason: l.suggestedAction || l.matchedProperty || "Matched based on budget and location preferences.",
      }));
      setAiQueryResult({
        query: queryText,
        summary: res.summary || `Found ${mapped.length} matching buyers with high intent.`,
        matches: mapped,
      });
      showToast("AI Match Analysis complete.");
    } catch {
      // Local fallback logic
      const filtered = leads.filter(
        (l) =>
          l.location.toLowerCase().includes(queryText.toLowerCase()) ||
          l.bhk.toLowerCase().includes(queryText.toLowerCase()) ||
          l.name.toLowerCase().includes(queryText.toLowerCase())
      );
      setAiQueryResult({
        query: queryText,
        summary: `Identified ${filtered.length} candidate leads evaluated against property inventory.`,
        matches: filtered.map((l) => ({
          leadName: l.name,
          phone: l.phone,
          matchScore: l.matchScore,
          reason: `Matches budget preference (${l.budget}) and ${l.bhk} requirement in ${l.location}.`,
        })),
      });
      showToast("AI query processed.");
    } finally {
      setAiIsSearching(false);
    }
  };

  // Helper WhatsApp generator
  const getWhatsAppLink = (phone: string, name: string, propTitle?: string) => {
    const cleanDigits = cleanPhoneForWhatsApp(phone);
    const msg = propTitle
      ? `Hi ${name}, Vikram here from PropFlow! We found a high-scoring matching property for your requirement: "${propTitle}". Would you like to schedule a physical walkthrough this weekend?`
      : `Hi ${name}, Vikram here from PropFlow! I have updated property intelligence matching your requirements. Let me know when you'd like to connect.`;
    return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(msg)}`;
  };

  // Safe KPI counts
  const totalLeadsCount = dashboardData?.counts.leads ?? leads.length;
  const totalPropsCount = dashboardData?.counts.properties ?? properties.length;
  const totalVisitsCount = dashboardData?.counts.visits ?? siteVisits.length;
  const totalDealsCount = dashboardData?.counts.deals ?? deals.length;
  const totalTeamCount = dashboardData?.counts.team ?? team.length;

  const activePipelineVal = dashboardData?.kpis.activePipeline || 0;

  return (
    <div className="h-screen w-full bg-[#F8F9FA] text-[#111111] flex overflow-hidden font-sans antialiased selection:bg-[#F5C238] selection:text-black">
      {/* Toast Notification Banner */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#111111] text-white shadow-2xl border border-[#262626]">
          <CheckCircle2 size={18} className="text-[#F5C238] shrink-0" />
          <span className="text-sm font-medium">{notificationMsg}</span>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-neutral-400 hover:text-white ml-2 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ============================================================
          SIDEBAR NAVIGATION (Matches Mockup: Fixed Height, Never Scrolls)
         ============================================================ */}
      <aside className="w-64 h-full bg-[#0E0F12] border-r border-[#1C1D22] text-white flex flex-col justify-between hidden md:flex shrink-0 z-30 relative overflow-hidden select-none">
        {/* Subtle decorative curved ambient lines in bottom half */}
        <svg
          className="absolute bottom-12 left-0 right-0 w-full h-36 pointer-events-none opacity-20"
          viewBox="0 0 256 160"
          fill="none"
        >
          <path d="M-30 160 C 40 100, 120 170, 260 80" stroke="#F5C238" strokeWidth="1.2" fill="none" />
          <path d="M-30 140 C 50 80, 140 150, 270 60" stroke="#F5C238" strokeWidth="1.2" fill="none" />
          <path d="M-30 120 C 60 60, 160 130, 280 40" stroke="#F5C238" strokeWidth="1.2" fill="none" />
          <path d="M-30 100 C 70 40, 180 110, 290 20" stroke="#F5C238" strokeWidth="1.2" fill="none" />
        </svg>

        <div className="flex flex-col min-h-0">
          {/* Brand Header */}
          <div className="px-5 py-4 border-b border-white/5 shrink-0">
            <Link href="/" className="inline-flex items-center group">
              <Logo size="md" theme="light" subtitle="Agency Workspace" />
            </Link>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1 text-xs font-medium" aria-label="Dashboard Navigation">
            {/* Overview Tab */}
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-[#F5C238] text-black font-bold shadow-xs"
                  : "text-neutral-400 hover:text-white hover:bg-white/5 font-medium"
              }`}
            >
              <Home size={17} className={activeTab === "overview" ? "text-black" : "text-neutral-400"} />
              <span className="text-[13px]">Overview</span>
            </button>

            {/* Leads & Buyers Tab */}
            <button
              onClick={() => setActiveTab("leads")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "leads"
                  ? "bg-[#F5C238] text-black font-bold shadow-xs"
                  : "text-neutral-400 hover:text-white hover:bg-white/5 font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={16} className={activeTab === "leads" ? "text-black" : "text-neutral-400"} />
                <span className="text-[13px]">Leads & Buyers</span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "leads"
                    ? "bg-black/15 text-black"
                    : "bg-white/10 text-neutral-300"
                }`}
              >
                {totalLeadsCount}
              </span>
            </button>

            {/* Properties Tab */}
            <button
              onClick={() => setActiveTab("properties")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "properties"
                  ? "bg-[#F5C238] text-black font-bold shadow-xs"
                  : "text-neutral-400 hover:text-white hover:bg-white/5 font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 size={16} className={activeTab === "properties" ? "text-black" : "text-neutral-400"} />
                <span className="text-[13px]">Properties</span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "properties"
                    ? "bg-black/15 text-black"
                    : "bg-white/10 text-neutral-300"
                }`}
              >
                {totalPropsCount}
              </span>
            </button>

            {/* Site Visits Tab */}
            <button
              onClick={() => setActiveTab("visits")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "visits"
                  ? "bg-[#F5C238] text-black font-bold shadow-xs"
                  : "text-neutral-400 hover:text-white hover:bg-white/5 font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar size={16} className={activeTab === "visits" ? "text-black" : "text-neutral-400"} />
                <span className="text-[13px]">Site Visits</span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "visits"
                    ? "bg-black/15 text-black"
                    : "bg-white/10 text-neutral-300"
                }`}
              >
                {totalVisitsCount}
              </span>
            </button>

            {/* Deal Pipeline Tab */}
            <button
              onClick={() => setActiveTab("deals")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "deals"
                  ? "bg-[#F5C238] text-black font-bold shadow-xs"
                  : "text-neutral-400 hover:text-white hover:bg-white/5 font-medium"
              }`}
            >
              <Layers size={16} className={activeTab === "deals" ? "text-black" : "text-neutral-400"} />
              <span className="text-[13px]">Deal Pipeline</span>
            </button>

            {/* Team & Invites Tab */}
            <button
              onClick={() => setActiveTab("team")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "team"
                  ? "bg-[#F5C238] text-black font-bold shadow-xs"
                  : "text-neutral-400 hover:text-white hover:bg-white/5 font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <UserPlus size={16} className={activeTab === "team" ? "text-black" : "text-neutral-400"} />
                <span className="text-[13px]">Team & Invites</span>
              </div>
            </button>

            {/* AI Match Engine Tab */}
            <button
              onClick={() => setActiveTab("ai-copilot")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "ai-copilot"
                  ? "bg-[#F5C238] text-black font-bold shadow-xs"
                  : "text-neutral-400 hover:text-white hover:bg-white/5 font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles size={16} className={activeTab === "ai-copilot" ? "text-black" : "text-[#F5C238]"} />
                <span className="text-[13px]">AI Match Engine</span>
              </div>
              <span className="w-5 h-5 rounded-full bg-[#F5C238] text-black text-[11px] font-black flex items-center justify-center">
                0
              </span>
            </button>
          </nav>
        </div>

        {/* User Account & Sign Out (Matches Mockup: Perfectly Pinned at Bottom) */}
        <div className="p-3 border-t border-white/5 space-y-1.5 relative z-10 shrink-0">
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="p-2 rounded-xl bg-[#18191E] border border-white/5 flex items-center justify-between shadow-xs cursor-pointer hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#F5C238] text-black font-black text-xs flex items-center justify-center shrink-0">
                {currentUser.avatar || (currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : "U")}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">{currentUser.name || "User"}</p>
                <p className="text-[10px] text-neutral-400 truncate leading-tight mt-0.5">{currentUser.role || "Agency Member"}</p>
              </div>
            </div>
            <ChevronDown size={14} className="text-neutral-400 shrink-0 ml-1" />
          </div>

          {/* Profile Menu Popup */}
          {isProfileOpen && (
            <div className="p-2.5 rounded-xl bg-[#18191E] border border-white/10 text-xs space-y-1.5 shadow-xl">
              <p className="text-neutral-400 font-semibold text-[11px] truncate">Agency: PropFlow Elite Realty</p>
              <p className="text-neutral-400 font-semibold text-[11px] truncate">Email: {currentUser.email}</p>
              <button
                onClick={handleSignOut}
                className="w-full text-left text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5 pt-1 border-t border-white/5 cursor-pointer text-xs"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ============================================================
          MAIN CONTENT AREA (Scrolls independently)
         ============================================================ */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-y-auto">
        {/* Top App Bar (Matches Mockup: White Header with Search & Buttons) */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#EAEAEA] px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads, BHK, locations, properties..."
              className="w-full pl-11 pr-4 py-2 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-xs text-[#111111] placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/30 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#111111] text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-neutral-50 text-[#111111] text-xs font-bold transition-all border border-[#EAEAEA] shadow-2xs cursor-pointer"
            >
              <UserPlus size={14} />
              <span>Invite Team</span>
            </button>

            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Add Lead</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="w-9 h-9 rounded-full bg-white border border-[#EAEAEA] hover:bg-neutral-50 flex items-center justify-center text-neutral-700 cursor-pointer transition-colors shadow-2xs"
              >
                <Bell size={15} />
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#EAEAEA] shadow-2xl p-4 z-50 text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EAEAEA]">
                    <span className="font-bold text-[#111111]">Notifications</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF7D6] text-[#A17000] font-bold">
                      Live Feed
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {totalPropsCount === 0 && totalLeadsCount === 0 ? (
                      <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#EAEAEA] text-center text-xs text-neutral-400">
                        No new notifications
                      </div>
                    ) : (
                      <>
                        {totalPropsCount > 0 && (
                          <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAEAEA] space-y-1">
                            <p className="font-bold text-[#111111]">Inventory Synced</p>
                            <p className="text-[11px] text-neutral-500">
                              {totalPropsCount} properties currently in live database.
                            </p>
                          </div>
                        )}
                        {totalLeadsCount > 0 && (
                          <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#EAEAEA] space-y-1">
                            <p className="font-bold text-[#111111]">Active Leads</p>
                            <p className="text-[11px] text-neutral-500">
                              {totalLeadsCount} prospective buyers tracked in CRM.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Horizontal Bar */}
        <div className="flex md:hidden overflow-x-auto gap-2 p-3 bg-white border-b border-[#EAEAEA] text-xs font-medium shrink-0">
          {(["overview", "leads", "properties", "visits", "deals", "team", "ai-copilot"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-full capitalize shrink-0 font-bold cursor-pointer transition-colors ${
                activeTab === tab ? "bg-[#F5C238] text-black" : "bg-neutral-100 border border-neutral-200 text-neutral-700"
              }`}
            >
              {tab.replace("-", " ")}
            </button>
          ))}
        </div>

        {/* Main Dashboard Body */}
        <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-7">
          {/* ============================================================
              TAB: OVERVIEW (Matches Mockup Exactly)
             ============================================================ */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Executive Welcome Greeting */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-[30px] font-black tracking-tight text-[#111111] font-hero flex items-center gap-2">
                    Welcome back, {currentUser.name && currentUser.name !== "User" ? currentUser.name.split(" ")[0] : "Broker"} <span className="inline-block">👋</span>
                  </h1>
                  <p className="text-xs sm:text-[13px] text-neutral-500 mt-1">
                    Here is what is happening across your PropFlow real estate pipeline today.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#111111] border border-[#EAEAEA] text-xs font-semibold shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    PropFlow AI Telemetry Active
                  </span>
                </div>
              </div>

              {/* 4 KPI Metrics Cards (Matches Mockup Layout & Colors) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Card 1: TOTAL ACTIVE LEADS (Featured Black Card) */}
                <div className="p-5 rounded-2xl bg-[#131417] text-white border border-white/5 shadow-sm flex flex-col justify-between h-[148px] relative overflow-hidden group">
                  <svg
                    className="absolute -bottom-4 -right-4 w-36 h-28 pointer-events-none opacity-25"
                    viewBox="0 0 160 120"
                    fill="none"
                  >
                    <path d="M-10 120 C 40 80, 90 120, 170 50" stroke="#F5C238" strokeWidth="1.2" fill="none" />
                    <path d="M0 130 C 50 65, 100 100, 180 35" stroke="#F5C238" strokeWidth="1.2" fill="none" />
                    <path d="M10 140 C 60 50, 110 80, 190 20" stroke="#F5C238" strokeWidth="1.2" fill="none" />
                  </svg>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-bold uppercase tracking-wider relative z-10">
                    <span>TOTAL ACTIVE LEADS</span>
                    <div className="w-8 h-8 rounded-xl bg-[#F5C238] text-black flex items-center justify-center">
                      <Users size={16} />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="text-3xl font-black text-white font-hero tracking-tight">
                      {totalLeadsCount}
                    </div>
                    <div className="text-xs text-neutral-400 font-normal mt-1">Live database total</div>
                  </div>
                </div>

                {/* Card 2: ACTIVE DEAL PIPELINE */}
                <div className="p-5 rounded-2xl bg-white border border-[#EAEAEA] shadow-2xs flex flex-col justify-between h-[148px]">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 font-bold uppercase tracking-wider">
                    <span>ACTIVE DEAL PIPELINE</span>
                    <div className="w-8 h-8 rounded-xl bg-[#FFF7D6] text-neutral-800 flex items-center justify-center">
                      <Layers size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-[#111111] font-hero tracking-tight">
                      {totalDealsCount > 0 ? formatINR(activePipelineVal) : "₹0"}
                    </div>
                    <div className="text-xs text-[#22C55E] font-medium flex items-center gap-1 mt-1">
                      <span>↗ Live telemetry</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: SCHEDULED SITE VISITS */}
                <div className="p-5 rounded-2xl bg-white border border-[#EAEAEA] shadow-2xs flex flex-col justify-between h-[148px]">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 font-bold uppercase tracking-wider">
                    <span>SCHEDULED SITE VISITS</span>
                    <div className="w-8 h-8 rounded-xl bg-[#FFF7D6] text-neutral-800 flex items-center justify-center">
                      <Calendar size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-[#111111] font-hero tracking-tight">
                      {totalVisitsCount}
                    </div>
                    <div className="text-xs text-[#E08A28] font-medium mt-1">
                      Upcoming this weekend
                    </div>
                  </div>
                </div>

                {/* Card 4: TEAM MEMBERS */}
                <div className="p-5 rounded-2xl bg-white border border-[#EAEAEA] shadow-2xs flex flex-col justify-between h-[148px]">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 font-bold uppercase tracking-wider">
                    <span>TEAM MEMBERS</span>
                    <div className="w-8 h-8 rounded-xl bg-[#FFF7D6] text-neutral-800 flex items-center justify-center">
                      <UserPlus size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-[#111111] font-hero tracking-tight">
                      {totalTeamCount} Brokers
                    </div>
                    <div className="text-xs text-neutral-400 font-normal mt-1">
                      Active agency roster
                    </div>
                  </div>
                </div>
              </div>

              {/* 2 Bottom Panels: AI Priority Matched Leads & Upcoming Site Visits */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Panel 1: AI Priority Matched Leads */}
                <div className="rounded-2xl bg-white border border-[#EAEAEA] p-6 shadow-2xs flex flex-col justify-between min-h-[340px]">
                  <div className="flex items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-[#F5C238]" />
                      <h3 className="text-base font-bold text-[#111111] font-hero">AI Priority Matched Leads</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("leads")}
                      className="text-xs font-bold text-[#E08A28] hover:underline cursor-pointer"
                    >
                      View All Leads →
                    </button>
                  </div>

                  {dashLoading ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-neutral-400 py-12">
                      Loading priority matches...
                    </div>
                  ) : dashboardData && dashboardData.priorityMatches.length > 0 ? (
                    <div className="space-y-3 mt-3 flex-1">
                      {dashboardData.priorityMatches.slice(0, 3).map((item) => (
                        <div
                          key={item.leadId}
                          onClick={() => {
                            const fullLead = leads.find((l) => l.id === item.leadId);
                            if (fullLead) setSelectedLead(fullLead);
                          }}
                          className="p-3.5 rounded-xl bg-[#FBFBFC] border border-[#F0F0F2] hover:border-[#F5C238]/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#111111] text-sm">{item.leadName}</span>
                              <span className="px-2 py-0.5 rounded-full bg-[#FFF7D6] text-[#A17000] text-[10px] font-bold">
                                {item.matchScore}% Match
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500">
                              {item.leadBhk} • {item.leadLocation} • <span className="font-bold text-[#111111]">{item.leadBudget}</span>
                            </p>
                            <p className="text-xs text-neutral-700 font-semibold flex items-center gap-1">
                              <Building2 size={13} className="text-[#F5C238]" /> {item.matchedProperty}
                            </p>
                          </div>
                          <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#FBFBFC] rounded-2xl border border-[#F0F0F2] flex-1 flex flex-col items-center justify-center py-12 px-6 text-center mt-3">
                      <div className="w-12 h-12 rounded-xl bg-[#FFF7D6] flex items-center justify-center text-neutral-800 mb-3">
                        <Briefcase size={22} className="text-neutral-800" />
                      </div>
                      <p className="text-sm font-bold text-[#111111]">No leads yet – Add your first lead</p>
                      <p className="text-xs text-neutral-400 mt-1">Click &quot;Add Lead&quot; above to ingest a new prospective buyer.</p>
                    </div>
                  )}
                </div>

                {/* Panel 2: Upcoming Site Visits */}
                <div className="rounded-2xl bg-white border border-[#EAEAEA] p-6 shadow-2xs flex flex-col justify-between min-h-[340px]">
                  <div className="flex items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-[#F5C238]" />
                      <h3 className="text-base font-bold text-[#111111] font-hero">Upcoming Site Visits</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("visits")}
                      className="text-xs font-bold text-[#E08A28] hover:underline cursor-pointer"
                    >
                      Calendar →
                    </button>
                  </div>

                  {dashLoading ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-neutral-400 py-12">
                      Loading upcoming visits...
                    </div>
                  ) : siteVisits.length > 0 ? (
                    <div className="space-y-3 mt-3 flex-1">
                      {siteVisits.slice(0, 3).map((vis) => (
                        <div
                          key={vis.id}
                          className="p-3.5 rounded-xl bg-[#FBFBFC] border border-[#F0F0F2] space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#111111] text-sm">{vis.leadName}</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                vis.status === "Confirmed"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-[#FFF7D6] text-[#A17000]"
                              }`}
                            >
                              {vis.status}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-700 font-semibold truncate">
                            {vis.propertyTitle} ({vis.location})
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-[#F0F0F2]">
                            <span>
                              🗓️ {new Date(vis.dateTime).toLocaleDateString("en-IN", {
                                weekday: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span>Broker: {vis.agent}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#FBFBFC] rounded-2xl border border-[#F0F0F2] flex-1 flex flex-col items-center justify-center py-12 px-6 text-center mt-3">
                      <div className="w-12 h-12 rounded-xl bg-[#FFF7D6] flex items-center justify-center text-neutral-800 mb-3">
                        <Calendar size={22} className="text-neutral-800" />
                      </div>
                      <p className="text-sm font-bold text-[#111111]">No site visits scheduled yet</p>
                      <p className="text-xs text-neutral-400 mt-1">Schedule a client walkthrough from the leads list.</p>
                    </div>
                  )}
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
                  <h2 className="text-2xl sm:text-3xl font-bold font-hero text-[#111111] tracking-tight">
                    Leads & Client Intelligence
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                    Track buyer requirements, intent scoring, and automated matches
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Intent Filter */}
                  <div className="flex items-center gap-1 bg-white border border-[#EAEAEA] p-1 rounded-full text-xs font-bold shadow-2xs">
                    {["All", "High", "Medium", "Low"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSelectedIntentFilter(filter)}
                        className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                          selectedIntentFilter === filter
                            ? "bg-[#111111] text-white shadow-xs"
                            : "text-neutral-600 hover:text-[#111111]"
                        }`}
                      >
                        {filter === "All" ? "All Intents" : `${filter} Intent`}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setIsAddLeadOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>New Lead</span>
                  </button>
                </div>
              </div>

              {/* Leads Table Container */}
              <div className="rounded-2xl bg-white border border-[#EAEAEA] shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#0E0F12] text-white text-xs uppercase font-hero tracking-wider">
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
                    <tbody className="divide-y divide-[#EAEAEA] text-[#111111] font-medium">
                      {leadsLoading ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-neutral-400 text-xs">
                            Loading leads from database...
                          </td>
                        </tr>
                      ) : leads.length > 0 ? (
                        leads.map((lead) => (
                          <tr
                            key={lead.id}
                            className="hover:bg-neutral-50 transition-colors cursor-pointer"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <td className="py-4 px-5">
                              <div className="font-bold text-[#111111] text-base">{lead.name}</div>
                              <div className="text-xs text-neutral-500">{lead.phone}</div>
                            </td>
                            <td className="py-4 px-5">
                              <div className="font-semibold">{lead.bhk}</div>
                              <div className="text-xs text-neutral-500">{lead.location}</div>
                            </td>
                            <td className="py-4 px-5 font-bold text-[#111111]">{lead.budget}</td>
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#E08A28] text-sm">{lead.matchScore}%</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF7D6] text-[#A17000] font-bold">
                                  {lead.intent} Intent
                                </span>
                              </div>
                              <div className="text-xs text-neutral-600 truncate max-w-xs">{lead.matchedProperty}</div>
                            </td>
                            <td className="py-4 px-5">
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {lead.status}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-neutral-600 font-semibold">{lead.agent}</td>
                            <td className="py-4 px-5 text-right">
                              <div className="inline-flex items-center gap-2">
                                <a
                                  href={getWhatsAppLink(lead.phone, lead.name, lead.matchedProperty)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
                                >
                                  <MessageSquare size={13} />
                                  <span>WhatsApp</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLead(lead.id, lead.name);
                                  }}
                                  className="p-1.5 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete Lead"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-neutral-500">
                            <p className="font-bold text-sm text-[#111111]">No leads yet – Add your first lead</p>
                            <p className="text-xs text-neutral-400 mt-1">
                              Ingest new buyer leads to trigger AI MatchScore against live scraped properties.
                            </p>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-hero text-[#111111] tracking-tight">
                    Property Listings & Inventory
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                    Live builder inventory mapped with automated buyer matching
                  </p>
                </div>

                <button
                  onClick={() => setIsAddPropertyOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Add Property</span>
                </button>
              </div>

              {propsLoading ? (
                <div className="p-12 text-center text-neutral-400 text-xs">Loading live scraped properties...</div>
              ) : properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {properties.map((prop) => (
                    <div
                      key={prop.id}
                      className="rounded-2xl bg-white border border-[#EAEAEA] overflow-hidden shadow-2xs hover:border-[#F5C238]/60 transition-all flex flex-col justify-between"
                    >
                      <div className="p-6 sm:p-8 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                              {prop.developer}
                            </span>
                            <h3 className="text-xl font-bold font-hero text-[#111111] mt-1">{prop.title}</h3>
                            <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                              <MapPin size={14} className="text-[#F5C238]" /> {prop.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFF7D6] text-[#A17000]">
                              {prop.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteProperty(prop.id, prop.title)}
                              className="p-1.5 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Property"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 py-4 border-y border-[#EAEAEA] text-xs">
                          <div>
                            <span className="text-neutral-500 block">Configurations</span>
                            <span className="font-bold text-[#111111] text-sm">{prop.type}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block">Price Range</span>
                            <span className="font-bold text-[#111111] text-sm">{prop.price}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block">Units Available</span>
                            <span className="font-bold text-emerald-700 text-sm">{prop.unitsAvailable} Units</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-4 bg-[#FBFBFC] border-t border-[#EAEAEA] flex items-center justify-between text-xs">
                        <span className="text-neutral-600 font-medium">
                          ✨ <span className="font-bold text-[#111111]">{prop.matchCount} High-Intent Buyers</span> matched
                        </span>
                        <button
                          onClick={() => {
                            setActiveTab("leads");
                            setSearchQuery(prop.locality || prop.city);
                          }}
                          className="font-bold text-[#E08A28] hover:underline cursor-pointer"
                        >
                          View Matched Leads →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-2xl border border-[#EAEAEA]">
                  <p className="text-sm font-bold text-[#111111]">No properties found</p>
                  <p className="text-xs text-neutral-500 mt-1">Click &apos;Add Property&apos; to add listings to your inventory.</p>
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
                  <h2 className="text-2xl sm:text-3xl font-bold font-hero text-[#111111] tracking-tight">
                    Site Visits & Follow-Up Calendar
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                    Scheduled client walkthroughs, builder slots, and visit logs
                  </p>
                </div>

                <button
                  onClick={() => setIsScheduleVisitOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Schedule Site Visit</span>
                </button>
              </div>

              {visitsLoading ? (
                <div className="p-12 text-center text-neutral-400 text-xs">Loading site visits...</div>
              ) : siteVisits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {siteVisits.map((vis) => (
                    <div
                      key={vis.id}
                      className="p-6 rounded-2xl bg-white border border-[#EAEAEA] shadow-2xs space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-neutral-400 font-bold">{vis.id.slice(0, 8)}</span>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-bold ${
                              vis.status === "Confirmed"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : vis.status === "Pending Confirmation"
                                ? "bg-[#FFF7D6] text-[#A17000]"
                                : "bg-neutral-100 text-neutral-700"
                            }`}
                          >
                            {vis.status}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold font-hero text-[#111111]">{vis.leadName}</h3>
                          <p className="text-xs text-[#E08A28] font-bold mt-0.5">{vis.propertyTitle}</p>
                          <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                            <MapPin size={13} /> {vis.location}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FBFBFC] border border-[#EAEAEA] text-xs space-y-1">
                          <div className="font-bold text-[#111111]">
                            🗓️ {new Date(vis.dateTime).toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-neutral-500">Lead Broker: {vis.agent}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#EAEAEA]">
                        {vis.status !== "Confirmed" && (
                          <button
                            onClick={() => handleConfirmVisit(vis.id, vis.leadName)}
                            className="flex-1 py-2 rounded-full bg-[#111111] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVisitToReschedule(vis);
                            setIsRescheduleVisitOpen(true);
                          }}
                          className="px-3 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-[#111111] text-xs font-bold transition-all cursor-pointer"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVisit(vis.id, vis.leadName)}
                          className="p-2 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Cancel Visit"
                        >
                          <Trash2 size={15} />
                        </button>
                        <a
                          href={getWhatsAppLink(vis.leadPhone, vis.leadName, vis.propertyTitle)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                          title="Send WhatsApp Reminder"
                        >
                          <MessageSquare size={15} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-2xl border border-[#EAEAEA]">
                  <p className="text-sm font-bold text-[#111111]">No site visits scheduled yet</p>
                  <p className="text-xs text-neutral-500 mt-1">Click &apos;Schedule Site Visit&apos; to arrange an inspection.</p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB: DEALS & NEGOTIATION
             ============================================================ */}
          {activeTab === "deals" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-hero text-[#111111] tracking-tight">
                    Deal Pipeline & Commission Guard
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                    Real-time buyer vs builder spread mapping and brokerage protection
                  </p>
                </div>

                <button
                  onClick={() => setIsAddDealOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Plus size={15} />
                  <span>New Deal</span>
                </button>
              </div>

              {dealsLoading ? (
                <div className="p-12 text-center text-neutral-400 text-xs">Loading deal pipeline...</div>
              ) : deals.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {deals.map((dl) => (
                    <div
                      key={dl.id}
                      className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EAEAEA] shadow-2xs space-y-5"
                    >
                      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
                        <div>
                          <span className="text-xs font-mono font-bold text-[#E08A28]">{dl.id.slice(0, 8)}</span>
                          <h3 className="text-xl font-bold font-hero text-[#111111]">{dl.leadName}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Stage Transition Selector */}
                          <select
                            value={dl.stage}
                            onChange={(e) => handleUpdateDealStage(dl.id, e.target.value as DealItem["stage"])}
                            className="text-xs px-3 py-1 rounded-full font-bold bg-[#FFF7D6] text-[#A17000] border border-[#F5C238]/40 focus:outline-none cursor-pointer"
                          >
                            <option value="In Negotiation">In Negotiation</option>
                            <option value="Offer Placed">Offer Placed</option>
                            <option value="Token Received">Token Received</option>
                            <option value="Closed Deal">Closed Deal</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDeleteDeal(dl.id)}
                            className="p-1.5 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Deal"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-700 font-bold">{dl.propertyTitle}</p>

                      <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#FBFBFC] border border-[#EAEAEA] text-xs">
                        <div>
                          <span className="text-neutral-500 block">Buyer Bid</span>
                          <span className="font-bold text-[#111111] text-base">{dl.buyerBid}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">Developer Counter</span>
                          <span className="font-bold text-[#111111] text-base">{dl.builderCounter}</span>
                        </div>
                        <div className="pt-3 border-t border-[#EAEAEA]">
                          <span className="text-neutral-500 block">Target Agreed Price</span>
                          <span className="font-bold text-emerald-700 text-base">{dl.agreedPrice}</span>
                        </div>
                        <div className="pt-3 border-t border-[#EAEAEA]">
                          <span className="text-neutral-500 block">Secured Brokerage</span>
                          <span className="font-bold text-[#111111] text-base">{dl.commission}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-2xl border border-[#EAEAEA]">
                  <p className="text-sm font-bold text-[#111111]">No active deals in negotiation yet</p>
                  <p className="text-xs text-neutral-500 mt-1">Click &apos;New Deal&apos; to track a prospective buyer offer.</p>
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
                  <h2 className="text-2xl sm:text-3xl font-bold font-hero text-[#111111] tracking-tight">
                    Team Management & Invites
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                    Invite brokers, assign agency territories, and manage permissions
                  </p>
                </div>

                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <UserPlus size={15} />
                  <span>Invite New Member</span>
                </button>
              </div>

              {teamLoading ? (
                <div className="p-12 text-center text-neutral-400 text-xs">Loading agency roster...</div>
              ) : team.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {team.map((member) => (
                    <div
                      key={member.id}
                      className="p-6 rounded-2xl bg-white border border-[#EAEAEA] shadow-2xs space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-[#0E0F12] text-white font-bold font-hero text-sm flex items-center justify-center">
                            {member.avatar ||
                              member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-3 py-0.5 rounded-full font-bold ${
                                member.status === "Active"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-[#FFF7D6] text-[#A17000]"
                              }`}
                            >
                              {member.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteBroker(member.id, member.name)}
                              className="p-1 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove Member"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-base font-bold font-hero text-[#111111]">{member.name}</h3>
                          <p className="text-xs text-[#E08A28] font-bold">{member.role}</p>
                          <p className="text-xs text-neutral-500 truncate mt-0.5">{member.email}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#EAEAEA] grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-neutral-500 block text-[11px]">Deals Closed</span>
                          <span className="font-bold text-[#111111] text-sm">{member.dealsClosed}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block text-[11px]">Active Leads</span>
                          <span className="font-bold text-[#111111] text-sm">{member.activeLeads}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-2xl border border-[#EAEAEA]">
                  <p className="text-sm font-bold text-[#111111]">No team members invited yet</p>
                  <p className="text-xs text-neutral-500 mt-1">Click &apos;Invite New Member&apos; to onboard brokers and associates.</p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB: AI COPILOT & MATCH ENGINE
             ============================================================ */}
          {activeTab === "ai-copilot" && (
            <div className="space-y-6">
              <div className="p-8 sm:p-10 rounded-3xl bg-[#0E0F12] text-white space-y-6 shadow-xl relative overflow-hidden border border-[#1C1D22]">
                <div className="flex items-center gap-2 text-[#F5C238] text-xs font-mono font-bold tracking-wider">
                  <Sparkles size={16} />
                  <span>PROPFLOW AUTONOMOUS MATCH ENGINE</span>
                </div>

                <div className="max-w-2xl space-y-3">
                  <h2 className="text-3xl sm:text-4xl font-bold font-hero leading-tight">
                    Ask AI Copilot for Instant Broker Intelligence
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                    Search your entire inventory and database with natural language queries to instantly find matching high-intent buyers.
                  </p>
                </div>

                {/* Natural Language Query Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExecuteAiQuery(aiQueryInput);
                  }}
                  className="flex gap-2 max-w-2xl"
                >
                  <input
                    type="text"
                    value={aiQueryInput}
                    onChange={(e) => setAiQueryInput(e.target.value)}
                    placeholder="e.g. Find buyers for 2 BHK in Dombivli under ₹95L..."
                    className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-neutral-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C238]"
                  />
                  <button
                    type="submit"
                    disabled={aiIsSearching}
                    className="px-6 py-3 rounded-2xl bg-[#F5C238] hover:bg-[#E5B228] text-black font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {aiIsSearching ? "Analyzing..." : "Ask Copilot"}
                  </button>
                </form>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {[
                    "Find buyers for 2 BHK in Dombivli under ₹95L",
                    "Show leads with 90%+ match score",
                    "Generate WhatsApp follow-up for top lead",
                    "List deals ready for token agreement",
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExecuteAiQuery(prompt)}
                      className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-[#F5C238] hover:text-black text-white border border-white/10 text-xs font-semibold transition-all text-left flex items-center gap-2 cursor-pointer"
                    >
                      <span>⚡ {prompt}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Query Results Output */}
              {aiQueryResult && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EAEAEA] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
                    <div>
                      <span className="text-xs font-bold text-[#E08A28] uppercase tracking-wider">
                        AI Match Results
                      </span>
                      <h3 className="text-lg font-bold font-hero text-[#111111]">
                        Query: &quot;{aiQueryResult.query}&quot;
                      </h3>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      Calculated Live
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-medium">
                    {aiQueryResult.summary}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {aiQueryResult.matches.map((m, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-[#FBFBFC] border border-[#EAEAEA] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#111111] text-sm">{m.leadName}</span>
                          <span className="text-xs font-black text-[#A17000] px-2.5 py-0.5 rounded-full bg-[#FFF7D6]">
                            {m.matchScore}% Match
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500">{m.reason}</p>
                        <a
                          href={getWhatsAppLink(m.phone, m.leadName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold hover:underline pt-1"
                        >
                          <MessageSquare size={13} />
                          <span>Initiate WhatsApp Outreach →</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ============================================================
          MODAL: ADD NEW LEAD
         ============================================================ */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl border border-[#EAEAEA] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsAddLeadOpen(false)}
              className="absolute top-6 right-6 text-neutral-400 hover:text-[#111111] cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold font-hero text-[#111111] mb-1">Add New Buyer Lead</h2>
            <p className="text-xs text-neutral-500 mb-6">Triggers instant AI MatchScore against scraped inventory.</p>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:ring-2 focus:ring-[#F5C238]/40 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    placeholder="+91 98201 00000"
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:ring-2 focus:ring-[#F5C238]/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    placeholder="vikram@gmail.com"
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:ring-2 focus:ring-[#F5C238]/40 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">BHK Preference</label>
                  <select
                    value={newLeadBhk}
                    onChange={(e) => setNewLeadBhk(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                  >
                    <option value="1 BHK">1 BHK</option>
                    <option value="2 BHK">2 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="4 BHK Luxury">4 BHK Luxury</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Target Locality</label>
                  <input
                    type="text"
                    value={newLeadLocation}
                    onChange={(e) => setNewLeadLocation(e.target.value)}
                    placeholder="Dombivli East"
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Budget Min (₹)</label>
                  <input
                    type="number"
                    value={newLeadBudgetMin}
                    onChange={(e) => setNewLeadBudgetMin(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Budget Max (₹)</label>
                  <input
                    type="number"
                    value={newLeadBudgetMax}
                    onChange={(e) => setNewLeadBudgetMax(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">Buyer Intent</label>
                <select
                  value={newLeadIntent}
                  onChange={(e) => setNewLeadIntent(e.target.value as "High" | "Medium" | "Low")}
                  className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                >
                  <option value="High">High Intent</option>
                  <option value="Medium">Medium Intent</option>
                  <option value="Low">Low Intent</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-neutral-100 text-neutral-700 font-bold hover:bg-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black font-bold shadow-xs cursor-pointer"
                >
                  Add Lead & Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: ADD PROPERTY
         ============================================================ */}
      {isAddPropertyOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl border border-[#EAEAEA] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsAddPropertyOpen(false)}
              className="absolute top-6 right-6 text-neutral-400 hover:text-[#111111] cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold font-hero text-[#111111] mb-1">Add New Property</h2>
            <p className="text-xs text-neutral-500 mb-6">List inventory to enable AI matching with high-intent buyers.</p>

            <form onSubmit={handleCreateProperty} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">Property Title</label>
                <input
                  type="text"
                  required
                  value={newPropTitle}
                  onChange={(e) => setNewPropTitle(e.target.value)}
                  placeholder="e.g. Lodha Palava Lakeshore Greens"
                  className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Developer / Builder</label>
                  <input
                    type="text"
                    value={newPropDeveloper}
                    onChange={(e) => setNewPropDeveloper(e.target.value)}
                    placeholder="Lodha Group"
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={newPropLocation}
                    onChange={(e) => setNewPropLocation(e.target.value)}
                    placeholder="Dombivli East, Thane"
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Price</label>
                  <input
                    type="text"
                    value={newPropPrice}
                    onChange={(e) => setNewPropPrice(e.target.value)}
                    placeholder="₹85 Lakh - ₹1.2 Cr"
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Configuration</label>
                  <input
                    type="text"
                    value={newPropType}
                    onChange={(e) => setNewPropType(e.target.value)}
                    placeholder="2, 3 BHK"
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Units Available</label>
                  <input
                    type="number"
                    value={newPropUnits}
                    onChange={(e) => setNewPropUnits(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setIsAddPropertyOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-neutral-100 text-neutral-700 font-bold hover:bg-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black font-bold shadow-xs cursor-pointer"
                >
                  Add Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: NEW DEAL
         ============================================================ */}
      {isAddDealOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl border border-[#EAEAEA] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsAddDealOpen(false)}
              className="absolute top-6 right-6 text-neutral-400 hover:text-[#111111] cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold font-hero text-[#111111] mb-1">Create Deal Pipeline Item</h2>
            <p className="text-xs text-neutral-500 mb-6">Track negotiation spread and secure broker commission.</p>

            <form onSubmit={handleCreateDeal} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">Select Buyer Lead</label>
                <select
                  required
                  value={newDealLeadId}
                  onChange={(e) => setNewDealLeadId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
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
                <label className="block text-neutral-700 font-bold mb-1">Select Property (Optional)</label>
                <select
                  value={newDealPropertyId}
                  onChange={(e) => setNewDealPropertyId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                >
                  <option value="">Choose Property...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Buyer Bid</label>
                  <input
                    type="text"
                    value={newDealBuyerBid}
                    onChange={(e) => setNewDealBuyerBid(e.target.value)}
                    placeholder="₹90,00,000"
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Builder Counter</label>
                  <input
                    type="text"
                    value={newDealBuilderCounter}
                    onChange={(e) => setNewDealBuilderCounter(e.target.value)}
                    placeholder="₹95,00,000"
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Target Agreed Price</label>
                  <input
                    type="text"
                    value={newDealAgreedPrice}
                    onChange={(e) => setNewDealAgreedPrice(e.target.value)}
                    placeholder="₹92,50,000"
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Secured Brokerage (₹)</label>
                  <input
                    type="text"
                    value={newDealCommission}
                    onChange={(e) => setNewDealCommission(e.target.value)}
                    placeholder="₹1,85,000"
                    className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">Initial Stage</label>
                <select
                  value={newDealStage}
                  onChange={(e) => setNewDealStage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                >
                  <option value="Negotiation">Negotiation</option>
                  <option value="Offer Made">Offer Made</option>
                  <option value="Token Received">Token Received</option>
                  <option value="Documentation">Documentation</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setIsAddDealOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-neutral-100 text-neutral-700 font-bold hover:bg-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black font-bold shadow-xs cursor-pointer"
                >
                  Create Deal
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
          <div className="bg-white rounded-3xl border border-[#EAEAEA] max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold font-hero text-[#111111] mb-1">Invite Team Member</h2>
            <p className="text-xs text-neutral-500 mb-6">Send invitation link for agency workspace access.</p>

            <form onSubmit={handleInviteMember} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">Member Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Rohan Deshmukh"
                  className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="rohan@agency.com"
                  className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">Role & Permissions</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMemberItem["role"])}
                  className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                >
                  <option value="Senior Broker">Senior Broker (Full pipeline + deals)</option>
                  <option value="Field Agent">Field Agent (Site visits + leads)</option>
                  <option value="Property Consultant">Property Consultant</option>
                  <option value="Agency Admin">Agency Admin (Full access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-neutral-100 text-neutral-700 font-bold hover:bg-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black font-bold shadow-xs cursor-pointer"
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
          <div className="bg-white rounded-3xl border border-[#EAEAEA] max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsScheduleVisitOpen(false)}
              className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold font-hero text-[#111111] mb-1">Schedule Site Visit</h2>
            <p className="text-xs text-neutral-500 mb-6">Coordinate client inspection slot with broker attendance.</p>

            <form onSubmit={handleScheduleVisit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">Select Buyer Lead</label>
                <select
                  required
                  value={visitLeadId}
                  onChange={(e) => setVisitLeadId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
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
                <label className="block text-neutral-700 font-bold mb-1">Select Property</label>
                <select
                  value={visitPropertyId}
                  onChange={(e) => setVisitPropertyId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
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
                <label className="block text-neutral-700 font-bold mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={visitDateTime}
                  onChange={(e) => setVisitDateTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">Host Broker</label>
                <input
                  type="text"
                  value={visitAgent}
                  onChange={(e) => setVisitAgent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setIsScheduleVisitOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-neutral-100 text-neutral-700 font-bold hover:bg-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black font-bold shadow-xs cursor-pointer"
                >
                  Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: RESCHEDULE SITE VISIT
         ============================================================ */}
      {isRescheduleVisitOpen && selectedVisitToReschedule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl border border-[#EAEAEA] max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => {
                setIsRescheduleVisitOpen(false);
                setSelectedVisitToReschedule(null);
              }}
              className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold font-hero text-[#111111] mb-1">Reschedule Site Visit</h2>
            <p className="text-xs text-neutral-500 mb-6">
              Change walkthrough slot for {selectedVisitToReschedule.leadName} ({selectedVisitToReschedule.propertyTitle}).
            </p>

            <form onSubmit={handleRescheduleVisit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">New Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={rescheduleDateTime}
                  onChange={(e) => setRescheduleDateTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#EAEAEA] text-[#111111] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => {
                    setIsRescheduleVisitOpen(false);
                    setSelectedVisitToReschedule(null);
                  }}
                  className="px-5 py-2.5 rounded-full bg-neutral-100 text-neutral-700 font-bold hover:bg-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black font-bold shadow-xs cursor-pointer"
                >
                  Update Slot
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
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#EAEAEA] p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F5C238] text-black font-bold font-hero text-sm flex items-center justify-center">
                  {selectedLead.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="font-bold font-hero text-lg text-[#111111]">{selectedLead.name}</h3>
                  <p className="text-xs text-neutral-500">{selectedLead.phone} • {selectedLead.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-neutral-400 hover:text-neutral-900 p-1.5 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Match Highlight */}
            <div className="p-4 rounded-2xl bg-[#FFFDF5] border border-[#F5C238]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A17000]">AI Property Match</span>
                <span className="text-xs font-extrabold text-[#A17000]">{selectedLead.matchScore}% Match Score</span>
              </div>
              <p className="text-sm font-bold font-hero text-[#111111]">{selectedLead.matchedProperty}</p>
              <p className="text-xs text-neutral-600">
                Matches budget ({selectedLead.budget}) and {selectedLead.bhk} preference in {selectedLead.location}.
              </p>
            </div>

            {/* Lead Meta */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#EAEAEA]">
                <span className="text-neutral-400 block">Lead Status</span>
                <span className="font-bold text-[#111111]">{selectedLead.status}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#EAEAEA]">
                <span className="text-neutral-400 block">Assigned Broker</span>
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
                className="flex-1 py-3 rounded-full bg-[#F5C238] hover:bg-[#E5B228] text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
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
