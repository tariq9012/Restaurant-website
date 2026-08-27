import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAdmin } from "../middleware/auth";
import { asyncHandler, HttpError, ok, parseId, requireFields } from "../utils/http";

const router = Router();
const itemFields = `m.id, m.category_id AS "categoryId", c.name AS category, m.name, m.description, m.price::float AS price,
  m.image, m.rating::float AS rating, m.is_vegetarian AS "isVegetarian", m.is_spicy AS "isSpicy",
  m.is_featured AS "isFeatured", m.is_available AS "isAvailable", m.created_at AS "createdAt", m.updated_at AS "updatedAt"`;

router.get("/categories", asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(`SELECT id, name, description, image, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt" FROM categories WHERE is_active = true ORDER BY id`);
  return ok(res, rows);
}));

router.get("/categories/:id", asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`SELECT id, name, description, image, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt" FROM categories WHERE id = $1`, [parseId(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, "Category not found", "NOT_FOUND");
  return ok(res, rows[0]);
}));

router.post("/categories", requireAdmin, asyncHandler(async (req, res) => {
  requireFields(req.body, ["name"]);
  const { rows } = await pool.query(`INSERT INTO categories (name, description, image, is_active) VALUES ($1,$2,$3,COALESCE($4,true)) RETURNING id, name, description, image, is_active AS "isActive"`, [String(req.body.name).trim(), req.body.description || null, req.body.image || null, req.body.isActive]);
  return ok(res, rows[0], "Category created", 201);
}));

router.put("/categories/:id", requireAdmin, asyncHandler(async (req, res) => {
  requireFields(req.body, ["name"]);
  const { rows } = await pool.query(`UPDATE categories SET name=$1, description=$2, image=$3, is_active=COALESCE($4,is_active), updated_at=now() WHERE id=$5 RETURNING id, name, description, image, is_active AS "isActive"`, [String(req.body.name).trim(), req.body.description || null, req.body.image || null, req.body.isActive, parseId(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, "Category not found", "NOT_FOUND");
  return ok(res, rows[0], "Category updated");
}));

router.delete("/categories/:id", requireAdmin, asyncHandler(async (req, res) => {
  const result = await pool.query("DELETE FROM categories WHERE id = $1", [parseId(req.params.id)]);
  if (!result.rowCount) throw new HttpError(404, "Category not found", "NOT_FOUND");
  return res.status(204).send();
}));

router.get("/menu", asyncHandler(async (req, res) => {
  const values: unknown[] = [];
  const where = ["1=1"];
  if (req.query.categoryId) { values.push(Number(req.query.categoryId)); where.push(`m.category_id = $${values.length}`); }
  if (req.query.featured !== undefined) { values.push(req.query.featured === "true"); where.push(`m.is_featured = $${values.length}`); }
  if (req.query.available !== undefined) { values.push(req.query.available === "true"); where.push(`m.is_available = $${values.length}`); }
  else where.push("m.is_available = true");
  if (req.query.search) { values.push(`%${String(req.query.search)}%`); where.push(`(m.name ILIKE $${values.length} OR m.description ILIKE $${values.length})`); }
  const sort = req.query.sort === "price_asc" ? "m.price ASC" : req.query.sort === "price_desc" ? "m.price DESC" : req.query.sort === "rating" ? "m.rating DESC" : "m.is_featured DESC, m.name ASC";
  const { rows } = await pool.query(`SELECT ${itemFields} FROM menu_items m JOIN categories c ON c.id=m.category_id WHERE ${where.join(" AND ")} ORDER BY ${sort}`, values);
  return ok(res, rows);
}));

router.get("/menu/:id", asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`SELECT ${itemFields} FROM menu_items m JOIN categories c ON c.id=m.category_id WHERE m.id=$1`, [parseId(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, "Menu item not found", "NOT_FOUND");
  return ok(res, rows[0]);
}));

router.post("/menu", requireAdmin, asyncHandler(async (req, res) => {
  requireFields(req.body, ["categoryId", "name", "description", "price"]);
  const { rows } = await pool.query(`INSERT INTO menu_items (category_id,name,description,price,image,rating,is_vegetarian,is_spicy,is_featured,is_available) VALUES ($1,$2,$3,$4,$5,COALESCE($6,0),COALESCE($7,false),COALESCE($8,false),COALESCE($9,false),COALESCE($10,true)) RETURNING id`, [Number(req.body.categoryId), String(req.body.name).trim(), String(req.body.description).trim(), Number(req.body.price), req.body.image || null, req.body.rating, req.body.isVegetarian, req.body.isSpicy, req.body.isFeatured, req.body.isAvailable]);
  return ok(res, rows[0], "Menu item created", 201);
}));

router.put("/menu/:id", requireAdmin, asyncHandler(async (req, res) => {
  requireFields(req.body, ["categoryId", "name", "description", "price"]);
  const { rows } = await pool.query(`UPDATE menu_items SET category_id=$1,name=$2,description=$3,price=$4,image=$5,rating=COALESCE($6,rating),is_vegetarian=COALESCE($7,is_vegetarian),is_spicy=COALESCE($8,is_spicy),is_featured=COALESCE($9,is_featured),is_available=COALESCE($10,is_available),updated_at=now() WHERE id=$11 RETURNING id`, [Number(req.body.categoryId), String(req.body.name).trim(), String(req.body.description).trim(), Number(req.body.price), req.body.image || null, req.body.rating, req.body.isVegetarian, req.body.isSpicy, req.body.isFeatured, req.body.isAvailable, parseId(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, "Menu item not found", "NOT_FOUND");
  return ok(res, rows[0], "Menu item updated");
}));

router.delete("/menu/:id", requireAdmin, asyncHandler(async (req, res) => {
  const result = await pool.query("DELETE FROM menu_items WHERE id=$1", [parseId(req.params.id)]);
  if (!result.rowCount) throw new HttpError(404, "Menu item not found", "NOT_FOUND");
  return res.status(204).send();
}));

export default router;