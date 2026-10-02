# +Pagos Nación — Documentación de Integración GEMA

> Fecha de implementación: Octubre 2026  
> Autor: Equipo GEMA  
> Estado: ✅ Implementado (flujo manual) · 🔜 Pendiente API privada

---

## 🗺️ Arquitectura elegida

### Diagnóstico del proveedor

**+Pagos Nación (Nación Servicios S.A.)** no dispone de API REST pública 
documentada para desarrolladores externos. Confirmado mediante:

- Revisión del sitio oficial `maspagos.com.ar`
- Búsqueda en repositorios públicos
- Contacto con soporte: `+54 11 5405-1110` / `info@maspagos.com.ar`

**Funcionalidades accesibles SIN API privada:**
- App móvil (iOS/Android): generación manual de links de pago
- Portal de comercio: `https://micomercio.maspagos.com.ar`
- QR estático / dinámico (presencial)
- Terminales POS virtuales

### Decisión de implementación

Se implementó el **Flujo de Link de Pago Manual** con gestión administrativa:

```
Cliente → Checkout → Pedido 'pending' (BD)
                           ↓
              Admin genera link en app/portal
                           ↓
              Admin pega link en panel GEMA
                           ↓
              Admin comparte link al cliente
                           ↓
              Cliente paga (portal +Pagos)
                           ↓
              Admin confirma en panel GEMA
                           ↓
              stock → descontado automáticamente
              pedido → status: 'paid'
```

---

## 📂 Archivos creados / modificados

### Nuevos

| Archivo | Descripción |
|---|---|
| `src/lib/maspagos/config.ts` | Config, constantes y helpers del proveedor |
| `src/app/api/maspagos/orders/route.ts` | `POST` — Crear pedido con proveedor maspagos |
| `src/app/api/maspagos/confirm/route.ts` | `POST` — Confirmar pago + descontar stock |
| `src/app/api/maspagos/link/route.ts` | `PATCH` — Actualizar link/estado del pedido |
| `src/app/checkout/maspagos/page.tsx` | Página de checkout para el cliente |
| `src/app/admin/maspagos/page.tsx` | Panel de administración de pedidos |
| `migration_maspagos.sql` | Migración de BD (este directorio) |
| `docs/maspagos-integration.md` | Este archivo |

### Modificados

| Archivo | Cambio |
|---|---|
| `src/types/product.ts` | `Order` extendido con `payment_provider`, `external_payment_id`, `payment_link`, `payment_notes`, `expired_at`. Nuevo type `PaymentProvider`, `OrderStatus` |
| `src/app/cart/page.tsx` | Se agregó opción de pago +Pagos Nación junto a Mercado Pago |

---

## 🛢️ SQL necesario

Ejecutá `migration_maspagos.sql` en el SQL Editor de Supabase:

```sql
-- Columnas nuevas en 'orders':
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_payment_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_link text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_notes text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expired_at timestamptz;
```

El archivo completo incluye:
- CHECK constraint ampliado (`status` incluye `'expired'`)
- Migración de pedidos MP existentes
- Índices de performance
- Vista `orders_by_provider`
- Función helper `get_maspagos_pending_orders()`

---

## 🔑 Variables de entorno

### Ya disponibles (no requieren cambios)

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Actuales — modo manual (agregar a .env.local)

```env
# +Pagos Nación — Solo informativo, no usado por API (aún sin API pública)
MASPAGOS_CONTACT_EMAIL=info@maspagos.com.ar
MASPAGOS_MERCHANT_PORTAL=https://micomercio.maspagos.com.ar
```

### Futuras — cuando se obtenga acceso API privada

```env
# SOLICITAR A NACIÓN SERVICIOS S.A.
MASPAGOS_API_KEY=           # Bearer token de la API privada
MASPAGOS_MERCHANT_ID=       # ID del comercio en el sistema
MASPAGOS_WEBHOOK_SECRET=    # Clave para validar firmas HMAC de webhooks
MASPAGOS_API_BASE_URL=      # URL base de la API (ej: https://api.maspagos.com.ar/v1)
```

---

## 🔄 Flujo completo paso a paso

### Para el cliente

1. Agrega productos al carrito
2. Va a `/cart` → elige **"Pagar con +Pagos Nación"**
3. Completa sus datos (nombre, email, teléfono opcional, notas)
4. Hace clic en **"Confirmar pedido con +Pagos Nación"**
5. El sistema:
   - Verifica stock
   - Crea el pedido en BD con `status: 'pending'`, `payment_provider: 'maspagos'`
6. Ve la pantalla de confirmación:
   - Si hay link: botón directo para pagar
   - Si no: aviso de que recibirá el link

### Para el admin

1. Va a `/admin/maspagos`
2. Ve los pedidos pendientes
3. Para cada pedido pendiente:
   a. Genera el link en la app +Pagos (o portal micomercio)
   b. Hace clic en **"+ Agregar Link de Pago"**
   c. Pega el URL del link + opcionalmente el ID de transacción
   d. Hace clic en **Guardar**
   e. Comparte el link al cliente (WhatsApp, email, etc.)
4. Cuando el cliente paga y el comercio recibe la notificación en la app:
   a. Va al pedido en el panel → **"Confirmar pago recibido"**
   b. Ingresa el ID de transacción de +Pagos (opcional pero recomendado)
   c. Confirma → stock descontado automáticamente

---

## 🧪 Cómo probar

### Prerrequisitos

1. Ejecutar `migration_maspagos.sql` en Supabase
2. Tener al menos un producto en stock
3. Estar logueado como admin

### Prueba del checkout (cliente)

```bash
# 1. Ir a la tienda y agregar productos al carrito
open http://localhost:3000

# 2. Ir al carrito
open http://localhost:3000/cart

# 3. Hacer clic en "Pagar con +Pagos Nación"
# → /checkout/maspagos

# 4. Completar el formulario con datos de prueba:
#    Nombre: Test Cliente
#    Email: test@gema.com
#    → Confirmar pedido

# 5. Verificar en Supabase que se creó el pedido:
SELECT id, status, payment_provider, total FROM orders 
WHERE payment_provider = 'maspagos' 
ORDER BY created_at DESC LIMIT 3;
```

### Prueba del panel admin

```bash
# 1. Ir al panel de pedidos +Pagos
open http://localhost:3000/admin/maspagos

# 2. Ver el pedido en estado 'Pendiente de pago'

# 3. Agregar un link de prueba:
#    Click "Agregar Link de Pago"
#    URL: https://ejemplo.maspagos.com.ar/pago/TEST123
#    Guardar

# 4. Confirmar el pago:
#    Click "Confirmar pago recibido"
#    ID transacción: TRX-TEST-001
#    Confirmar

# 5. Verificar en Supabase:
SELECT id, status, total, payment_provider, external_payment_id 
FROM orders WHERE payment_provider = 'maspagos';

# Stock descontado:
SELECT sm.*, p.name FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
WHERE sm.motivo LIKE '%Venta +Pagos%'
ORDER BY sm.created_at DESC;
```

### Tests de API direct (curl)

```bash
# Crear pedido (requiere sesión autenticada con cookie)
curl -X POST http://localhost:3000/api/maspagos/orders \
  -H "Content-Type: application/json" \
  -H "Cookie: [supabase-auth-token]" \
  -d '{
    "items": [{"product_id": "UUID_PRODUCTO", "quantity": 1}],
    "customerName": "Test",
    "customerEmail": "test@test.com"
  }'

# Confirmar pago
curl -X POST http://localhost:3000/api/maspagos/confirm \
  -H "Content-Type: application/json" \
  -H "Cookie: [supabase-auth-token]" \
  -d '{"orderId": "UUID_PEDIDO", "externalPaymentId": "TRX-001"}'
```

---

## 🚧 Qué falta (contacto comercial / API privada)

Para una integración de nivel producción completa necesitás:

### 1. Contactar a Nación Servicios S.A.

- **Email**: info@maspagos.com.ar
- **Tel**: +54 11 5405-1110 / 0810-444-0148
- **Portal**: https://micomercio.maspagos.com.ar

**Solicitar:**
- Acceso a programa de partners / integradores
- Documentación de API REST (si existe)
- Credenciales de sandbox/testing
- Documentación de webhooks (notificaciones de pago)

### 2. Si se otorga acceso API

Implementar en este orden:

#### a) `POST /api/maspagos/create-link` (nuevo)
```typescript
// Llamar a API de MasPagos para crear el link programáticamente
const response = await fetch('https://api.maspagos.com.ar/v1/payment-links', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.MASPAGOS_API_KEY}`,
    'X-Merchant-Id': process.env.MASPAGOS_MERCHANT_ID,
  },
  body: JSON.stringify({
    amount: order.total,
    description: `Pedido GEMA #${order.id.substring(0, 8)}`,
    customer_email: order.customer_email,
    // ... otros campos según documentación oficial
  })
})
```

#### b) `POST /api/maspagos/webhook` (nuevo)
```typescript
// Recibir y validar notificaciones de pago
export async function POST(req: Request) {
  const signature = req.headers.get('x-maspagos-signature')
  const isValid = validateHMACSignature(await req.text(), signature, process.env.MASPAGOS_WEBHOOK_SECRET)
  
  if (!isValid) return Response.json({ error: 'Invalid signature' }, { status: 401 })
  
  const { event, data } = await req.json()
  
  if (event === 'payment.approved') {
    // Confirmar automáticamente el pedido y descontar stock
    await confirmMasPagosOrder(data.external_reference, data.id)
  }
}
```

#### c) Actualizar checkout (`/checkout/maspagos/page.tsx`)
```typescript
// En lugar de mostrar "espere el link", crearlo automáticamente
const linkResponse = await fetch('/api/maspagos/create-link', { ... })
const { paymentLink } = await linkResponse.json()
// Redirigir inmediatamente al link
router.push(paymentLink)
```

### 3. Mejoras adicionales sin API

- **Email al cliente**: integrar Resend/SendGrid para enviar el link automáticamente
- **Página de seguimiento**: `/mis-pedidos/[email]` para que clientes vean su estado
- **Expiración automática**: cron job que marca como `expired` pedidos `pending` mayores a N días

---

## 💡 Referencia de estados

| Estado | Descripción | Acción siguiente |
|---|---|---|
| `pending` | Pedido creado, esperando pago | Admin agrega link → cliente paga → admin confirma |
| `paid` | Pago confirmado, stock descontado | Ninguna |
| `cancelled` | Cancelado por admin o cliente | Ninguna |
| `expired` | Link expirado sin pago | Crear nuevo pedido si el cliente quiere reintentar |
| `refunded` | Reembolso procesado | Gestión manual en portal +Pagos |

---

## 📦 Comisiones (referencia — sujeto a cambios)

| Método | Comisión | Acreditación |
|---|---|---|
| Link de Pago | ~3% | ~18 días hábiles |
| QR dinámico | Variable | Variable |
| POS físico | Variable | Variable |

*Siempre verificar en la documentación oficial o con el ejecutivo de cuenta de Banco Nación.*
