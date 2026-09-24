-- GEMA Database Schema
-- Run these statements in your Supabase project's SQL Editor

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create products table with stock fields
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10, 2) NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  stock_actual integer NOT NULL DEFAULT 0,
  stock_minimo integer NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Categories RLS Policies
CREATE POLICY "Public can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Products RLS Policies
-- Public can view products (including stock for display)
CREATE POLICY "Public can view products" ON products
  FOR SELECT USING (true);

-- Admin can manage products (full CRUD including stock)
CREATE POLICY "Admin can manage products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- Only authenticated users (admins) can update stock fields
-- This policy ensures stock updates are protected
CREATE POLICY "Authenticated can update stock" ON products
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Stock movements audit table
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
  cantidad integer NOT NULL,
  stock_anterior integer NOT NULL,
  stock_nuevo integer NOT NULL,
  motivo text,
  usuario_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for stock_movements
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view stock movements
CREATE POLICY "Authenticated can view stock movements" ON stock_movements
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can insert stock movements
CREATE POLICY "Authenticated can insert stock movements" ON stock_movements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert default categories (run manually if needed)
-- INSERT INTO categories (name) VALUES ('Module'), ('Battery'), ('Other');

-- Add GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_products_name_gin ON products USING GIN (name gin_trgm_ops);

-- Enable pg_trgm extension for GIN index (run once)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for stock queries
CREATE INDEX IF NOT EXISTS idx_products_stock_minimo ON products (stock_minimo) WHERE stock_actual <= stock_minimo;
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements (created_at DESC);
-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  mp_preference_id TEXT UNIQUE,
  mp_payment_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies for orders
-- Public can view orders (for admin panel with proper auth)
CREATE POLICY "Authenticated can view orders" ON orders
FOR SELECT TO authenticated USING (true);
-- Authenticated can insert orders (from checkout)
CREATE POLICY "Authenticated can insert orders" ON orders
FOR INSERT TO authenticated WITH CHECK (true);
-- Authenticated can update orders (status, mp IDs)
CREATE POLICY "Authenticated can update orders" ON orders
FOR UPDATE TO authenticated USING (true);

-- Index on status for admin filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_mp ON orders (mp_preference_id);

-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for order_items
CREATE POLICY "Authenticated can view order_items" ON order_items
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert order_items" ON order_items
FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update order_items" ON order_items
FOR UPDATE TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items (product_id);

-- ============================================================
-- Trigger to update orders.updated_at
-- ==========================================================--
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();
