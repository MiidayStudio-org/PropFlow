import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  calculateMatchScore,
  getMatchesForLead,
  parseBhkNumber,
} from "../services/matchScore";
import { LeadIntent, LeadStatus, VisitStatus, DealStage } from "@prisma/client";

export const apiRouter = Router();

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================
const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(6, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  preferredBhk: z.string().default("2 BHK"),
  preferredLocalities: z.union([z.array(z.string()), z.string()]).transform((val) => {
    if (Array.isArray(val)) return val;
    return val ? val.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }),
  budgetMin: z.coerce.number().nonnegative().default(0),
  budgetMax: z.coerce.number().nonnegative().default(0),
  intent: z
    .enum(["HIGH", "MEDIUM", "LOW", "High", "Medium", "Low"])
    .transform((val) => val.toUpperCase() as LeadIntent)
    .default("MEDIUM"),
  status: z
    .enum([
      "NEW",
      "CONTACTED",
      "VISIT_SCHEDULED",
      "NEGOTIATION",
      "CLOSED",
      "New",
      "Contacted",
      "Site Visit Scheduled",
      "Negotiation",
      "Closed",
    ])
    .transform((val) => {
      const upper = val.toUpperCase().replace(/\s+/g, "_");
      if (upper === "SITE_VISIT_SCHEDULED") return "VISIT_SCHEDULED" as LeadStatus;
      return (upper as LeadStatus) || "NEW";
    })
    .default("NEW"),
  notes: z.string().optional(),
  assignedBrokerId: z.string().optional().nullable(),
});

const patchLeadSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional().nullable(),
  preferredBhk: z.string().optional(),
  preferredLocalities: z.array(z.string()).optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  intent: z
    .enum(["HIGH", "MEDIUM", "LOW", "High", "Medium", "Low"])
    .transform((val) => val.toUpperCase() as LeadIntent)
    .optional(),
  status: z
    .enum([
      "NEW",
      "CONTACTED",
      "VISIT_SCHEDULED",
      "NEGOTIATION",
      "CLOSED",
      "New",
      "Contacted",
      "Site Visit Scheduled",
      "Negotiation",
      "Closed",
    ])
    .transform((val) => {
      const upper = val.toUpperCase().replace(/\s+/g, "_");
      if (upper === "SITE_VISIT_SCHEDULED") return "VISIT_SCHEDULED" as LeadStatus;
      return (upper as LeadStatus) || "NEW";
    })
    .optional(),
  notes: z.string().optional().nullable(),
  assignedBrokerId: z.string().optional().nullable(),
});

const createSiteVisitSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  propertyId: z.string().optional().nullable(),
  scheduledAt: z.coerce.date(),
  agentName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z
    .enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "Pending Confirmation", "Confirmed", "Completed"])
    .transform((val) => {
      const map: Record<string, VisitStatus> = {
        "Pending Confirmation": "PENDING",
        PENDING: "PENDING",
        Confirmed: "CONFIRMED",
        CONFIRMED: "CONFIRMED",
        Completed: "COMPLETED",
        COMPLETED: "COMPLETED",
        CANCELLED: "CANCELLED",
      };
      return map[val] || "PENDING";
    })
    .default("PENDING"),
});

const patchSiteVisitSchema = z.object({
  status: z
    .enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "Pending Confirmation", "Confirmed", "Completed"])
    .transform((val) => {
      const map: Record<string, VisitStatus> = {
        "Pending Confirmation": "PENDING",
        PENDING: "PENDING",
        Confirmed: "CONFIRMED",
        CONFIRMED: "CONFIRMED",
        Completed: "COMPLETED",
        COMPLETED: "COMPLETED",
        CANCELLED: "CANCELLED",
      };
      return map[val] || "PENDING";
    })
    .optional(),
  scheduledAt: z.coerce.date().optional(),
  agentName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const createBrokerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().nullable(),
  role: z.string().default("Senior Broker"),
  avatar: z.string().optional().nullable(),
});

// ==========================================
// 1. STATS ENDPOINT (GET /api/stats)
// ==========================================
apiRouter.get("/stats", async (req: Request, res: Response) => {
  try {
    const [propertiesCount, leadsCount, activeLeadsCount, deals, leads] = await Promise.all([
      prisma.property.count(),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: { not: "CLOSED" } } }),
      prisma.deal.findMany({ select: { agreedPrice: true, buyerBid: true, stage: true } }),
      prisma.lead.findMany({
        where: { status: { not: "CLOSED" } },
        take: 30,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Calculate Active Pipeline
    const activeDeals = deals.filter((d) => d.stage !== "CLOSED");
    let activePipeline = activeDeals.reduce((sum, d) => sum + (d.agreedPrice || d.buyerBid || 0), 0);

    // If no active deals, derive from active leads' average budget
    if (activePipeline === 0 && leads.length > 0) {
      activePipeline = leads.reduce((sum, l) => sum + ((l.budgetMin + l.budgetMax) / 2 || 0), 0);
    }

    // Closed GMV
    const closedDeals = deals.filter((d) => d.stage === "CLOSED");
    const totalClosedGmv = closedDeals.reduce((sum, d) => sum + (d.agreedPrice || d.buyerBid || 0), 0);

    // Match accuracy computed from live property matches
    let matchAccuracyPct = 0;
    if (leads.length > 0 && propertiesCount > 0) {
      const topProps = await prisma.property.findMany({ take: 20 });
      let totalScoreSum = 0;
      let scoredLeads = 0;

      for (const lead of leads.slice(0, 10)) {
        let best = 0;
        for (const prop of topProps) {
          const m = calculateMatchScore(lead, prop);
          if (m.totalScore > best) best = m.totalScore;
        }
        if (best > 0) {
          totalScoreSum += best;
          scoredLeads++;
        }
      }
      matchAccuracyPct = scoredLeads > 0 ? parseFloat((totalScoreSum / scoredLeads).toFixed(1)) : 0;
    }

    // Growth percentage
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentLeadsCount = await prisma.lead.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });
    const priorLeadsCount = leadsCount - recentLeadsCount;
    const leadsGrowthPct =
      priorLeadsCount > 0
        ? Math.round(((recentLeadsCount - priorLeadsCount) / priorLeadsCount) * 100)
        : recentLeadsCount > 0
        ? 100
        : null;

    res.json({
      activePipeline,
      totalClosedGmv,
      scrapedProperties: propertiesCount,
      activeLeads: activeLeadsCount,
      matchAccuracyPct,
      leadsGrowthPct,
    });
  } catch (error: any) {
    console.error("[API Error] /stats:", error);
    res.status(500).json({ error: "Failed to calculate stats", details: error.message });
  }
});

// ==========================================
// 2. DASHBOARD ENDPOINT (GET /api/dashboard)
// ==========================================
apiRouter.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const [propertiesCount, leadsCount, visitsCount, dealsCount, teamCount] = await Promise.all([
      prisma.property.count(),
      prisma.lead.count(),
      prisma.siteVisit.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }),
      prisma.deal.count({ where: { stage: { not: "CLOSED" } } }),
      prisma.broker.count(),
    ]);

    // Active leads for priority matching
    const activeLeads = await prisma.lead.findMany({
      where: { status: { not: "CLOSED" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { assignedBroker: true },
    });

    const sampleProps = await prisma.property.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    // Compute priority matches
    const priorityMatches = activeLeads
      .map((lead) => {
        let bestMatch = null;
        let highest = 0;
        for (const prop of sampleProps) {
          const match = calculateMatchScore(lead, prop);
          if (match.totalScore > highest) {
            highest = match.totalScore;
            bestMatch = match;
          }
        }
        return {
          leadId: lead.id,
          leadName: lead.name,
          leadPhone: lead.phone,
          leadEmail: lead.email,
          leadBhk: lead.preferredBhk,
          leadLocation: lead.preferredLocalities.join(", ") || "Maharashtra",
          leadBudget: `₹${(lead.budgetMin / 100000).toFixed(0)}L - ₹${(lead.budgetMax / 100000).toFixed(0)}L`,
          intent: (bestMatch?.intent || lead.intent) as "High" | "Medium" | "Low",
          matchScore: bestMatch?.totalScore || 0,
          matchedProperty: bestMatch?.property.title || "Pending property sync",
          matchedPropertyId: bestMatch?.property.id || null,
          status: lead.status,
          agent: lead.assignedBroker?.name || "Unassigned",
          createdAt: lead.createdAt,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    // Upcoming site visits
    const upcomingVisitsRaw = await prisma.siteVisit.findMany({
      orderBy: { scheduledAt: "asc" },
      take: 10,
      include: {
        lead: true,
      },
    });

    // Resolve property for visits
    const propIds = upcomingVisitsRaw
      .map((v) => v.propertyId)
      .filter((id): id is string => Boolean(id));

    const matchedProps =
      propIds.length > 0
        ? await prisma.property.findMany({ where: { id: { in: propIds } } })
        : [];
    const propMap = new Map(matchedProps.map((p) => [p.id, p]));

    const upcomingVisits = upcomingVisitsRaw.map((v) => {
      const prop = v.propertyId ? propMap.get(v.propertyId) : null;
      return {
        id: v.id,
        leadId: v.leadId,
        leadName: v.lead.name,
        leadPhone: v.lead.phone,
        propertyTitle: prop?.title || "Property Walkthrough",
        location: prop?.locality ? `${prop.locality}, ${prop.city}` : "Site Location",
        dateTime: v.scheduledAt.toISOString(),
        agent: v.agentName || "Associate Broker",
        status:
          v.status === "CONFIRMED"
            ? "Confirmed"
            : v.status === "COMPLETED"
            ? "Completed"
            : "Pending Confirmation",
        notes: v.notes,
      };
    });

    // Recent deals
    const recentDealsRaw = await prisma.deal.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        lead: true,
        broker: true,
      },
    });

    const recentDeals = recentDealsRaw.map((d) => ({
      id: d.id,
      title: d.title,
      leadName: d.lead.name,
      propertyTitle: d.title,
      buyerBid: d.buyerBid,
      builderAsk: d.builderAsk,
      agreedPrice: d.agreedPrice,
      brokerageAmount: d.brokerageAmount || Math.round((d.agreedPrice || d.buyerBid) * 0.02),
      stage: d.stage,
      status: d.status,
    }));

    // Stats calculation
    const activePipeline = priorityMatches.reduce((sum, item) => {
      const lead = activeLeads.find((l) => l.id === item.leadId);
      return sum + (lead ? (lead.budgetMin + lead.budgetMax) / 2 : 0);
    }, 0);

    const matchAccuracyPct =
      priorityMatches.length > 0
        ? parseFloat(
            (
              priorityMatches.reduce((sum, m) => sum + m.matchScore, 0) /
              priorityMatches.length
            ).toFixed(1)
          )
        : 0;

    res.json({
      kpis: {
        activePipeline,
        totalClosedGmv: 0,
        activeLeads: leadsCount,
        scrapedProperties: propertiesCount,
        matchAccuracyPct,
        leadsGrowthPct: leadsCount > 0 ? 100 : null,
      },
      counts: {
        leads: leadsCount,
        properties: propertiesCount,
        visits: visitsCount,
        deals: dealsCount,
        team: teamCount,
      },
      priorityMatches,
      upcomingVisits,
      recentDeals,
    });
  } catch (error: any) {
    console.error("[API Error] /dashboard:", error);
    res.status(500).json({ error: "Failed to load dashboard telemetry", details: error.message });
  }
});

// ==========================================
// 3. LEADS ENDPOINTS
// ==========================================
apiRouter.get("/leads", async (req: Request, res: Response) => {
  try {
    const { intent, q } = req.query;

    const where: any = {};

    if (intent && typeof intent === "string" && intent.toLowerCase() !== "all") {
      const upper = intent.toUpperCase();
      if (["HIGH", "MEDIUM", "LOW"].includes(upper)) {
        where.intent = upper as LeadIntent;
      }
    }

    if (q && typeof q === "string" && q.trim()) {
      const cleanQ = q.trim();
      where.OR = [
        { name: { contains: cleanQ, mode: "insensitive" } },
        { phone: { contains: cleanQ } },
        { email: { contains: cleanQ, mode: "insensitive" } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        assignedBroker: true,
      },
    });

    const sampleProps = await prisma.property.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    // Augment with computed live match
    const enrichedLeads = leads.map((lead) => {
      let bestMatch = null;
      let highest = 0;
      for (const prop of sampleProps) {
        const m = calculateMatchScore(lead, prop);
        if (m.totalScore > highest) {
          highest = m.totalScore;
          bestMatch = m;
        }
      }

      // Map status enum to human label
      const statusMap: Record<LeadStatus, string> = {
        NEW: "New",
        CONTACTED: "Contacted",
        VISIT_SCHEDULED: "Site Visit Scheduled",
        NEGOTIATION: "Negotiation",
        CLOSED: "Closed",
      };

      const intentMap: Record<LeadIntent, "High" | "Medium" | "Low"> = {
        HIGH: "High",
        MEDIUM: "Medium",
        LOW: "Low",
      };

      return {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || "",
        bhk: lead.preferredBhk,
        location: lead.preferredLocalities.join(", ") || "All Areas",
        budgetMin: lead.budgetMin,
        budgetMax: lead.budgetMax,
        budget:
          lead.budgetMin && lead.budgetMax
            ? `₹${(lead.budgetMin / 100000).toFixed(0)}L - ₹${(lead.budgetMax / 100000).toFixed(0)}L`
            : "Flexible",
        intent: intentMap[lead.intent] || "Medium",
        matchScore: bestMatch?.totalScore || 0,
        matchedProperty: bestMatch?.property.title || "Searching inventory...",
        matchedPropertyId: bestMatch?.property.id || null,
        status: statusMap[lead.status] || "New",
        rawStatus: lead.status,
        agent: lead.assignedBroker?.name || "Senior Associate",
        notes: lead.notes,
        createdAt: lead.createdAt.toISOString(),
      };
    });

    res.json(enrichedLeads);
  } catch (error: any) {
    console.error("[API Error] GET /leads:", error);
    res.status(500).json({ error: "Failed to fetch leads", details: error.message });
  }
});

apiRouter.post("/leads", async (req: Request, res: Response) => {
  try {
    const parsed = createLeadSchema.parse(req.body);

    const lead = await prisma.lead.create({
      data: {
        name: parsed.name,
        phone: parsed.phone,
        email: parsed.email || null,
        preferredBhk: parsed.preferredBhk,
        preferredLocalities: parsed.preferredLocalities,
        budgetMin: parsed.budgetMin,
        budgetMax: parsed.budgetMax,
        intent: parsed.intent,
        status: parsed.status,
        notes: parsed.notes || null,
        assignedBrokerId: parsed.assignedBrokerId || null,
      },
      include: {
        assignedBroker: true,
      },
    });

    res.status(201).json(lead);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", issues: error.issues });
    }
    console.error("[API Error] POST /leads:", error);
    res.status(500).json({ error: "Failed to create lead", details: error.message });
  }
});

apiRouter.patch("/leads/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = patchLeadSchema.parse(req.body);

    const updated = await prisma.lead.update({
      where: { id },
      data: parsed,
      include: { assignedBroker: true },
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", issues: error.issues });
    }
    console.error(`[API Error] PATCH /leads/${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to update lead", details: error.message });
  }
});

apiRouter.get("/leads/:id/matches", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const matches = await getMatchesForLead(id, 10);
    res.json(matches);
  } catch (error: any) {
    console.error(`[API Error] GET /leads/${req.params.id}/matches:`, error);
    res.status(500).json({ error: "Failed to compute matches", details: error.message });
  }
});

// ==========================================
// 4. PROPERTIES ENDPOINTS
// ==========================================
apiRouter.get("/properties", async (req: Request, res: Response) => {
  try {
    const { city, minPrice, maxPrice, bhk, q, limit } = req.query;

    const where: any = {};

    if (city && typeof city === "string" && city.toLowerCase() !== "all") {
      where.city = { contains: city.trim(), mode: "insensitive" };
    }

    if (bhk && typeof bhk === "string" && bhk.toLowerCase() !== "all") {
      const bhkNum = parseBhkNumber(bhk);
      where.bedrooms = bhkNum;
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      where.price = { ...where.price, gte: Number(minPrice) };
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      where.price = { ...where.price, lte: Number(maxPrice) };
    }

    if (q && typeof q === "string" && q.trim()) {
      where.OR = [
        { title: { contains: q.trim(), mode: "insensitive" } },
        { locality: { contains: q.trim(), mode: "insensitive" } },
        { city: { contains: q.trim(), mode: "insensitive" } },
      ];
    }

    const take = limit ? Math.min(100, Math.max(1, Number(limit))) : 50;

    const [total, properties, activeLeads] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        take,
        orderBy: { scrapedAt: "desc" },
      }),
      prisma.lead.findMany({
        where: { status: { not: "CLOSED" } },
        take: 30,
      }),
    ]);

    // Format properties for dashboard display
    const enrichedProperties = properties.map((p) => {
      // Calculate how many active leads match this property well (score >= 65)
      let matchCount = 0;
      for (const lead of activeLeads) {
        const m = calculateMatchScore(lead, p);
        if (m.totalScore >= 65) matchCount++;
      }

      const formattedPrice =
        p.price >= 10000000
          ? `₹${(p.price / 10000000).toFixed(2)} Cr`
          : `₹${(p.price / 100000).toFixed(1)} L`;

      return {
        id: p.id,
        externalId: p.externalId,
        title: p.title,
        developer: p.title.split(" ")[0] + " Developers",
        location: `${p.locality}, ${p.city}`,
        locality: p.locality,
        city: p.city,
        type: `${p.bedrooms} BHK (${p.carpetAreaSqFt} SqFt)`,
        price: formattedPrice,
        numericPrice: p.price,
        unitsAvailable: Math.max(1, (p.bedrooms * 4) % 15 + 2),
        status: p.bedrooms >= 3 ? "Filling Fast" : "Available",
        imageBg: "from-[#FF5C1C]/10 to-[#111111]/5",
        imageUrl: p.images[0] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
        matchCount,
        sourcePortal: p.sourcePortal,
        sourceUrl: p.sourceUrl,
        scrapedAt: p.scrapedAt.toISOString(),
      };
    });

    res.json({
      total,
      data: enrichedProperties,
    });
  } catch (error: any) {
    console.error("[API Error] GET /properties:", error);
    res.status(500).json({ error: "Failed to fetch properties", details: error.message });
  }
});

apiRouter.get("/properties/featured", async (req: Request, res: Response) => {
  try {
    const featured = await prisma.property.findMany({
      take: 4,
      orderBy: { scrapedAt: "desc" },
    });

    const activeLeads = await prisma.lead.findMany({
      where: { status: { not: "CLOSED" } },
      take: 20,
    });

    const enriched = featured.map((p) => {
      let topScore = 0;
      for (const lead of activeLeads) {
        const m = calculateMatchScore(lead, p);
        if (m.totalScore > topScore) topScore = m.totalScore;
      }

      return {
        ...p,
        topScore: topScore || 92,
        formattedPrice:
          p.price >= 10000000
            ? `₹${(p.price / 10000000).toFixed(2)} Cr`
            : `₹${(p.price / 100000).toFixed(1)} L`,
      };
    });

    res.json(enriched);
  } catch (error: any) {
    console.error("[API Error] GET /properties/featured:", error);
    res.status(500).json({ error: "Failed to fetch featured properties", details: error.message });
  }
});

// ==========================================
// 5. SITE VISITS ENDPOINTS
// ==========================================
apiRouter.get("/site-visits", async (req: Request, res: Response) => {
  try {
    const visits = await prisma.siteVisit.findMany({
      orderBy: { scheduledAt: "asc" },
      include: {
        lead: true,
      },
    });

    const propIds = visits.map((v) => v.propertyId).filter((id): id is string => Boolean(id));
    const properties =
      propIds.length > 0
        ? await prisma.property.findMany({ where: { id: { in: propIds } } })
        : [];
    const propMap = new Map(properties.map((p) => [p.id, p]));

    const formatted = visits.map((v) => {
      const prop = v.propertyId ? propMap.get(v.propertyId) : null;
      return {
        id: v.id,
        leadId: v.leadId,
        leadName: v.lead.name,
        leadPhone: v.lead.phone,
        leadEmail: v.lead.email,
        propertyId: v.propertyId,
        propertyTitle: prop?.title || "Property Walkthrough",
        location: prop ? `${prop.locality}, ${prop.city}` : "Site Location",
        dateTime: v.scheduledAt.toISOString(),
        agent: v.agentName || "Assigned Broker",
        status:
          v.status === "CONFIRMED"
            ? "Confirmed"
            : v.status === "COMPLETED"
            ? "Completed"
            : v.status === "CANCELLED"
            ? "Cancelled"
            : "Pending Confirmation",
        notes: v.notes,
      };
    });

    res.json(formatted);
  } catch (error: any) {
    console.error("[API Error] GET /site-visits:", error);
    res.status(500).json({ error: "Failed to fetch site visits", details: error.message });
  }
});

apiRouter.post("/site-visits", async (req: Request, res: Response) => {
  try {
    const parsed = createSiteVisitSchema.parse(req.body);

    const visit = await prisma.siteVisit.create({
      data: {
        leadId: parsed.leadId,
        propertyId: parsed.propertyId || null,
        scheduledAt: parsed.scheduledAt,
        agentName: parsed.agentName || null,
        notes: parsed.notes || null,
        status: parsed.status,
      },
      include: { lead: true },
    });

    // Also update lead status to VISIT_SCHEDULED if it is NEW or CONTACTED
    await prisma.lead.updateMany({
      where: {
        id: parsed.leadId,
        status: { in: ["NEW", "CONTACTED"] },
      },
      data: { status: "VISIT_SCHEDULED" },
    });

    res.status(201).json(visit);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", issues: error.issues });
    }
    console.error("[API Error] POST /site-visits:", error);
    res.status(500).json({ error: "Failed to create site visit", details: error.message });
  }
});

apiRouter.patch("/site-visits/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = patchSiteVisitSchema.parse(req.body);

    const updated = await prisma.siteVisit.update({
      where: { id },
      data: parsed,
      include: { lead: true },
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", issues: error.issues });
    }
    console.error(`[API Error] PATCH /site-visits/${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to update visit", details: error.message });
  }
});

// ==========================================
// 6. BROKERS / TEAM ENDPOINTS
// ==========================================
apiRouter.get("/brokers", async (req: Request, res: Response) => {
  try {
    const brokers = await prisma.broker.findMany({
      orderBy: { dealsClosed: "desc" },
      include: {
        _count: {
          select: { leads: true, deals: true },
        },
      },
    });

    const formatted = brokers.map((b) => ({
      id: b.id,
      name: b.name,
      email: b.email,
      phone: b.phone || "",
      role: b.role as "Agency Admin" | "Senior Broker" | "Field Agent" | "Property Consultant",
      status: b.status as "Active" | "Invited",
      dealsClosed: b.dealsClosed,
      activeLeads: b._count.leads,
      revenue: b.revenue,
      avatar: b.avatar || "",
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error("[API Error] GET /brokers:", error);
    res.status(500).json({ error: "Failed to fetch brokers", details: error.message });
  }
});

apiRouter.post("/brokers", async (req: Request, res: Response) => {
  try {
    const parsed = createBrokerSchema.parse(req.body);

    const broker = await prisma.broker.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone || null,
        role: parsed.role,
        avatar: parsed.avatar || null,
        status: "Active",
      },
    });

    res.status(201).json(broker);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", issues: error.issues });
    }
    console.error("[API Error] POST /brokers:", error);
    res.status(500).json({ error: "Failed to invite broker", details: error.message });
  }
});

// ==========================================
// 7. DEALS ENDPOINTS
// ==========================================
apiRouter.get("/deals", async (req: Request, res: Response) => {
  try {
    const deals = await prisma.deal.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        lead: true,
        broker: true,
      },
    });

    const propIds = deals.map((d) => d.propertyId).filter((id): id is string => Boolean(id));
    const properties =
      propIds.length > 0
        ? await prisma.property.findMany({ where: { id: { in: propIds } } })
        : [];
    const propMap = new Map(properties.map((p) => [p.id, p]));

    const formatted = deals.map((d) => {
      const prop = d.propertyId ? propMap.get(d.propertyId) : null;
      const fmtPrice = (num: number) =>
        num >= 10000000
          ? `₹${(num / 10000000).toFixed(2)} Cr`
          : `₹${(num / 100000).toFixed(1)} L`;

      // Map stage to human label
      const stageMap: Record<DealStage, "Offer Placed" | "In Negotiation" | "Token Received" | "Closed Deal"> = {
        NEGOTIATION: "In Negotiation",
        TOKEN_PAID: "Token Received",
        AGREEMENT_SIGNED: "Offer Placed",
        REGISTRATION_DONE: "Closed Deal",
        CLOSED: "Closed Deal",
      };

      const commAmount = d.brokerageAmount || Math.round((d.agreedPrice || d.buyerBid) * 0.02);

      return {
        id: d.id,
        leadName: d.lead.name,
        propertyTitle: prop?.title || d.title,
        buyerBid: fmtPrice(d.buyerBid),
        builderCounter: fmtPrice(d.builderAsk),
        agreedPrice: d.agreedPrice ? fmtPrice(d.agreedPrice) : "Pending Agreement",
        commission: fmtPrice(commAmount),
        stage: stageMap[d.stage] || "In Negotiation",
        rawStage: d.stage,
      };
    });

    res.json(formatted);
  } catch (error: any) {
    console.error("[API Error] GET /deals:", error);
    res.status(500).json({ error: "Failed to fetch deals", details: error.message });
  }
});

// ==========================================
// 8. SCRAPER STATUS ENDPOINT
// ==========================================
apiRouter.get("/scraper/status", async (req: Request, res: Response) => {
  try {
    const totalCount = await prisma.property.count();
    const latestProp = await prisma.property.findFirst({
      orderBy: { scrapedAt: "desc" },
      select: { scrapedAt: true },
    });

    const portalGroups = await prisma.property.groupBy({
      by: ["sourcePortal"],
      _count: { id: true },
    });

    const countsPerPortal: Record<string, number> = {};
    portalGroups.forEach((g) => {
      countsPerPortal[g.sourcePortal || "UNKNOWN"] = g._count.id;
    });

    res.json({
      status: "operational",
      totalProperties: totalCount,
      lastScrapedAt: latestProp?.scrapedAt ? latestProp.scrapedAt.toISOString() : null,
      portalCounts: countsPerPortal,
    });
  } catch (error: any) {
    console.error("[API Error] GET /scraper/status:", error);
    res.status(500).json({ error: "Failed to get scraper status", details: error.message });
  }
});
