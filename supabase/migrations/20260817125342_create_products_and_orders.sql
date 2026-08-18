/*
# Create products and orders tables (single-tenant, no auth)

1. New Tables
- `products`
  - `id` (uuid, primary key)
  - `name` (text, not null) — product display name
  - `detail` (text) — short spec line e.g. "Automatic · 41mm"
  - `price` (numeric, not null) — price in dollars
  - `image_url` (text) — path or URL to the product image
  - `accent` (text) — visual accent key: aqua | black | cream
  - `is_active` (boolean, default true) — soft-hide from storefront when false
  - `created_at` (timestamptz)
- `orders`
  - `id` (uuid, primary key)
  - `customer_name` (text, not null)
  - `customer_email` (text, not null)
  - `customer_phone` (text)
  - `shipping_address` (text)
  - `product_id` (uuid, references products) — which product was ordered
  - `product_name` (text, not null) — snapshot of product name at order time
  - `quantity` (integer, not null default 1)
  - `total` (numeric, not null) — quantity * unit price
  - `status` (text, not null default 'pending') — pending | processing | shipped | delivered | cancelled
  - `notes` (text) — optional customer/admin notes
  - `created_at` (timestamptz)

2. Security
- Enable RLS on both tables.
- This is a single-tenant storefront + admin with no sign-in screen, so all
  CRUD is intentionally open to the anon-key client. Policies use
  `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because
  the data is shared/public by design.

3. Notes
- `orders.product_name` and `orders.total` are snapshots so historical orders
  remain correct even if a product is later renamed or repriced.
- `products.is_active` lets the admin hide a product without deleting it.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  detail text,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  image_url text,
  accent text NOT NULL DEFAULT 'aqua',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  shipping_address text,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total numeric(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (is_active);
