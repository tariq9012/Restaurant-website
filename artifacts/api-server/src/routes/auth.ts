import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "@workspace/db";
import { asyncHandler, HttpError, ok, requireFields } from "../utils/http";
import { requireAuth, signToken } from "../middleware/auth";

const router = Router();

router.post("/auth/register", asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "email", "password"]);
  const name = String(req.body.name).trim();
  const email = String(req.body.email).trim().toLowerCase();
  const password = String(req.body.password);
  if (name.length < 2 || password.length < 8 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "Use a valid name, email, and password of at least 8 characters", "INVALID_INPUT");
  }
  const hash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1,$2,$3,$4,'customer')
       RETURNING id, name, email, phone, role, created_at AS "createdAt"`,
      [name, email, hash, req.body.phone ? String(req.body.phone).trim() : null],
    );
    const user = rows[0];
    return ok(res, { user, token: signToken(user) }, "Account created", 201);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      throw new HttpError(409, "An account with that email already exists", "EMAIL_EXISTS");
    }
    throw error;
  }
}));

router.post("/auth/login", asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password"]);
  const { rows } = await pool.query("SELECT id, name, email, phone, role, password_hash FROM users WHERE email = $1 LIMIT 1", [String(req.body.email).trim().toLowerCase()]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(String(req.body.password), user.password_hash))) {
    throw new HttpError(401, "Email or password is incorrect", "INVALID_CREDENTIALS");
  }
  delete user.password_hash;
  return ok(res, { user, token: signToken(user) }, "Welcome back");
}));

router.get("/auth/me", requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query("SELECT id, name, email, phone, role, created_at AS \"createdAt\", updated_at AS \"updatedAt\" FROM users WHERE id = $1", [req.user!.id]);
  if (!rows[0]) throw new HttpError(404, "User not found", "NOT_FOUND");
  return ok(res, rows[0]);
}));

export default router;