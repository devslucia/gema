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
-- Repair orders (same as migration_repair_orders.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS repair_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Correlative order number (1, 2, 3...), shown padded as #000001
  order_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  received_at timestamptz NOT NULL DEFAULT now(),

  -- Customer
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,

  -- Device
  device_brand text NOT NULL,
  device_model text NOT NULL,
  imei text,
  lock_type text NOT NULL DEFAULT 'none'
    CHECK (lock_type IN ('none', 'pin', 'pattern', 'fingerprint', 'other')),
  lock_notes text,
  -- Android-style pattern as sequence of points 1..9 (row by row, top-left = 1)
  unlock_pattern smallint[],

  -- Reception
  issue text NOT NULL,
  accessories text[] NOT NULL DEFAULT '{}',
  cosmetic_condition text,

  -- Work
  work_to_do text,
  estimated_budget numeric(12, 2),
  deposit numeric(12, 2),
  technician text,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  internal_notes text,
  status text NOT NULL DEFAULT 'ingresado'
    CHECK (status IN ('ingresado', 'en_reparacion', 'listo', 'entregado', 'cancelado')),

  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE repair_orders ENABLE ROW LEVEL SECURITY;

-- Only authenticated users (admins) can see or manage repair orders.
-- Customer data is never public.
CREATE POLICY "Authenticated can manage repair orders" ON repair_orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_repair_orders_status ON repair_orders (status);
CREATE INDEX IF NOT EXISTS idx_repair_orders_received_at ON repair_orders (received_at DESC);

CREATE OR REPLACE FUNCTION update_repair_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_repair_orders_updated_at ON repair_orders;
CREATE TRIGGER trigger_update_repair_orders_updated_at
BEFORE UPDATE ON repair_orders
FOR EACH ROW
EXECUTE FUNCTION update_repair_orders_updated_at();
