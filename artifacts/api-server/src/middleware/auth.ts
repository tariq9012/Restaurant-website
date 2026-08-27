import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/http";

const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
if (!secret) throw new Error("JWT_SECRET or SESSION_SECRET must be configured");
const jwtSecret: jwt.Secret = secret;

export function signToken(user: { id: number; email: string; role: string; name: string }) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role, name: user.name }, jwtSecret, { expiresIn: "7d" });
}

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  if (token) {
    try {
      const payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
      if (typeof payload.sub === "string" || typeof payload.sub === "number") {
        const id = Number(payload.sub);
        if (!Number.isInteger(id) || id < 1) return next();
        req.user = { id, email: String(payload.email), role: payload.role as "customer" | "admin", name: String(payload.name) };
      }
    } catch {
      // Optional auth intentionally ignores invalid or expired tokens.
    }
  }
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  optionalAuth(req, _res, (error) => {
    if (error) return next(error);
    if (!req.user) return next(new HttpError(401, "Authentication is required", "UNAUTHENTICATED"));
    next();
  });
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  requireAuth(req, _res, (error) => {
    if (error) return next(error);
    if (req.user?.role !== "admin") return next(new HttpError(403, "Admin access is required", "FORBIDDEN"));
    next();
  });
};