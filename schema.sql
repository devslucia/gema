-- GEMA Database Schema
-- Run these SQL statements in your Supabase project's SQL Editor

-- Drop existing products table if it has the old enum category
-- (Skip this if you want to keep existing data - you'll need to migrate manually)
-- DROP TABLE IF EXISTS products CASCADE;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create products table with category_id foreign key
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10, 2) NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Categories RLS Policies
-- Public can view categories
CREATE POLICY "Public can view categories" ON categories
  FOR SELECT USING (true);

-- Admin can manage categories
CREATE POLICY "Admin can manage categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Products RLS Policies (updated to work with new schema)
-- Public can view products
CREATE POLICY "Public can view products" ON products
  FOR SELECT USING (true);

-- Admin can manage products
CREATE POLICY "Admin can manage products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert default categories (run this manually if needed)
-- INSERT INTO categories (name) VALUES ('Module'), ('Battery'), ('Other');