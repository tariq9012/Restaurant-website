import {
  boolean,
  check,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);
export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);
export const orderTypeEnum = pgEnum("order_type", ["dine_in", "takeaway", "delivery"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);
export const messageStatusEnum = pgEnum("message_status", ["unread", "read", "replied"]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    phone: varchar("phone", { length: 32 }),
    role: userRoleEnum("role").default("customer").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email), index("users_role_idx").on(table.role)],
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    image: text("image"),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("categories_name_unique").on(table.name), index("categories_active_idx").on(table.isActive)],
);

export const menuItems = pgTable(
  "menu_items",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict", onUpdate: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    image: text("image"),
    rating: decimal("rating", { precision: 2, scale: 1 }).default("0").notNull(),
    isVegetarian: boolean("is_vegetarian").default(false).notNull(),
    isSpicy: boolean("is_spicy").default(false).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    check("menu_items_price_check", sql`${table.price} >= 0`),
    check("menu_items_rating_check", sql`${table.rating} >= 0 AND ${table.rating} <= 5`),
    index("menu_items_category_idx").on(table.categoryId),
    index("menu_items_available_idx").on(table.isAvailable),
    index("menu_items_featured_idx").on(table.isFeatured),
  ],
);

export const reservations = pgTable(
  "reservations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
    customerName: varchar("customer_name", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    reservationDate: timestamp("reservation_date", { withTimezone: false }).notNull(),
    reservationTime: varchar("reservation_time", { length: 10 }).notNull(),
    guests: integer("guests").notNull(),
    specialRequest: text("special_request"),
    status: reservationStatusEnum("status").default("pending").notNull(),
    ...timestamps,
  },
  (table) => [
    check("reservations_guests_check", sql`${table.guests} > 0 AND ${table.guests} <= 50`),
    index("reservations_date_idx").on(table.reservationDate),
    index("reservations_status_idx").on(table.status),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
    customerName: varchar("customer_name", { length: 160 }).notNull(),
    customerEmail: varchar("customer_email", { length: 320 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 32 }).notNull(),
    orderType: orderTypeEnum("order_type").notNull(),
    deliveryAddress: text("delivery_address"),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    tax: decimal("tax", { precision: 12, scale: 2 }).default("0").notNull(),
    deliveryFee: decimal("delivery_fee", { precision: 12, scale: 2 }).default("0").notNull(),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    status: orderStatusEnum("status").default("pending").notNull(),
    ...timestamps,
  },
  (table) => [
    check("orders_subtotal_check", sql`${table.subtotal} >= 0`),
    check("orders_tax_check", sql`${table.tax} >= 0`),
    check("orders_delivery_fee_check", sql`${table.deliveryFee} >= 0`),
    check("orders_total_amount_check", sql`${table.totalAmount} >= 0`),
    check(
      "orders_delivery_address_check",
      sql`(${table.orderType} <> 'delivery' OR ${table.deliveryAddress} IS NOT NULL)`,
    ),
    index("orders_user_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade", onUpdate: "cascade" }),
    menuItemId: integer("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "restrict", onUpdate: "cascade" }),
    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [
    check("order_items_quantity_check", sql`${table.quantity} > 0`),
    check("order_items_unit_price_check", sql`${table.unitPrice} >= 0`),
    check("order_items_subtotal_check", sql`${table.subtotal} >= 0`),
    uniqueIndex("order_items_order_menu_unique").on(table.orderId, table.menuItemId),
    index("order_items_order_idx").on(table.orderId),
    index("order_items_menu_item_idx").on(table.menuItemId),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
    menuItemId: integer("menu_item_id").references(() => menuItems.id, { onDelete: "set null", onUpdate: "cascade" }),
    customerName: varchar("customer_name", { length: 160 }).notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    isApproved: boolean("is_approved").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    check("reviews_rating_check", sql`${table.rating} BETWEEN 1 AND 5`),
    index("reviews_menu_item_idx").on(table.menuItemId),
    index("reviews_approved_idx").on(table.isApproved),
  ],
);

export const restaurantInfo = pgTable("restaurant_info", {
  id: serial("id").primaryKey(),
  restaurantName: varchar("restaurant_name", { length: 160 }).notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  openingHours: text("opening_hours").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  ...timestamps,
});

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    subject: varchar("subject", { length: 200 }).notNull(),
    message: text("message").notNull(),
    status: messageStatusEnum("status").default("unread").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("contact_messages_status_idx").on(table.status), index("contact_messages_created_at_idx").on(table.createdAt)],
);