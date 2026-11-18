import crypto from "crypto";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "propflow-production-secret-key-2026-safe-hmac";

export interface AuthPayload {
  userId: string;
  agencyId: string;
  email: string;
  role: string;
  name: string;
  exp: number;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export function createToken(payload: Omit<AuthPayload, "exp">, expiresInSeconds = 7 * 24 * 3600): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload: AuthPayload = { ...payload, exp };
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
    
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload: AuthPayload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Ensures default agency and admin account exists for first-time launch
 */
export async function ensureDefaultAgencyAndAdmin() {
  try {
    let agency = await prisma.agency.findFirst();
    if (!agency) {
      agency = await prisma.agency.create({
        data: {
          name: "PropFlow Elite Realty",
          subdomain: "propflow",
        },
      });
      console.log(`🏢 Created default agency: ${agency.name} (${agency.id})`);
    }

    const adminEmail = "aarav@propflow.com";
    let admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          agencyId: agency.id,
          name: "Aarav Sharma",
          email: adminEmail,
          passwordHash: hashPassword("Password@123"),
          role: "Agency Admin",
          avatar: "AS",
        },
      });
      console.log(`👤 Created default admin user: ${admin.email} (Password: Password@123)`);
    }

    // Also link any unassigned brokers, properties, leads, visits to this agency
    await prisma.broker.updateMany({
      where: { agencyId: null },
      data: { agencyId: agency.id },
    });
    await prisma.lead.updateMany({
      where: { agencyId: null },
      data: { agencyId: agency.id },
    });
    await prisma.property.updateMany({
      where: { agencyId: null },
      data: { agencyId: agency.id },
    });
    await prisma.deal.updateMany({
      where: { agencyId: null },
      data: { agencyId: agency.id },
    });
    await prisma.siteVisit.updateMany({
      where: { agencyId: null },
      data: { agencyId: agency.id },
    });

    return { agency, admin };
  } catch (err: any) {
    console.warn(`[Auth Seed Warning] Could not initialize default agency/user: ${err.message}`);
    return null;
  }
}

