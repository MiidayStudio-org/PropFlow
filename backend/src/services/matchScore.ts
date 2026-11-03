import { Property, Lead } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface MatchBreakdown {
  budgetScore: number; // max 40
  bhkScore: number;    // max 30
  localityScore: number; // max 30
  totalScore: number;  // 0 - 100
  intent: "High" | "Medium" | "Low";
  property: Property;
}

export function parseBhkNumber(bhkStr: string | null | undefined): number {
  if (!bhkStr) return 2;
  const match = bhkStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 2;
}

export function calculateMatchScore(lead: Lead, property: Property): MatchBreakdown {
  // 1. Budget Fit (Max 40 points)
  let budgetScore = 0;
  const price = property.price;
  const minBudget = lead.budgetMin;
  const maxBudget = lead.budgetMax;

  if (price >= minBudget && price <= maxBudget) {
    budgetScore = 40;
  } else if (price < minBudget && minBudget > 0) {
    // Under budget is generally favorable, but if too cheap it might not meet expectations
    const underRatio = (minBudget - price) / minBudget;
    budgetScore = Math.max(0, Math.round(40 * (1 - underRatio * 0.8)));
  } else if (price > maxBudget && maxBudget > 0) {
    // Over budget penalizes faster
    const overRatio = (price - maxBudget) / maxBudget;
    budgetScore = Math.max(0, Math.round(40 * (1 - overRatio * 1.5)));
  }

  // 2. BHK Fit (Max 30 points)
  let bhkScore = 0;
  const targetBhk = parseBhkNumber(lead.preferredBhk);
  const actualBedrooms = property.bedrooms;

  if (actualBedrooms === targetBhk) {
    bhkScore = 30;
  } else if (Math.abs(actualBedrooms - targetBhk) === 1) {
    bhkScore = 15;
  } else {
    bhkScore = 0;
  }

  // 3. Locality Fit (Max 30 points)
  let localityScore = 0;
  const propLocality = (property.locality || "").toLowerCase().trim();
  const propCity = (property.city || "").toLowerCase().trim();
  const propAddress = (property.address || "").toLowerCase().trim();

  const localities = (lead.preferredLocalities || []).map((l) => l.toLowerCase().trim());

  if (localities.length === 0) {
    // If no locality specified, neutral middle score
    localityScore = 15;
  } else {
    let matchedLocality = false;
    let matchedCity = false;

    for (const loc of localities) {
      if (!loc) continue;
      if (
        propLocality.includes(loc) ||
        loc.includes(propLocality) ||
        propAddress.includes(loc)
      ) {
        matchedLocality = true;
        break;
      }
      if (propCity.includes(loc) || loc.includes(propCity)) {
        matchedCity = true;
      }
    }

    if (matchedLocality) {
      localityScore = 30;
    } else if (matchedCity) {
      localityScore = 15;
    } else {
      localityScore = 0;
    }
  }

  const totalScore = Math.min(100, Math.max(0, budgetScore + bhkScore + localityScore));
  const intent: "High" | "Medium" | "Low" =
    totalScore >= 80 ? "High" : totalScore >= 50 ? "Medium" : "Low";

  return {
    budgetScore,
    bhkScore,
    localityScore,
    totalScore,
    intent,
    property,
  };
}

export async function getMatchesForLead(
  leadId: string,
  limit = 10
): Promise<MatchBreakdown[]> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return [];

  const properties = await prisma.property.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
  });

  const matches = properties
    .map((property) => calculateMatchScore(lead, property))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);

  return matches;
}

export async function getBestMatchForLead(
  leadId: string
): Promise<MatchBreakdown | null> {
  const matches = await getMatchesForLead(leadId, 1);
  return matches.length > 0 ? matches[0] : null;
}
