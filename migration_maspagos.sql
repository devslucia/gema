-- ============================================================
-- MIGRACIÓN: +Pagos Nación (Nación Servicios S.A.)
-- Archivo: migration_maspagos.sql
-- Fecha: 2026-10-02
--
-- INSTRUCCIONES:
--   Ejecutar en el SQL Editor de Supabase (supabase.com/dashboard)
--   O en tu cliente Postgres conectado a la BD del proyecto.
--
-- SEGURIDAD: Esta migración es IDEMPOTENTE (usa IF NOT EXISTS y
--   DO $$ ... END $$ para columnas existentes).
--   Podés volver a correrla sin peligro.
-- ============================================================

-- ── 1. Extender tabla orders con campos multi-proveedor ──────────────────────

-- Proveedor de pago: 'maspagos' | 'mercadopago'
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_provider text CHECK (payment_provider IN ('maspagos', 'mercadopago'));

-- ID externo de la transacción en el sistema del proveedor
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS external_payment_id text;

-- Link de pago generado por el admin / proveedor
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_link text;

-- Notas internas del pedido (instrucciones, referencias, etc.)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_notes text;

-- Timestamp de expiración del pedido/link
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS expired_at timestamptz;

-- ── 2. Ampliar CHECK de status para incluir 'expired' ───────────────────────
--
-- Supabase no permite ALTER TABLE ... DROP CONSTRAINT y re-agregarla de forma
-- directa si el constraint tiene nombre autogenerado. Usamos DO para manejar
-- ambos casos (constraint existente con nombre o sin nombre).
-- ──────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Buscar constraint existente en "orders.status"
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'orders'::regclass
    AND contype = 'c'
    AND pg_catalog.pg_get_constraintdef(oid) LIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE orders DROP CONSTRAINT %I', constraint_name);
  END IF;

  -- Agregar constraint ampliado con 'expired'
  ALTER TABLE orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded', 'expired'));

EXCEPTION WHEN others THEN
  -- Si ya existe con ese nombre o hay otro error, reportar sin romper
  RAISE NOTICE 'orders_status_check: %', SQLERRM;
END;
$$;

-- ── 3. Migrar pedidos existentes de Mercado Pago ─────────────────────────────
--
-- Los pedidos anteriores que tenían mp_preference_id se marcan como mercadopago.
-- Esto no es obligatorio pero ayuda a distinguir en el panel.

UPDATE orders
SET payment_provider = 'mercadopago'
WHERE payment_provider IS NULL
  AND (mp_preference_id IS NOT NULL OR mp_payment_id IS NOT NULL);

-- ── 4. Índices para performance ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_payment_provider
  ON orders (payment_provider);

CREATE INDEX IF NOT EXISTS idx_orders_external_payment_id
  ON orders (external_payment_id)
  WHERE external_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_maspagos_pending
  ON orders (created_at DESC)
  WHERE payment_provider = 'maspagos' AND status = 'pending';

-- ── 5. Política RLS para payment_link (lectura pública opcional) ─────────────
--
-- Si querés que los clientes puedan consultar su propio link de pago
-- por su email (por ejemplo en una página /mi-pedido/[id]), necesitarías
-- una política más granular. Por ahora se mantiene solo para autenticados.
-- (Las políticas existentes ya cubren esto.)

-- ── 6. Función helper: obtener pedidos de +Pagos Nación pendientes ───────────

CREATE OR REPLACE FUNCTION get_maspagos_pending_orders()
RETURNS TABLE (
  id uuid,
  customer_name text,
  customer_email text,
  total numeric,
  payment_link text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    id,
    customer_name,
    customer_email,
    total,
    payment_link,
    created_at
  FROM orders
  WHERE payment_provider = 'maspagos'
    AND status = 'pending'
  ORDER BY created_at DESC;
$$;

-- ── 7. Vista resumen de pedidos por proveedor (útil para reporting) ──────────

CREATE OR REPLACE VIEW orders_by_provider AS
SELECT
  COALESCE(payment_provider, 'sin_proveedor') AS payment_provider,
  status,
  COUNT(*) AS total_orders,
  SUM(total) AS total_amount
FROM orders
GROUP BY payment_provider, status
ORDER BY payment_provider, status;

-- Hacer la vista accesible para usuarios autenticados
GRANT SELECT ON orders_by_provider TO authenticated;

-- ============================================================
-- FIN DE MIGRACIÓN
--
-- Verificación rápida post-ejecución:
--   SELECT column_name, data_type 
--   FROM information_schema.columns
--   WHERE table_name = 'orders'
--   ORDER BY ordinal_position;
--
--   SELECT * FROM orders_by_provider;
-- ============================================================
