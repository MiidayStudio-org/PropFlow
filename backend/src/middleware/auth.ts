import { Request, Response, NextFunction } from "express";
import { verifyToken, AuthPayload } from "../lib/auth";

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  if (req.headers["x-access-token"] && typeof req.headers["x-access-token"] === "string") {
    return req.headers["x-access-token"].trim();
  }
  return null;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Please sign in to access this real estate workspace resource.",
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      error: "Invalid or expired token",
      message: "Session expired. Please sign in again.",
    });
  }

  req.user = payload;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "Agency Admin") {
    return res.status(403).json({
      error: "Forbidden",
      message: "Agency Admin privileges required for this action.",
    });
  }
  next();
}

