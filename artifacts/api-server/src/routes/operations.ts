import { Router } from "express";
import { pool } from "@workspace/db";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError, ok, parseId, requireFields } from "../utils/http";

const router = Router();

function validEmail(value: unknown) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

router.post("/reservations", optionalAuth, asyncHandler(async (req, res) => {
  requireFields(req.body, ["customerName", "email", "phone", "reservationDate", "reservationTime", "guests"]);
  if (!validEmail(req.body.email)) throw new HttpError(400, "A valid email is required", "INVALID_EMAIL");
  const guests = Number(req.body.guests);
  const date = String(req.body.reservationDate);
  if (!Number.isInteger(guests) || guests < 1 || guests > 50 || Number.isNaN(Date.parse(date))) {
    throw new HttpError(400, "Use a valid reservation date and guest count", "INVALID_RESERVATION");
  }
  const { rows } = await pool.query(
    `INSERT INTO reservations (user_id,customer_name,email,phone,reservation_date,reservation_time,guests,special_request)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, customer_name AS "customerName", email, phone, reservation_date AS "reservationDate", reservation_time AS "reservationTime", guests, special_request AS "specialRequest", status, created_at AS "createdAt"`,
    [req.user?.id || null, String(req.body.customerName).trim(), String(req.body.email).trim().toLowerCase(), String(req.body.phone).trim(), date, String(req.body.reservationTime), guests, req.body.specialRequest || null],
  );
  return ok(res, rows[0], "Reservation request received", 201);
}));

router.get("/reservations", optionalAuth, asyncHandler(async (req, res) => {
  const admin = req.user?.role === "admin";
  const values: unknown[] = [];
  const where = admin ? "1=1" : req.user ? "user_id=$1" : "email=$1";
  if (admin) {
    const { rows } = await pool.query(`SELECT id, user_id AS "userId", customer_name AS "customerName", email, phone, reservation_date AS "reservationDate", reservation_time AS "reservationTime", guests, special_request AS "specialRequest", status, created_at AS "createdAt" FROM reservations ORDER BY reservation_date DESC`);
    return ok(res, rows);
  }
  values.push(req.user?.email || String(req.query.email || "").toLowerCase());
  const { rows } = await pool.query(`SELECT id, user_id AS "userId", customer_name AS "customerName", email, phone, reservation_date AS "reservationDate", reservation_time AS "reservationTime", guests, special_request AS "specialRequest", status, created_at AS "createdAt" FROM reservations WHERE ${where} ORDER BY reservation_date DESC`, values);
  return ok(res, rows);
}));

router.get("/reservations/:id", optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`SELECT id, user_id AS "userId", customer_name AS "customerName", email, phone, reservation_date AS "reservationDate", reservation_time AS "reservationTime", guests, special_request AS "specialRequest", status, created_at AS "createdAt" FROM reservations WHERE id=$1`, [parseId(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, "Reservation not found", "NOT_FOUND");
  if (req.user?.role !== "admin" && req.user?.id !== rows[0].userId && req.user?.email !== rows[0].email) throw new HttpError(403, "You cannot access this reservation", "FORBIDDEN");
  return ok(res, rows[0]);
}));

router.put("/reservations/:id", requireAuth, asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const current = await pool.query("SELECT user_id, email FROM reservations WHERE id=$1", [id]);
  if (!current.rows[0]) throw new HttpError(404, "Reservation not found", "NOT_FOUND");
  if (req.user!.role !== "admin" && current.rows[0].user_id !== req.user!.id) throw new HttpError(403, "You cannot update this reservation", "FORBIDDEN");
  const status = req.user!.role === "admin" ? req.body.status : undefined;
  const { rows } = await pool.query(
    `UPDATE reservations SET customer_name=COALESCE($1,customer_name), email=COALESCE($2,email), phone=COALESCE($3,phone),
     reservation_date=COALESCE($4,reservation_date), reservation_time=COALESCE($5,reservation_time), guests=COALESCE($6,guests),
     special_request=COALESCE($7,special_request), status=COALESCE($8,status), updated_at=now() WHERE id=$9
     RETURNING id, customer_name AS "customerName", email, phone, reservation_date AS "reservationDate", reservation_time AS "reservationTime", guests, special_request AS "specialRequest", status`,
    [req.body.customerName || null, req.body.email || null, req.body.phone || null, req.body.reservationDate || null, req.body.reservationTime || null, req.body.guests || null, req.body.specialRequest || null, status || null, id],
  );
  return ok(res, rows[0], "Reservation updated");
}));

router.delete("/reservations/:id", requireAuth, asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const result = await pool.query("DELETE FROM reservations WHERE id=$1 AND (user_id=$2 OR $3='admin')", [id, req.user!.id, req.user!.role]);
  if (!result.rowCount) throw new HttpError(404, "Reservation not found", "NOT_FOUND");
  return res.status(204).send();
}));

router.post("/orders", optionalAuth, asyncHandler(async (req, res) => {
  requireFields(req.body, ["customerName", "customerEmail", "customerPhone", "orderType", "items"]);
  if (!validEmail(req.body.customerEmail) || !["dine_in", "takeaway", "delivery"].includes(req.body.orderType)) throw new HttpError(400, "Invalid customer or order details", "INVALID_ORDER");
  if (!Array.isArray(req.body.items) || !req.body.items.length) throw new HttpError(400, "At least one menu item is required", "EMPTY_ORDER");
  if (req.body.orderType === "delivery" && !req.body.deliveryAddress) throw new HttpError(400, "A delivery address is required", "MISSING_ADDRESS");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ids = req.body.items.map((item: { menuItemId: number }) => Number(item.menuItemId));
    const { rows: menuRows } = await client.query("SELECT id, price::float AS price, is_available AS \"isAvailable\" FROM menu_items WHERE id = ANY($1::int[]) FOR SHARE", [ids]);
    const byId = new Map(menuRows.map((item) => [item.id, item]));
    let subtotal = 0;
    const normalized: { menuItemId: number; quantity: number; unitPrice: number; subtotal: number }[] = [];
    for (const item of req.body.items as { menuItemId: number; quantity: number }[]) {
      const menu = byId.get(Number(item.menuItemId));
      const quantity = Number(item.quantity);
      if (!menu || !menu.isAvailable || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new HttpError(400, "One or more menu items are unavailable or invalid", "INVALID_ORDER_ITEM");
      const line = Math.round(menu.price * quantity * 100) / 100;
      subtotal += line;
      normalized.push({ menuItemId: menu.id, quantity, unitPrice: menu.price, subtotal: line });
    }
    subtotal = Math.round(subtotal * 100) / 100;
    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const deliveryFee = req.body.orderType === "delivery" ? 250 : 0;
    const total = subtotal + tax + deliveryFee;
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (user_id,customer_name,customer_email,customer_phone,order_type,delivery_address,subtotal,tax,delivery_fee,total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, user_id AS "userId", customer_name AS "customerName", customer_email AS "customerEmail", customer_phone AS "customerPhone", order_type AS "orderType", delivery_address AS "deliveryAddress", subtotal::float, tax::float, delivery_fee::float AS "deliveryFee", total_amount::float AS "totalAmount", status, created_at AS "createdAt"`,
      [req.user?.id || null, String(req.body.customerName).trim(), String(req.body.customerEmail).trim().toLowerCase(), String(req.body.customerPhone).trim(), req.body.orderType, req.body.deliveryAddress || null, subtotal, tax, deliveryFee, total],
    );
    for (const item of normalized) await client.query("INSERT INTO order_items (order_id,menu_item_id,quantity,unit_price,subtotal) VALUES ($1,$2,$3,$4,$5)", [orderRows[0].id, item.menuItemId, item.quantity, item.unitPrice, item.subtotal]);
    await client.query("COMMIT");
    return ok(res, { ...orderRows[0], items: normalized }, "Order placed", 201);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

router.get("/orders", optionalAuth, asyncHandler(async (req, res) => {
  if (req.user?.role !== "admin" && !req.user) return ok(res, []);
  const values = req.user.role === "admin" ? [] : [req.user.id];
  const where = req.user.role === "admin" ? "1=1" : "o.user_id=$1";
  const { rows } = await pool.query(`SELECT o.id, o.user_id AS "userId", o.customer_name AS "customerName", o.customer_email AS "customerEmail", o.order_type AS "orderType", o.subtotal::float, o.tax::float, o.delivery_fee::float AS "deliveryFee", o.total_amount::float AS "totalAmount", o.status, o.created_at AS "createdAt" FROM orders o WHERE ${where} ORDER BY o.created_at DESC`, values);
  return ok(res, rows);
}));

router.get("/orders/:id", optionalAuth, asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query(`SELECT o.id, o.user_id AS "userId", o.customer_name AS "customerName", o.customer_email AS "customerEmail", o.customer_phone AS "customerPhone", o.order_type AS "orderType", o.delivery_address AS "deliveryAddress", o.subtotal::float, o.tax::float, o.delivery_fee::float AS "deliveryFee", o.total_amount::float AS "totalAmount", o.status, o.created_at AS "createdAt" FROM orders o WHERE o.id=$1`, [id]);
  if (!rows[0]) throw new HttpError(404, "Order not found", "NOT_FOUND");
  if (req.user?.role !== "admin" && req.user?.id !== rows[0].userId) throw new HttpError(403, "You cannot access this order", "FORBIDDEN");
  const items = await pool.query(`SELECT oi.id, oi.menu_item_id AS "menuItemId", m.name, oi.quantity, oi.unit_price::float AS "unitPrice", oi.subtotal::float FROM order_items oi JOIN menu_items m ON m.id=oi.menu_item_id WHERE oi.order_id=$1`, [id]);
  return ok(res, { ...rows[0], items: items.rows });
}));

router.put("/orders/:id", requireAdmin, asyncHandler(async (req, res) => {
  if (!["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"].includes(req.body.status)) throw new HttpError(400, "Invalid order status", "INVALID_STATUS");
  const { rows } = await pool.query(`UPDATE orders SET status=$1, updated_at=now() WHERE id=$2 RETURNING id, status, updated_at AS "updatedAt"`, [req.body.status, parseId(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, "Order not found", "NOT_FOUND");
  return ok(res, rows[0], "Order status updated");
}));

router.delete("/orders/:id", requireAdmin, asyncHandler(async (req, res) => {
  const result = await pool.query("DELETE FROM orders WHERE id=$1", [parseId(req.params.id)]);
  if (!result.rowCount) throw new HttpError(404, "Order not found", "NOT_FOUND");
  return res.status(204).send();
}));

export default router;