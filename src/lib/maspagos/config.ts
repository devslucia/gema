/**
 * +Pagos Nación (Nación Servicios S.A.) — Configuración
 *
 * ESTADO DE LA API (Octubre 2026):
 * ─────────────────────────────────
 * +Pagos Nación NO dispone de API REST pública documentada para developers.
 * Las funcionalidades disponibles son:
 *   • App móvil (iOS / Android) → generación manual de links de pago
 *   • Portal micomercio.maspagos.com.ar → panel de comercio
 *   • Terminales POS / QR estático / QR dinámico (presenciales)
 *
 * Para integración vía API (creación programática de links + webhooks)
 * se DEBE contactar a Nación Servicios S.A.:
 *   – Email:    info@maspagos.com.ar
 *   – Tel.:     +54 11 5405-1110 / 0810-444-0148
 *   – Portal comercio: https://micomercio.maspagos.com.ar
 *
 * IMPLEMENTACIÓN ACTUAL:
 * ─────────────────────
 * Dado que no existe API pública, se implementa el flujo "Link Manual":
 *   1. Cliente elige productos → hace checkout → selecciona +Pagos Nación
 *   2. El sistema crea el pedido en BD con status 'pending'
 *   3. El admin genera el Link de Pago desde la app / portal y lo pega
 *      en el panel de administración
 *   4. El sistema envía el link al cliente (copiable o por email si configurado)
 *   5. El admin confirma el pago manualmente en el panel → status 'paid'
 *      → descuento automático de stock
 *
 * PRÓXIMOS PASOS CUANDO SE OBTENGA API ACCESS:
 * ────────────────────────────────────────────
 *   • MASPAGOS_API_KEY           → Bearer token de la API privada
 *   • MASPAGOS_MERCHANT_ID       → ID de comercio en Nación Servicios
 *   • MASPAGOS_WEBHOOK_SECRET    → Para validar firmas HMAC de webhooks
 *   • Implementar: POST /api/maspagos/create-link → llama API de MasPagos
 *   • Implementar: POST /api/maspagos/webhook     → recibe notificaciones
 */

export const MASPAGOS_CONFIG = {
    /** Nombre del proveedor para mostrar en UI */
    DISPLAY_NAME: '+Pagos Nación',
    /** Clave interna usada en BD */
    PROVIDER_KEY: 'maspagos' as const,
    /** URL del portal de comercio donde se generan links manuales */
    MERCHANT_PORTAL: 'https://micomercio.maspagos.com.ar',
    /** URL pública del sitio */
    PUBLIC_SITE: 'https://maspagos.com.ar',
    /** Email de contacto para integraciones */
    CONTACT_EMAIL: 'info@maspagos.com.ar',
    /** Método de pago disponible sin API */
    AVAILABLE_METHOD: 'Link de Pago (manual)',
    /** Comisión de referencia Link de Pago (sujeta a cambios) */
    FEE_REFERENCE: '3% con acreditación ~18 días hábiles',
    /** Variables de entorno necesarias para futura integración API */
    ENV_VARS_REQUIRED: [
        'MASPAGOS_API_KEY',
        'MASPAGOS_MERCHANT_ID',
        'MASPAGOS_WEBHOOK_SECRET',
    ],
}

/** Verifica si hay credenciales de API configuradas (para futura integración) */
export function hasMasPagosApiCredentials(): boolean {
    return !!(
        process.env.MASPAGOS_API_KEY &&
        process.env.MASPAGOS_MERCHANT_ID
    )
}

/** Acceso a variables de entorno con advertencia en desarrollo */
export function getMasPagosEnvVars() {
    if (process.env.NODE_ENV === 'development' && !hasMasPagosApiCredentials()) {
        console.warn(
            '[MasPagos] API credentials not configured. ' +
            'Running in manual link mode. ' +
            'Contact info@maspagos.com.ar for API access.'
        )
    }
    return {
        apiKey: process.env.MASPAGOS_API_KEY ?? null,
        merchantId: process.env.MASPAGOS_MERCHANT_ID ?? null,
        webhookSecret: process.env.MASPAGOS_WEBHOOK_SECRET ?? null,
    }
}

/** Valida el formato básico de un Link de Pago de +Pagos (URL pago.maspagos o similar) */
export function isValidMasPagosPaymentLink(url: string): boolean {
    try {
        const parsed = new URL(url)
        // Acepta links de maspagos.com.ar o cualquier HTTPS válido (el comercio puede usar redirect)
        return (
            parsed.protocol === 'https:' &&
            parsed.hostname.length > 0
        )
    } catch {
        return false
    }
}
