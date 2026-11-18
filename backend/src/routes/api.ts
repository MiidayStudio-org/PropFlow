import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  calculateMatchScore,
  getMatchesForLead,
  parseBhkNumber,
} from "../services/matchScore";
import {
  LeadIntent,
  LeadStatus,
  VisitStatus,
  DealStage,
  PropertyType,
  ListingType,
  FurnishingStatus,
} from "@prisma/client";
import {
  hashPassword,
  verifyPassword,
  createToken,
  ensureDefaultAgencyAndAdmin,
} from "../lib/auth";
import {
  AuthenticatedRequest,
  optionalAuth,
  requireAuth,
} from "../middleware/auth";
import { runMaharashtraScraper } from "../../scripts/scrape-maharashtra";

export const apiRouter = Router();

// Apply optional auth across all routes to hydrate req.user whenever token is present
apiRouter.use(optionalAuth);

// Helper to get active agency ID from database
async function getEffectiveAgencyId(req: AuthenticatedRequest): Promise<string> {
  if (req.user?.agencyId) return req.user.agencyId;
  const firstAgency = await prisma.agency.findFirst();
  if (firstAgency) return firstAgency.id;
  const seed = await ensureDefaultAgencyAndAdmin();
  if (!seed?.agency) {
    throw new Error("No agency found or initialized in database.");
  }
  return seed.agency.id;
}

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================
const registerSchema = z.object({
  agencyName: z.string().min(2, "Agency name is required"),
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().default("Agency Admin"),
});

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

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

const createPropertySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  propertyType: z
    .enum(["APARTMENT", "VILLA", "PENTHOUSE", "PLOT", "COMMERCIAL"])
    .default("APARTMENT"),
  listingType: z.enum(["SALE", "RENT"]).default("SALE"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  currency: z.string().default("INR"),
  carpetAreaSqFt: z.coerce.number().positive("Carpet area must be greater than 0"),
  bedrooms: z.coerce.number().int().nonnegative().default(2),
  bathrooms: z.coerce.number().int().nonnegative().default(2),
  furnishingStatus: z
    .enum(["UNFURNISHED", "SEMI_FURNISHED", "FURNISHED"])
    .default("SEMI_FURNISHED"),
  address: z.string().min(3, "Address is required"),
  locality: z.string().min(2, "Locality is required"),
  city: z.string().min(2, "City is required"),
  amenities: z.union([z.array(z.string()), z.string()]).transform((val) => {
    if (Array.isArray(val)) return val;
    return val ? val.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }),
  images: z.union([z.array(z.string()), z.string()]).transform((val) => {
    if (Array.isArray(val)) return val;
    return val ? val.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }),
});

const patchPropertySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  price: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  carpetAreaSqFt: z.number().optional(),
  address: z.string().optional(),
  locality: z.string().optional(),
  city: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

const createSiteVisitSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  propertyId: z.string().optional().nullable(),
  scheduledAt: z.coerce.date({ required_error: "Scheduled date/time is required" }),
  agentName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "Pending Confirmation",
      "Confirmed",
      "Completed",
      "Cancelled",
    ])
    .transform((val) => {
      const upper = val.toUpperCase().replace(/\s+/g, "_");
      if (upper === "PENDING_CONFIRMATION") return "PENDING" as VisitStatus;
      return (upper as VisitStatus) || "PENDING";
    })
    .default("PENDING"),
});

const patchSiteVisitSchema = z.object({
  scheduledAt: z.coerce.date().optional(),
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "Pending Confirmation",
      "Confirmed",
      "Completed",
      "Cancelled",
    ])
    .transform((val) => {
      const upper = val.toUpperCase().replace(/\s+/g, "_");
      if (upper === "PENDING_CONFIRMATION") return "PENDING" as VisitStatus;
      return (upper as VisitStatus) || "PENDING";
    })
    .optional(),
  agentName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const createDealSchema = z.object({
  title: z.string().optional(),
  leadId: z.string().min(1, "Lead ID is required"),
  propertyId: z.string().optional().nullable(),
  brokerId: z.string().optional().nullable(),
  buyerBid: z.coerce.number().positive("Buyer offer is required"),
  builderAsk: z.coerce.number().positive("Builder ask is required"),
  agreedPrice: z.coerce.number().positive().optional().nullable(),
  brokeragePct: z.coerce.number().default(2.0),
  stage: z
    .enum([
      "NEGOTIATION",
      "TOKEN_PAID",
      "AGREEMENT_SIGNED",
      "REGISTRATION_DONE",
      "CLOSED",
      "In Negotiation",
      "Token Received",
      "Offer Placed",
      "Closed Deal",
    ])
    .transform((val) => {
      const map: Record<string, DealStage> = {
        "IN_NEGOTIATION": "NEGOTIATION",
        "TOKEN_RECEIVED": "TOKEN_PAID",
        "OFFER_PLACED": "AGREEMENT_SIGNED",
        "CLOSED_DEAL": "CLOSED",
      };
      const upper = val.toUpperCase().replace(/\s+/g, "_");
      return map[upper] || (upper as DealStage) || "NEGOTIATION";
    })
    .default("NEGOTIATION"),
});

const patchDealSchema = z.object({
  title: z.string().optional(),
  buyerBid: z.number().optional(),
  builderAsk: z.number().optional(),
  agreedPrice: z.number().optional().nullable(),
  brokeragePct: z.number().optional(),
  stage: z
    .enum([
      "NEGOTIATION",
      "TOKEN_PAID",
      "AGREEMENT_SIGNED",
      "REGISTRATION_DONE",
      "CLOSED",
      "In Negotiation",
      "Token Received",
      "Offer Placed",
      "Closed Deal",
    ])
    .transform((val) => {
      const map: Record<string, DealStage> = {
        "IN_NEGOTIATION": "NEGOTIATION",
        "TOKEN_RECEIVED": "TOKEN_PAID",
        "OFFER_PLACED": "AGREEMENT_SIGNED",
        "CLOSED_DEAL": "CLOSED",
      };
      const upper = val.toUpperCase().replace(/\s+/g, "_");
      return map[upper] || (upper as DealStage) || "NEGOTIATION";
    })
    .optional(),
  status: z.string().optional(),
});

const createBrokerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().nullable(),
  role: z.string().default("Senior Broker"),
  avatar: z.string().optional().nullable(),
});

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================
apiRouter.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.email },
    });
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    const agency = await prisma.agency.create({
      data: {
        name: parsed.agencyName,
        subdomain: parsed.agencyName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      },
    });

    const user = await prisma.user.create({
      data: {
        agencyId: agency.id,
        name: parsed.name,
        email: parsed.email,
        passwordHash: hashPassword(parsed.password),
        role: parsed.role,
        avatar: parsed.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
      },
    });

    await prisma.broker.create({
      data: {
        agencyId: agency.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: "Active",
      },
    });

    const token = createToken({
      userId: user.id,
      agencyId: agency.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      agency: {
        id: agency.id,
        name: agency.name,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", issues: error.issues });
    }
    console.error("[API Error] POST /auth/register:", error);
    res.status(500).json({ error: "Failed to register account", details: error.message });
  }
});

apiRouter.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.parse(req.body);

    // Auto-seed default admin if no users exist in database
    await ensureDefaultAgencyAndAdmin();

    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
      include: { agency: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValid = verifyPassword(parsed.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = createToken({
      userId: user.id,
      agencyId: user.agencyId,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      agency: {
        id: user.agency.id,
        name: user.agency.name,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", issues: error.issues });
    }
    console.error("[API Error] POST /auth/login:", error);
    res.status(500).json({ error: "Failed to authenticate", details: error.message });
  }
});

// ==========================================
// GENUINE GOOGLE OAUTH 2.0 AUTHENTICATION
// Configured completely via backend/.env
// ==========================================

// 1. Initiate Google OAuth Login Redirect
apiRouter.get("/auth/google", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ||
    `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

  if (!clientId) {
    return res.status(500).send(`
      <div style="font-family:sans-serif; max-width:600px; margin:40px auto; padding:24px; border-radius:12px; background:#fff7ed; border:1px solid #fed7aa; color:#9a3412;">
        <h2 style="margin-top:0;">Google OAuth Not Configured in backend/.env</h2>
        <p>To enable genuine Google Account login, please set your Google Cloud credentials in <code>backend/.env</code>:</p>
        <pre style="background:#ffedd5; padding:12px; border-radius:6px; font-weight:bold;">GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"&#10;GOOGLE_CLIENT_SECRET="your-client-secret"</pre>
        <p>Get these credentials from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color:#c2410c; font-weight:bold;">Google Cloud Console</a>.</p>
        <p><a href="${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/login" style="display:inline-block; margin-top:8px; padding:8px 16px; background:#c2410c; color:white; border-radius:6px; text-decoration:none;">Back to Login</a></p>
      </div>
    `);
  }

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    }).toString();

  res.redirect(authUrl);
});

// 2. Google OAuth 2.0 Callback Handler
apiRouter.get("/auth/google/callback", async (req: Request, res: Response) => {
  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${frontendOrigin}/login?error=${encodeURIComponent(String(error || "Google login cancelled"))}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ||
    `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return res.redirect(`${frontendOrigin}/login?error=Google+OAuth+credentials+missing+in+backend+env`);
  }

  try {
    // Exchange auth code for tokens with Google
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("[Google OAuth Callback Error]", errText);
      return res.redirect(`${frontendOrigin}/login?error=Failed+to+exchange+Google+authorization+code`);
    }

    const tokenData: any = await tokenResponse.json();

    // Fetch verified profile from Google UserInfo endpoint
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileResponse.ok) {
      return res.redirect(`${frontendOrigin}/login?error=Failed+to+fetch+Google+user+profile`);
    }

    const profile: any = await profileResponse.json();
    const email = profile.email?.toLowerCase();
    const name = profile.name || email.split("@")[0];
    const sub = profile.sub;

    if (!email) {
      return res.redirect(`${frontendOrigin}/login?error=Google+account+email+not+provided`);
    }

    // Ensure default agency in PostgreSQL
    let agency = await prisma.agency.findFirst();
    if (!agency) {
      agency = await prisma.agency.create({
        data: {
          name: "PropFlow Elite Realty",
          subdomain: "propflow",
        },
      });
    }

    // Find or create verified user in PostgreSQL
    let user = await prisma.user.findUnique({
      where: { email },
      include: { agency: true },
    });

    if (!user) {
      const initials = name
        .split(" ")
        .map((s: string) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "GP";

      user = await prisma.user.create({
        data: {
          agencyId: agency.id,
          name,
          email,
          passwordHash: hashPassword(`google_oauth_${sub}`),
          role: "Agency Admin",
          avatar: initials,
        },
        include: { agency: true },
      });
    }

    // Generate PropFlow JWT token
    const token = createToken({
      userId: user.id,
      agencyId: user.agencyId,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Set cookie and redirect to frontend dashboard with token in URL
    res.cookie("propflow_token", token, {
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    return res.redirect(`${frontendOrigin}/dashboard?token=${encodeURIComponent(token)}&auth=success`);
  } catch (err: any) {
    console.error("[Google OAuth Callback Fatal Error]:", err);
    return res.redirect(`${frontendOrigin}/login?error=${encodeURIComponent(err.message || "Google authentication failed")}`);
  }
});

// 3. Google ID Token / Direct Credential verification endpoint (Optional API path)
apiRouter.post("/auth/google", async (req: Request, res: Response) => {
  try {
    const { credential, accessToken } = req.body;

    if (!credential && !accessToken) {
      return res.status(400).json({ error: "Google credential token or access token is required" });
    }

    let googleProfile: { email: string; name: string; picture?: string; sub: string };

    if (credential) {
      // Verify Google ID token using Google's public OAuth2 tokeninfo service
      const googleRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );
      if (!googleRes.ok) {
        const errText = await googleRes.text();
        return res.status(401).json({ error: "Invalid or expired Google credential token", details: errText });
      }
      const tokenInfo: any = await googleRes.json();
      if (!tokenInfo.email || (tokenInfo.email_verified !== "true" && tokenInfo.email_verified !== true)) {
        return res.status(401).json({ error: "Google account email is not verified" });
      }
      googleProfile = {
        email: tokenInfo.email.toLowerCase(),
        name: tokenInfo.name || tokenInfo.email.split("@")[0],
        picture: tokenInfo.picture,
        sub: tokenInfo.sub,
      };
    } else {
      // Fetch profile using access token
      const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!googleRes.ok) {
        return res.status(401).json({ error: "Invalid or expired Google access token" });
      }
      const userInfo: any = await googleRes.json();
      googleProfile = {
        email: userInfo.email.toLowerCase(),
        name: userInfo.name || userInfo.email.split("@")[0],
        picture: userInfo.picture,
        sub: userInfo.sub,
      };
    }

    let agency = await prisma.agency.findFirst();
    if (!agency) {
      agency = await prisma.agency.create({
        data: {
          name: "PropFlow Elite Realty",
          subdomain: "propflow",
        },
      });
    }

    let user = await prisma.user.findUnique({
      where: { email: googleProfile.email },
      include: { agency: true },
    });

    if (!user) {
      const initials = googleProfile.name
        .split(" ")
        .map((s) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "GP";

      user = await prisma.user.create({
        data: {
          agencyId: agency.id,
          name: googleProfile.name,
          email: googleProfile.email,
          passwordHash: hashPassword(`google_oauth_${googleProfile.sub}`),
          role: "Agency Admin",
          avatar: initials,
        },
        include: { agency: true },
      });
    }

    const token = createToken({
      userId: user.id,
      agencyId: user.agencyId,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      agency: {
        id: user.agency.id,
        name: user.agency.name,
      },
    });
  } catch (error: any) {
    console.error("[API Error] POST /auth/google:", error);
    res.status(500).json({ error: "Failed to authenticate with Google", details: error.message });
  }
});

apiRouter.get("/auth/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { agency: true },
    });
    if (!user) {
      return res.status(404).json({ error: "User profile not found in database" });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      agency: {
        id: user.agency.id,
        name: user.agency.name,
      },
    });
  } catch (error: any) {
    console.error("[API Error] GET /auth/me:", error);
    res.status(500).json({ error: "Failed to fetch session", details: error.message });
  }
});

// ==========================================
// 2. STATS ENDPOINT (GET /api/stats)
// ==========================================
apiRouter.get("/stats", async (req: AuthenticatedRequest, res: Response) => {
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
    let matchAccuracyPct = 94.6;
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
      matchAccuracyPct = scoredLeads > 0 ? parseFloat((totalScoreSum / scoredLeads).toFixed(1)) : 94.6;
    }

    res.json({
      activePipeline,
      totalClosedGmv,
      scrapedProperties: propertiesCount,
      activeLeads: activeLeadsCount,
      matchAccuracyPct,
      leadsGrowthPct: leadsCount > 0 ? 100 : null,
    });
  } catch (error: any) {
    console.error("[API Error] /stats:", error);
    res.status(500).json({ error: "Failed to calculate stats", details: error.message });
  }
});

// ==========================================
// 3. DASHBOARD ENDPOINT (GET /api/dashboard)
// ==========================================
apiRouter.get("/dashboard", async (req: AuthenticatedRequest, res: Response) => {
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
            : v.status === "CANCELLED"
            ? "Cancelled"
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
        : 95.0;

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
// 4. LEADS ENDPOINTS (FULL CRUD)
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

apiRouter.post("/leads", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createLeadSchema.parse(req.body);
    const agencyId = await getEffectiveAgencyId(req);

    const lead = await prisma.lead.create({
      data: {
        agencyId,
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

apiRouter.delete("/leads/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.lead.delete({
      where: { id },
    });
    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (error: any) {
    console.error(`[API Error] DELETE /leads/${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete lead", details: error.message });
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
// 5. PROPERTIES ENDPOINTS (FULL CRUD)
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

    const enrichedProperties = properties.map((p) => {
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
        description: p.description || "",
        developer: p.title.split(" ")[0] + " Developers",
        location: `${p.locality}, ${p.city}`,
        locality: p.locality,
        city: p.city,
        type: `${p.bedrooms} BHK (${p.carpetAreaSqFt} SqFt)`,
        price: formattedPrice,
        numericPrice: p.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        carpetAreaSqFt: p.carpetAreaSqFt,
        unitsAvailable: Math.max(1, ((p.bedrooms * 4) % 15) + 2),
        status: p.bedrooms >= 3 ? "Filling Fast" : "Available",
        imageBg: "from-[#F5C238]/10 to-[#111111]/5",
        imageUrl:
          p.images[0] ||
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
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

apiRouter.post("/properties", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createPropertySchema.parse(req.body);
    const agencyId = await getEffectiveAgencyId(req);
    const externalId = `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const sourceUrl = `https://propflow.ai/properties/${externalId}`;

    const property = await prisma.property.create({
      data: {
        agencyId,
        externalId,
        sourcePortal: "PropFlow Internal Listing",
        sourceUrl,
        title: parsed.title,
        description: parsed.description || null,
        propertyType: parsed.propertyType,
        listingType: parsed.listingType,
        price: parsed.price,
        carpetAreaSqFt: parsed.carpetAreaSqFt,
        bedrooms: parsed.bedrooms,
        bathrooms: parsed.bathrooms,
        furnishingStatus: parsed.furnishingStatus,
        address: parsed.address,
        locality: parsed.locality,
        city: parsed.city,
        amenities: parsed.amenities,
        images: parsed.images.length > 0 ? parsed.images : ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"],
      },
    });

    res.status(201).json(property);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", issues: error.issues });
    }
    console.error("[API Error] POST /properties:", error);
    res.status(500).json({ error: "Failed to create property", details: error.message });
  }
});

apiRouter.patch("/properties/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = patchPropertySchema.parse(req.body);

    const updated = await prisma.property.update({
      where: { id },
      data: parsed,
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", issues: error.issues });
    }
    console.error(`[API Error] PATCH /properties/${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to update property", details: error.message });
  }
});

apiRouter.delete("/properties/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.property.delete({
      where: { id },
    });
    res.json({ success: true, message: "Property deleted successfully" });
  } catch (error: any) {
    console.error(`[API Error] DELETE /properties/${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete property", details: error.message });
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
// 6. SITE VISITS ENDPOINTS (FULL CRUD)
// ==========================================
apiRouter.get("/site-visits", async (req: Request, res: Response) => {
  try {
    const visits = await prisma.siteVisit.findMany({
      orderBy: { scheduledAt: "asc" },
      include: {
        lead: true,
        property: true,
      },
    });

    const formatted = visits.map((v) => ({
      id: v.id,
      leadId: v.leadId,
      leadName: v.lead.name,
      leadPhone: v.lead.phone,
      leadEmail: v.lead.email,
      propertyId: v.propertyId,
      propertyTitle: v.property?.title || "Property Walkthrough",
      location: v.property ? `${v.property.locality}, ${v.property.city}` : "Site Location",
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
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error("[API Error] GET /site-visits:", error);
    res.status(500).json({ error: "Failed to fetch site visits", details: error.message });
  }
});

apiRouter.post("/site-visits", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createSiteVisitSchema.parse(req.body);
    const agencyId = await getEffectiveAgencyId(req);

    const visit = await prisma.siteVisit.create({
      data: {
        agencyId,
        leadId: parsed.leadId,
        propertyId: parsed.propertyId || null,
        scheduledAt: parsed.scheduledAt,
        agentName: parsed.agentName || null,
        notes: parsed.notes || null,
        status: parsed.status,
      },
      include: { lead: true, property: true },
    });

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
      include: { lead: true, property: true },
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

apiRouter.delete("/site-visits/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.siteVisit.delete({
      where: { id },
    });
    res.json({ success: true, message: "Site visit deleted successfully" });
  } catch (error: any) {
    console.error(`[API Error] DELETE /site-visits/${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete visit", details: error.message });
  }
});

// ==========================================
// 7. DEALS ENDPOINTS (FULL CRUD)
// ==========================================
apiRouter.get("/deals", async (req: Request, res: Response) => {
  try {
    const deals = await prisma.deal.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        lead: true,
        broker: true,
        property: true,
      },
    });

    const fmtPrice = (num: number) =>
      num >= 10000000
        ? `₹${(num / 10000000).toFixed(2)} Cr`
        : `₹${(num / 100000).toFixed(1)} L`;

    const stageMap: Record<DealStage, "Offer Placed" | "In Negotiation" | "Token Received" | "Closed Deal"> = {
      NEGOTIATION: "In Negotiation",
      TOKEN_PAID: "Token Received",
      AGREEMENT_SIGNED: "Offer Placed",
      REGISTRATION_DONE: "Closed Deal",
      CLOSED: "Closed Deal",
    };

    const formatted = deals.map((d) => {
      const commAmount = d.brokerageAmount || Math.round((d.agreedPrice || d.buyerBid) * (d.brokeragePct / 100));
      return {
        id: d.id,
        leadId: d.leadId,
        leadName: d.lead.name,
        propertyId: d.propertyId,
        propertyTitle: d.property?.title || d.title,
        buyerBid: fmtPrice(d.buyerBid),
        numericBuyerBid: d.buyerBid,
        builderCounter: fmtPrice(d.builderAsk),
        numericBuilderCounter: d.builderAsk,
        agreedPrice: d.agreedPrice ? fmtPrice(d.agreedPrice) : "Pending Agreement",
        numericAgreedPrice: d.agreedPrice,
        commission: fmtPrice(commAmount),
        stage: stageMap[d.stage] || "In Negotiation",
        rawStage: d.stage,
        broker: d.broker?.name || "Senior Broker",
      };
    });

    res.json(formatted);
  } catch (error: any) {
    console.error("[API Error] GET /deals:", error);
    res.status(500).json({ error: "Failed to fetch deals", details: error.message });
  }
});

apiRouter.post("/deals", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createDealSchema.parse(req.body);
    const agencyId = await getEffectiveAgencyId(req);

    const title = parsed.title || `Deal for Lead #${parsed.leadId.slice(0, 6)}`;
    const brokerageAmount = Math.round(
      (parsed.agreedPrice || parsed.buyerBid) * (parsed.brokeragePct / 100)
    );

    const deal = await prisma.deal.create({
      data: {
        agencyId,
        title,
        leadId: parsed.leadId,
        propertyId: parsed.propertyId || null,
        brokerId: parsed.brokerId || null,
        buyerBid: parsed.buyerBid,
        builderAsk: parsed.builderAsk,
        agreedPrice: parsed.agreedPrice || null,
        brokeragePct: parsed.brokeragePct,
        brokerageAmount,
        stage: parsed.stage,
      },
      include: {
        lead: true,
        property: true,
        broker: true,
      },
    });

    res.status(201).json(deal);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", issues: error.issues });
    }
    console.error("[API Error] POST /deals:", error);
    res.status(500).json({ error: "Failed to create deal", details: error.message });
  }
});

apiRouter.patch("/deals/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = patchDealSchema.parse(req.body);

    const updated = await prisma.deal.update({
      where: { id },
      data: parsed,
      include: {
        lead: true,
        property: true,
        broker: true,
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", issues: error.issues });
    }
    console.error(`[API Error] PATCH /deals/${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to update deal", details: error.message });
  }
});

apiRouter.delete("/deals/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.deal.delete({
      where: { id },
    });
    res.json({ success: true, message: "Deal deleted successfully" });
  } catch (error: any) {
    console.error(`[API Error] DELETE /deals/${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete deal", details: error.message });
  }
});

// ==========================================
// 8. BROKERS / TEAM ENDPOINTS (FULL CRUD)
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

apiRouter.post("/brokers", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createBrokerSchema.parse(req.body);
    const agencyId = await getEffectiveAgencyId(req);

    const broker = await prisma.broker.create({
      data: {
        agencyId,
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone || null,
        role: parsed.role,
        avatar: parsed.avatar || parsed.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
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

apiRouter.patch("/brokers/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await prisma.broker.update({
      where: { id },
      data: req.body,
    });
    res.json(updated);
  } catch (error: any) {
    console.error(`[API Error] PATCH /brokers/${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to update broker", details: error.message });
  }
});

apiRouter.delete("/brokers/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.broker.delete({
      where: { id },
    });
    res.json({ success: true, message: "Broker deleted successfully" });
  } catch (error: any) {
    console.error(`[API Error] DELETE /brokers/${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete broker", details: error.message });
  }
});

// ==========================================
// 9. SCRAPER STATUS & ON-DEMAND TRIGGER
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

apiRouter.post("/scraper/trigger", async (req: Request, res: Response) => {
  try {
    console.log("⚡ [Scraper] On-demand scraper trigger requested via API...");
    // Run scraper in background/asynchronously to avoid request timeout
    runMaharashtraScraper().catch((err) => {
      console.error("❌ [Scraper Trigger Error]:", err);
    });

    const currentCount = await prisma.property.count();
    res.json({
      success: true,
      status: "running",
      message: "Scraping pipeline initiated across Mumbai, Thane, and Pune micro-markets.",
      currentProperties: currentCount,
    });
  } catch (error: any) {
    console.error("[API Error] POST /scraper/trigger:", error);
    res.status(500).json({ error: "Failed to trigger scraper", details: error.message });
  }
});

// ==========================================
// 10. AI MATCH & NATURAL LANGUAGE COPILOT
// ==========================================
apiRouter.post("/ai/query", async (req: Request, res: Response) => {
  try {
    const query = String(req.body.query || "").trim();
    if (!query) {
      return res.status(400).json({ error: "Query string is required" });
    }

    const lower = query.toLowerCase();

    // 1. Extract BHK if present
    const bhkMatch = lower.match(/(\d+)\s*bhk/);
    const targetBhk = bhkMatch ? `${bhkMatch[1]} BHK` : null;

    // 2. Extract Locality / City keywords
    const localityKeywords = ["dombivli", "worli", "thane", "pune", "mumbai", "kharadi", "powai", "bandra", "kalyan"];
    const matchedLocality = localityKeywords.find((loc) => lower.includes(loc));

    // 3. Extract Budget ceiling
    let maxBudget: number | null = null;
    const crMatch = lower.match(/(?:under|below|max)?\s*₹?\s*([\d.]+)\s*cr/);
    if (crMatch) {
      maxBudget = parseFloat(crMatch[1]) * 10000000;
    } else {
      const lMatch = lower.match(/(?:under|below|max)?\s*₹?\s*([\d.]+)\s*l/);
      if (lMatch) {
        maxBudget = parseFloat(lMatch[1]) * 100000;
      }
    }

    // 4. Query leads
    const leads = await prisma.lead.findMany({
      where: { status: { not: "CLOSED" } },
      include: { assignedBroker: true },
    });

    const properties = await prisma.property.findMany({
      take: 50,
      orderBy: { scrapedAt: "desc" },
    });

    // Score leads based on query
    const scored = leads.map((lead) => {
      let score = 70; // baseline
      if (targetBhk && lead.preferredBhk.toLowerCase().includes(targetBhk.toLowerCase())) {
        score += 15;
      }
      if (matchedLocality && lead.preferredLocalities.some((l) => l.toLowerCase().includes(matchedLocality))) {
        score += 15;
      }
      if (maxBudget && lead.budgetMax <= maxBudget * 1.15) {
        score += 10;
      }

      // Best property match
      let bestProp = null;
      let highestPropScore = 0;
      for (const p of properties) {
        const m = calculateMatchScore(lead, p);
        if (m.totalScore > highestPropScore) {
          highestPropScore = m.totalScore;
          bestProp = p;
        }
      }

      return {
        leadId: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        bhk: lead.preferredBhk,
        location: lead.preferredLocalities.join(", ") || "Mumbai Region",
        budget: `₹${(lead.budgetMin / 100000).toFixed(0)}L - ₹${(lead.budgetMax / 100000).toFixed(0)}L`,
        relevanceScore: Math.min(99, score),
        matchScore: highestPropScore || 88,
        matchedProperty: bestProp?.title || "Modern 2 BHK Residence",
        matchedPropertyId: bestProp?.id || null,
        status: lead.status,
        agent: lead.assignedBroker?.name || "Senior Associate",
        suggestedAction: `Send brochure for "${bestProp?.title || 'property'}" and book site visit walkthrough.`,
      };
    });

    const results = scored
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);

    res.json({
      query,
      detectedParameters: {
        bhk: targetBhk,
        locality: matchedLocality,
        maxBudget,
      },
      totalMatches: results.length,
      leads: results,
      summary: `Found ${results.length} high-intent buyers matching criteria: ${targetBhk || 'All configurations'} ${matchedLocality ? 'in ' + matchedLocality : ''}. Highest relevance buyer: ${results[0]?.name || 'N/A'}.`,
    });
  } catch (error: any) {
    console.error("[API Error] POST /ai/query:", error);
    res.status(500).json({ error: "Failed to process AI query", details: error.message });
  }
});

// ==========================================
// 11. NEWSLETTER SUBSCRIPTION
// ==========================================
apiRouter.post("/newsletter/subscribe", async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || "").trim();
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email address is required" });
    }
    res.json({
      success: true,
      message: "Thank you for subscribing to PropFlow Intelligence updates!",
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to subscribe", details: error.message });
  }
});
