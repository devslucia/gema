-- GEMA - Órdenes de reparación
-- Run this in your Supabase project's SQL Editor (once)

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
