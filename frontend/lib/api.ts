"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ==========================================
// FORMATTING HELPERS
// ==========================================
export function formatINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "₹0";
  if (val >= 10000000) {
    const cr = val / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    const lac = val / 100000;
    return `₹${lac % 1 === 0 ? lac.toFixed(0) : lac.toFixed(1)} L`;
  }
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export function cleanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

// ==========================================
// TYPES
// ==========================================
export interface StatsData {
  activePipeline: number;
  totalClosedGmv: number;
  scrapedProperties: number;
  activeLeads: number;
  matchAccuracyPct: number;
  leadsGrowthPct: number | null;
}

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  bhk: string;
  location: string;
  budgetMin: number;
  budgetMax: number;
  budget: string;
  intent: "High" | "Medium" | "Low";
  matchScore: number;
  matchedProperty: string;
  matchedPropertyId: string | null;
  status: "New" | "Contacted" | "Site Visit Scheduled" | "Negotiation" | "Closed";
  rawStatus: string;
  agent: string;
  notes?: string;
  createdAt: string;
}

export interface PropertyItem {
  id: string;
  externalId: string;
  title: string;
  description?: string;
  developer: string;
  location: string;
  locality: string;
  city: string;
  type: string;
  price: string;
  numericPrice: number;
  carpetAreaSqFt?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnishingStatus?: string;
  unitsAvailable: number;
  status: "Available" | "Filling Fast" | "Ready Possession";
  imageBg: string;
  imageUrl: string;
  matchCount: number;
  topScore?: number;
  sourcePortal: string;
  sourceUrl: string;
  scrapedAt: string;
}

export interface SiteVisitItem {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  propertyId?: string | null;
  propertyTitle: string;
  location: string;
  dateTime: string;
  agent: string;
  status: "Confirmed" | "Pending Confirmation" | "Completed" | "Cancelled";
  notes?: string;
}

export interface DealItem {
  id: string;
  leadName: string;
  propertyTitle: string;
  buyerBid: string;
  builderCounter: string;
  agreedPrice: string;
  commission: string;
  stage: "Offer Placed" | "In Negotiation" | "Token Received" | "Closed Deal";
  rawStage: string;
}

export interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "Agency Admin" | "Senior Broker" | "Field Agent" | "Property Consultant";
  status: "Active" | "Invited";
  dealsClosed: number;
  activeLeads: number;
  revenue: number;
  avatar: string;
}

export interface DashboardData {
  kpis: {
    activePipeline: number;
    totalClosedGmv: number;
    activeLeads: number;
    scrapedProperties: number;
    matchAccuracyPct: number;
    leadsGrowthPct: number | null;
  };
  counts: {
    leads: number;
    properties: number;
    visits: number;
    deals: number;
    team: number;
  };
  priorityMatches: Array<{
    leadId: string;
    leadName: string;
    leadPhone: string;
    leadEmail?: string;
    leadBhk: string;
    leadLocation: string;
    leadBudget: string;
    intent: "High" | "Medium" | "Low";
    matchScore: number;
    matchedProperty: string;
    matchedPropertyId: string | null;
    status: string;
    agent: string;
    createdAt: string;
  }>;
  upcomingVisits: SiteVisitItem[];
  recentDeals: Array<{
    id: string;
    title: string;
    leadName: string;
    propertyTitle: string;
    buyerBid: number;
    builderAsk: number;
    agreedPrice: number | null;
    brokerageAmount: number;
    stage: string;
    status: string;
  }>;
}

export interface MatchScoreResult {
  budgetScore: number;
  bhkScore: number;
  localityScore: number;
  totalScore: number;
  intent: "High" | "Medium" | "Low";
  property: PropertyItem;
}

// ==========================================
// API FETCH CLIENT FUNCTIONS
// ==========================================
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let errorMsg = `API Error ${res.status}: ${res.statusText}`;
    try {
      const json = await res.json();
      if (json.error) errorMsg = json.error;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function fetchStats(): Promise<StatsData> {
  return apiFetch<StatsData>("/api/stats");
}

export async function fetchDashboard(): Promise<DashboardData> {
  return apiFetch<DashboardData>("/api/dashboard");
}

export async function fetchLeads(intent?: string, q?: string): Promise<LeadItem[]> {
  const params = new URLSearchParams();
  if (intent && intent !== "All") params.set("intent", intent);
  if (q && q.trim()) params.set("q", q.trim());
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<LeadItem[]>(`/api/leads${queryStr}`);
}

export async function fetchLeadMatches(leadId: string): Promise<MatchScoreResult[]> {
  return apiFetch<MatchScoreResult[]>(`/api/leads/${leadId}/matches`);
}

export async function fetchProperties(params?: {
  city?: string;
  bhk?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
}): Promise<{ total: number; data: PropertyItem[] }> {
  const searchParams = new URLSearchParams();
  if (params?.city && params.city !== "All") searchParams.set("city", params.city);
  if (params?.bhk && params.bhk !== "All") searchParams.set("bhk", params.bhk);
  if (params?.minPrice) searchParams.set("minPrice", params.minPrice.toString());
  if (params?.maxPrice) searchParams.set("maxPrice", params.maxPrice.toString());
  if (params?.q) searchParams.set("q", params.q);
  const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return apiFetch<{ total: number; data: PropertyItem[] }>(`/api/properties${qs}`);
}

export async function fetchFeaturedProperties(): Promise<PropertyItem[]> {
  return apiFetch<PropertyItem[]>("/api/properties/featured");
}

export async function fetchSiteVisits(): Promise<SiteVisitItem[]> {
  return apiFetch<SiteVisitItem[]>("/api/site-visits");
}

export async function fetchDeals(): Promise<DealItem[]> {
  return apiFetch<DealItem[]>("/api/deals");
}

export async function fetchBrokers(): Promise<TeamMemberItem[]> {
  return apiFetch<TeamMemberItem[]>("/api/brokers");
}

// Mutations
export async function createLead(data: {
  name: string;
  phone: string;
  email?: string;
  preferredBhk?: string;
  preferredLocalities?: string[];
  budgetMin?: number;
  budgetMax?: number;
  intent?: string;
  notes?: string;
  assignedBrokerId?: string;
}): Promise<LeadItem> {
  return apiFetch<LeadItem>("/api/leads", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateLead(id: string, data: Partial<LeadItem>): Promise<LeadItem> {
  return apiFetch<LeadItem>(`/api/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function createSiteVisit(data: {
  leadId: string;
  propertyId?: string | null;
  scheduledAt: string;
  agentName?: string;
  notes?: string;
}): Promise<SiteVisitItem> {
  return apiFetch<SiteVisitItem>("/api/site-visits", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSiteVisit(id: string, data: Partial<SiteVisitItem>): Promise<SiteVisitItem> {
  return apiFetch<SiteVisitItem>(`/api/site-visits/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function createBroker(data: {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  avatar?: string;
}): Promise<TeamMemberItem> {
  return apiFetch<TeamMemberItem>("/api/brokers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ==========================================
// REACT HOOKS
// ==========================================
export function useStats() {
  const [data, setData] = useState<StatsData>({
    activePipeline: 0,
    totalClosedGmv: 0,
    scrapedProperties: 0,
    activeLeads: 0,
    matchAccuracyPct: 0,
    leadsGrowthPct: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetchStats();
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetchDashboard();
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useLeads(intent?: string, q?: string) {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchLeads(intent, q);
      setLeads(res);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [intent, q]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { leads, loading, error, reload };
}

export function useProperties(params?: {
  city?: string;
  bhk?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
}) {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchProperties(params);
      setProperties(res.data);
      setTotal(res.total);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, [params?.city, params?.bhk, params?.minPrice, params?.maxPrice, params?.q]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { properties, total, loading, error, reload };
}

export function useFeaturedProperties() {
  const [featured, setFeatured] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetchFeaturedProperties();
      setFeatured(res);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load featured properties");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { featured, loading, error, reload };
}

export function useMatches(leadId?: string | null) {
  const [matches, setMatches] = useState<MatchScoreResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!leadId) {
      setMatches([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchLeadMatches(leadId);
      setMatches(res);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { matches, loading, error, reload };
}

export function useSiteVisits() {
  const [visits, setVisits] = useState<SiteVisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSiteVisits();
      setVisits(res);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load site visits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { visits, loading, error, reload };
}

export function useDeals() {
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDeals();
      setDeals(res);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { deals, loading, error, reload };
}

export function useBrokers() {
  const [brokers, setBrokers] = useState<TeamMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBrokers();
      setBrokers(res);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load brokers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { brokers, loading, error, reload };
}
