import { Router } from "express";
import { pool } from "@workspace/db";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError, ok, parseId, requireFields } from "../utils/http";

const router = Router();

router.get("/reviews", asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(`SELECT r.id, r.user_id AS "userId", r.menu_item_id AS "menuItemId", m.name AS "menuItemName", r.customer_name AS "customerName", r.rating, r.comment, r.is_approved AS "isApproved", r.created_at AS "createdAt" FROM reviews r LEFT JOIN menu_items m ON m.id=r.menu_item_id WHERE r.is_approved=true ORDER BY r.created_at DESC`);
  return ok(res, rows);
}));

router.post("/reviews", requireAuth, asyncHandler(async (req, res) => {
  requireFields(req.body, ["customerName", "rating", "comment"]);
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, "Rating must be a whole number from 1 to 5", "INVALID_RATING");
  const { rows } = await pool.query(`INSERT INTO reviews (user_id,menu_item_id,customer_name,rating,comment,is_approved) VALUES ($1,$2,$3,$4,$5,false) RETURNING id, customer_name AS "customerName", rating, comment, is_approved AS "isApproved", created_at AS "createdAt"`, [req.user!.id, req.body.menuItemId || null, String(req.body.customerName).trim(), rating, String(req.body.comment).trim()]);
  return ok(res, rows[0], "Review submitted for approval", 201);
}));

router.get("/reviews/:id", asyncHandler(async (req, res) => {
  const { rows } = await pool.query("SELECT id, user_id AS \"userId\", menu_item_id AS \"menuItemId\", customer_name AS \"customerName\", rating, comment, is_approved AS \"isApproved\", created_at AS \"createdAt\" FROM reviews WHERE id=$1 AND is_approved=true", [parseId(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, "Review not found", "NOT_FOUND");
  return ok(res, rows[0]);
}));

router.put("/reviews/:id", requireAuth, asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, "Rating must be from 1 to 5", "INVALID_RATING");
  const { rows } = await pool.query(`UPDATE reviews SET rating=$1, comment=$2, is_approved=false, updated_at=now() WHERE id=$3 AND user_id=$4 RETURNING id, rating, comment, is_approved AS "isApproved"`, [rating, String(req.body.comment).trim(), parseId(req.params.id), req.user!.id]);
  if (!rows[0]) throw new HttpError(404, "Review not found", "NOT_FOUND");
  return ok(res, rows[0], "Review updated and sent for approval");
}));

router.delete("/reviews/:id", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query("DELETE FROM reviews WHERE id=$1 AND (user_id=$2 OR $3='admin')", [parseId(req.params.id), req.user!.id, req.user!.role]);
  if (!result.rowCount) throw new HttpError(404, "Review not found", "NOT_FOUND");
  return res.status(204).send();
}));

router.get("/admin/reviews", requireAdmin, asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(`SELECT r.id, r.user_id AS "userId", r.menu_item_id AS "menuItemId", m.name AS "menuItemName", r.customer_name AS "customerName", r.rating, r.comment, r.is_approved AS "isApproved", r.created_at AS "createdAt" FROM reviews r LEFT JOIN menu_items m ON m.id=r.menu_item_id ORDER BY r.created_at DESC`);
  return ok(res, rows);
}));

router.patch("/reviews/:id/approve", requireAdmin, asyncHandler(async (req, res) => {
  if (typeof req.body.isApproved !== "boolean") throw new HttpError(400, "isApproved must be true or false", "INVALID_APPROVAL");
  const { rows } = await pool.query(`UPDATE reviews SET is_approved=$1, updated_at=now() WHERE id=$2 RETURNING id, is_approved AS "isApproved"`, [req.body.isApproved, parseId(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, "Review not found", "NOT_FOUND");
  return ok(res, rows[0], req.body.isApproved ? "Review approved" : "Review hidden");
}));

router.post("/contact", asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "email", "subject", "message"]);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(req.body.email))) throw new HttpError(400, "A valid email is required", "INVALID_EMAIL");
  const { rows } = await pool.query(`INSERT INTO contact_messages (name,email,phone,subject,message) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, subject, created_at AS "createdAt"`, [String(req.body.name).trim(), String(req.body.email).trim().toLowerCase(), req.body.phone || null, String(req.body.subject).trim(), String(req.body.message).trim()]);
  return ok(res, rows[0], "Message received", 201);
}));

router.get("/contact", requireAdmin, asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(`SELECT id, name, email, phone, subject, message, status, created_at AS "createdAt" FROM contact_messages ORDER BY created_at DESC`);
  return ok(res, rows);
}));

router.patch("/contact/:id", requireAdmin, asyncHandler(async (req, res) => {
  if (!["unread", "read", "replied"].includes(req.body.status)) throw new HttpError(400, "Invalid message status", "INVALID_STATUS");
  const { rows } = await pool.query(`UPDATE contact_messages SET status=$1 WHERE id=$2 RETURNING id, status`, [req.body.status, parseId(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, "Message not found", "NOT_FOUND");
  return ok(res, rows[0], "Message status updated");
}));

router.get("/restaurant", asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(`SELECT id, restaurant_name AS "restaurantName", description, address, phone, email, opening_hours AS "openingHours", latitude::float, longitude::float, facebook_url AS "facebookUrl", instagram_url AS "instagramUrl", created_at AS "createdAt", updated_at AS "updatedAt" FROM restaurant_info ORDER BY id LIMIT 1`);
  if (!rows[0]) throw new HttpError(404, "Restaurant information not found", "NOT_FOUND");
  return ok(res, rows[0]);
}));

router.put("/restaurant", requireAdmin, asyncHandler(async (req, res) => {
  requireFields(req.body, ["restaurantName", "description", "address", "phone", "email", "openingHours"]);
  const { rows } = await pool.query(`UPDATE restaurant_info SET restaurant_name=$1, description=$2, address=$3, phone=$4, email=$5, opening_hours=$6, latitude=$7, longitude=$8, facebook_url=$9, instagram_url=$10, updated_at=now() WHERE id=(SELECT id FROM restaurant_info ORDER BY id LIMIT 1) RETURNING id, restaurant_name AS "restaurantName", description, address, phone, email, opening_hours AS "openingHours"`, [req.body.restaurantName, req.body.description, req.body.address, req.body.phone, req.body.email, req.body.openingHours, req.body.latitude || null, req.body.longitude || null, req.body.facebookUrl || null, req.body.instagramUrl || null]);
  if (!rows[0]) throw new HttpError(404, "Restaurant information not found", "NOT_FOUND");
  return ok(res, rows[0], "Restaurant information updated");
}));

router.get("/admin/dashboard", requireAdmin, asyncHandler(async (_req, res) => {
  const [users, menuItems, orders, reservations, revenue, recentOrders, recentReservations, recentMessages] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM users"),
    pool.query("SELECT COUNT(*)::int AS count FROM menu_items"),
    pool.query("SELECT COUNT(*)::int AS count FROM orders"),
    pool.query("SELECT COUNT(*)::int AS count FROM reservations"),
    pool.query("SELECT COALESCE(SUM(total_amount),0)::float AS total FROM orders WHERE status <> 'cancelled'"),
    pool.query(`SELECT id, customer_name AS "customerName", total_amount::float AS "totalAmount", status, created_at AS "createdAt" FROM orders ORDER BY created_at DESC LIMIT 5`),
    pool.query(`SELECT id, customer_name AS "customerName", reservation_date AS "reservationDate", reservation_time AS "reservationTime", guests, status FROM reservations ORDER BY created_at DESC LIMIT 5`),
    pool.query(`SELECT id, name, subject, status, created_at AS "createdAt" FROM contact_messages ORDER BY created_at DESC LIMIT 5`),
  ]);
  return ok(res, { stats: { users: users.rows[0].count, menuItems: menuItems.rows[0].count, orders: orders.rows[0].count, reservations: reservations.rows[0].count, revenue: revenue.rows[0].total }, recentOrders: recentOrders.rows, recentReservations: recentReservations.rows, recentMessages: recentMessages.rows });
}));

export default router;