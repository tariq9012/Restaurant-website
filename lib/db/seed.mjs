import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const client = await pool.connect();
try {
  await client.query("BEGIN");

  await client.query(`
    INSERT INTO users (name, email, password_hash, phone, role)
    VALUES
      ('Luma Admin', 'admin@luma.example', '$2b$12$G12tk4td0UboXs3CHYQqu.rI5rIRy5YEweo7uO9e.SR0wGaeR17Oq', '+92 300 1112233', 'admin'),
      ('Ayesha Khan', 'ayesha.khan@example.com', '$2b$12$ljV/PEg6NKQGByXg/Eig6.sEpW9.Soj0ty.nIhpmOfcw4HCffKDpS', '+92 301 4455667', 'customer'),
      ('Hamza Malik', 'hamza.malik@example.com', '$2b$12$ljV/PEg6NKQGByXg/Eig6.sEpW9.Soj0ty.nIhpmOfcw4HCffKDpS', '+92 302 7788990', 'customer'),
      ('Sara Ahmed', 'sara.ahmed@example.com', '$2b$12$ljV/PEg6NKQGByXg/Eig6.sEpW9.Soj0ty.nIhpmOfcw4HCffKDpS', '+92 333 2211445', 'customer'),
      ('Omar Siddiqui', 'omar.siddiqui@example.com', '$2b$12$ljV/PEg6NKQGByXg/Eig6.sEpW9.Soj0ty.nIhpmOfcw4HCffKDpS', '+92 321 9080706', 'customer')
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

    INSERT INTO categories (name, description, image)
    VALUES
      ('Starters', 'Small plates to begin the evening.', '/images/plate-cauliflower.jpg'),
      ('Main Course', 'Seasonal plates from the hearth and garden.', '/images/plate-fish.jpg'),
      ('Burgers', 'Hand-pressed favourites with Luma sides.', '/images/hero-fire.jpg'),
      ('Pizza', 'Long-fermented dough, blistered in our oven.', '/images/room.jpg'),
      ('Pasta', 'Fresh pasta, rich sauces, and bright herbs.', '/images/ingredient.jpg'),
      ('Desserts', 'A sweet finish made in-house.', '/images/plate-cauliflower.jpg'),
      ('Drinks', 'House pours, zero-proof serves, and coffee.', '/images/room.jpg'),
      ('Chef''s Specials', 'Limited plates guided by the market.', '/images/plate-fish.jpg')
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO menu_items
      (category_id, name, description, price, image, rating, is_vegetarian, is_spicy, is_featured, is_available)
    SELECT c.id, v.name, v.description, v.price, v.image, v.rating, v.is_vegetarian, v.is_spicy, v.is_featured, true
    FROM (VALUES
      ('Starters', 'Charred Cauliflower', 'Tahini, pomegranate, smoked almond, mint.', 1450, '/images/plate-cauliflower.jpg', 4.8, true, false, true),
      ('Starters', 'Lahori Chicken Wings', 'Tamarind glaze, sesame, cooling yogurt.', 1650, '/images/hero-fire.jpg', 4.7, false, true, false),
      ('Starters', 'Burrata & Burnt Tomato', 'Creamy burrata, blistered tomatoes, basil oil.', 1950, '/images/ingredient.jpg', 4.9, true, false, true),
      ('Main Course', 'Ember-Roasted Sea Bass', 'Preserved lemon, green chilli, saffron broth.', 3850, '/images/plate-fish.jpg', 4.9, false, true, true),
      ('Main Course', 'Smoked Lamb Shoulder', 'Twelve-hour lamb, sumac onion, flatbread jus.', 4200, '/images/hero-fire.jpg', 4.8, false, false, true),
      ('Main Course', 'Miso Eggplant', 'White miso, sesame, crispy rice, herbs.', 2250, '/images/plate-cauliflower.jpg', 4.6, true, false, false),
      ('Burgers', 'The Luma Burger', 'Dry-aged beef, ember onions, house pickles, fries.', 2450, '/images/hero-fire.jpg', 4.8, false, false, true),
      ('Burgers', 'Crispy Chicken Burger', 'Buttermilk chicken, chilli honey, slaw.', 2150, '/images/plate-fish.jpg', 4.6, false, true, false),
      ('Pizza', 'Nduja & Hot Honey', 'Mozzarella, nduja, fermented chilli, honey.', 2350, '/images/room.jpg', 4.7, false, true, true),
      ('Pizza', 'Wild Mushroom Pizza', 'Roasted mushrooms, taleggio, thyme, truffle.', 2250, '/images/ingredient.jpg', 4.8, true, false, false),
      ('Pasta', 'Mafaldine Arrabbiata', 'Tomato sugo, garlic, basil, aged parmesan.', 1950, '/images/ingredient.jpg', 4.7, true, true, false),
      ('Pasta', 'Lamb Ragu Pappardelle', 'Slow-cooked lamb, rosemary, pecorino.', 2550, '/images/hero-fire.jpg', 4.9, false, false, true),
      ('Desserts', 'Basque Cheesecake', 'Burnt cheesecake, plum compote, cream.', 1250, '/images/plate-cauliflower.jpg', 4.8, true, false, false),
      ('Desserts', 'Dark Chocolate Pot', 'Sea salt, olive oil, toasted hazelnut.', 1150, '/images/room.jpg', 4.7, true, false, false),
      ('Desserts', 'Cardamom Gulab Jamun', 'Warm dumplings, saffron cream, pistachio.', 1050, '/images/ingredient.jpg', 4.6, true, false, false),
      ('Drinks', 'Saffron Spritz', 'Saffron, citrus, sparkling wine, orange.', 1450, '/images/room.jpg', 4.8, true, false, false),
      ('Drinks', 'Smoked Peach Soda', 'Peach, lapsang, lemon, soda.', 850, '/images/hero-fire.jpg', 4.7, true, false, false),
      ('Drinks', 'Luma Old Fashioned', 'Bourbon, date, bitters, orange oil.', 1650, '/images/room.jpg', 4.9, false, false, true),
      ('Chef''s Specials', 'Fire-Roasted Corn Ribs', 'Makhani butter, lime, chaat masala.', 1250, '/images/plate-cauliflower.jpg', 4.8, true, true, false),
      ('Chef''s Specials', 'Black Garlic Prawns', 'Charred prawns, black garlic, coriander.', 2950, '/images/plate-fish.jpg', 4.9, false, true, true)
    ) AS v(category_name, name, description, price, image, rating, is_vegetarian, is_spicy, is_featured)
    JOIN categories c ON c.name = v.category_name
    WHERE NOT EXISTS (SELECT 1 FROM menu_items m WHERE m.name = v.name);

    INSERT INTO restaurant_info
      (restaurant_name, description, address, phone, email, opening_hours, latitude, longitude, facebook_url, instagram_url)
    SELECT 'Luma', 'A dining room by the fire, serving seasonal food, good wine, and unhurried evenings.',
      '18 Tipu Road, Gulberg III, Lahore', '+92 42 3571 9090', 'hello@luma.example',
      'Wednesday–Sunday, 5:00 PM–11:00 PM', 31.5204, 74.3587,
      'https://facebook.com/lumarestaurant', 'https://instagram.com/lumarestaurant'
    WHERE NOT EXISTS (SELECT 1 FROM restaurant_info);
  `);

  await client.query(`
    INSERT INTO reviews (user_id, menu_item_id, customer_name, rating, comment, is_approved)
    SELECT u.id, m.id, 'Ayesha Khan', 5, 'The sea bass was delicate, smoky, and perfectly bright. A beautiful evening.', true
    FROM users u, menu_items m
    WHERE u.email = 'ayesha.khan@example.com' AND m.name = 'Ember-Roasted Sea Bass'
      AND NOT EXISTS (SELECT 1 FROM reviews WHERE customer_name = 'Ayesha Khan' AND menu_item_id = m.id);

    INSERT INTO reviews (user_id, menu_item_id, customer_name, rating, comment, is_approved)
    SELECT u.id, m.id, 'Hamza Malik', 5, 'That burger is genuinely worth the drive. The ember onions are excellent.', true
    FROM users u, menu_items m
    WHERE u.email = 'hamza.malik@example.com' AND m.name = 'The Luma Burger'
      AND NOT EXISTS (SELECT 1 FROM reviews WHERE customer_name = 'Hamza Malik' AND menu_item_id = m.id);

    INSERT INTO reviews (user_id, menu_item_id, customer_name, rating, comment, is_approved)
    SELECT NULL, m.id, 'Nadia Raza', 4, 'Warm service, lovely room, and the cheesecake is a must.', true
    FROM menu_items m
    WHERE m.name = 'Basque Cheesecake'
      AND NOT EXISTS (SELECT 1 FROM reviews WHERE customer_name = 'Nadia Raza' AND menu_item_id = m.id);

    INSERT INTO reservations
      (user_id, customer_name, email, phone, reservation_date, reservation_time, guests, special_request, status)
    SELECT u.id, 'Ayesha Khan', u.email, u.phone, '2026-09-05', '19:30', 2, 'A quiet table if possible.', 'confirmed'
    FROM users u
    WHERE u.email = 'ayesha.khan@example.com'
      AND NOT EXISTS (SELECT 1 FROM reservations WHERE email = u.email AND reservation_date = '2026-09-05');

    INSERT INTO reservations
      (user_id, customer_name, email, phone, reservation_date, reservation_time, guests, special_request, status)
    SELECT u.id, 'Hamza Malik', u.email, u.phone, '2026-09-12', '20:00', 4, 'One guest is vegetarian.', 'pending'
    FROM users u
    WHERE u.email = 'hamza.malik@example.com'
      AND NOT EXISTS (SELECT 1 FROM reservations WHERE email = u.email AND reservation_date = '2026-09-12');

    INSERT INTO reservations
      (user_id, customer_name, email, phone, reservation_date, reservation_time, guests, special_request, status)
    SELECT NULL, 'Nadia Raza', 'nadia.raza@example.com', '+92 333 1122334', '2026-09-19', '18:30', 6, 'Birthday dinner.', 'confirmed'
    WHERE NOT EXISTS (SELECT 1 FROM reservations WHERE email = 'nadia.raza@example.com' AND reservation_date = '2026-09-19');

    INSERT INTO orders
      (user_id, customer_name, customer_email, customer_phone, order_type, delivery_address, subtotal, tax, delivery_fee, total_amount, status)
    SELECT u.id, u.name, u.email, u.phone, 'takeaway', NULL, 3900, 585, 0, 4485, 'confirmed'
    FROM users u
    WHERE u.email = 'sara.ahmed@example.com'
      AND NOT EXISTS (SELECT 1 FROM orders WHERE customer_email = u.email AND total_amount = 4485);

    INSERT INTO orders
      (user_id, customer_name, customer_email, customer_phone, order_type, delivery_address, subtotal, tax, delivery_fee, total_amount, status)
    SELECT u.id, u.name, u.email, u.phone, 'delivery', '42 Model Town, Lahore', 5050, 758, 250, 6058, 'out_for_delivery'
    FROM users u
    WHERE u.email = 'omar.siddiqui@example.com'
      AND NOT EXISTS (SELECT 1 FROM orders WHERE customer_email = u.email AND total_amount = 6058);
  `);

  await client.query(`
    INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal)
    SELECT o.id, m.id, 1, 2450, 2450
    FROM orders o, menu_items m
    WHERE o.customer_email = 'sara.ahmed@example.com' AND o.total_amount = 4485 AND m.name = 'The Luma Burger'
      AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND menu_item_id = m.id);

    INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal)
    SELECT o.id, m.id, 1, 1450, 1450
    FROM orders o, menu_items m
    WHERE o.customer_email = 'sara.ahmed@example.com' AND o.total_amount = 4485 AND m.name = 'Charred Cauliflower'
      AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND menu_item_id = m.id);

    INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal)
    SELECT o.id, m.id, 1, 4200, 4200
    FROM orders o, menu_items m
    WHERE o.customer_email = 'omar.siddiqui@example.com' AND o.total_amount = 6058 AND m.name = 'Smoked Lamb Shoulder'
      AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND menu_item_id = m.id);

    INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal)
    SELECT o.id, m.id, 1, 850, 850
    FROM orders o, menu_items m
    WHERE o.customer_email = 'omar.siddiqui@example.com' AND o.total_amount = 6058 AND m.name = 'Smoked Peach Soda'
      AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND menu_item_id = m.id);
  `);

  await client.query("COMMIT");
  console.info("Luma demo seed completed.");
} catch (error) {
  await client.query("ROLLBACK");
  console.error(error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}