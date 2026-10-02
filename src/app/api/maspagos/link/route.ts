import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/maspagos/link
 *
 * Permite al admin agregar o actualizar el Link de Pago de un pedido pendiente.
 * También puede actualizar: externalPaymentId, paymentNotes, status
 *
 * Body:
 * {
 *   orderId:           string
 *   paymentLink?:     string
 *   externalPaymentId?: string
 *   paymentNotes?:    string
 *   status?:          'pending' | 'cancelled' | 'expired'
 * }
 */
export async function PATCH(request: NextRequest) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { orderId, paymentLink, externalPaymentId, paymentNotes, status } =
            body as {
                orderId: string
                paymentLink?: string
                externalPaymentId?: string
                paymentNotes?: string
                status?: 'pending' | 'cancelled' | 'expired'
            }

        if (!orderId) {
            return NextResponse.json({ error: 'orderId es requerido' }, { status: 400 })
        }

        // Verificar que el pedido existe y es de maspagos
        const { data: order } = await supabase
            .from('orders')
            .select('id, status, payment_provider')
            .eq('id', orderId)
            .single()

        if (!order) {
            return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
        }

        if (order.payment_provider !== 'maspagos') {
            return NextResponse.json(
                { error: 'El pedido no corresponde a +Pagos Nación' },
                { status: 400 }
            )
        }

        // No permitir modificar pedidos ya pagados
        if (order.status === 'paid') {
            return NextResponse.json(
                { error: 'No se puede modificar un pedido ya pagado' },
                { status: 409 }
            )
        }

        const validStatuses = ['pending', 'cancelled', 'expired']
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Estado inválido. Valores permitidos: ${validStatuses.join(', ')}` },
                { status: 400 }
            )
        }

        // Construir objeto de actualización dinámicamente
        const updatePayload: Record<string, string | null> = {}

        if (paymentLink !== undefined) {
            updatePayload.payment_link = paymentLink?.trim() || null
        }
        if (externalPaymentId !== undefined) {
            updatePayload.external_payment_id = externalPaymentId?.trim() || null
        }
        if (paymentNotes !== undefined) {
            updatePayload.payment_notes = paymentNotes?.trim() || null
        }
        if (status !== undefined) {
            updatePayload.status = status
            // Si se marca como expirado, registrar timestamp
            if (status === 'expired') {
                updatePayload.expired_at = new Date().toISOString()
            }
        }

        if (Object.keys(updatePayload).length === 0) {
            return NextResponse.json(
                { error: 'No se proporcionaron campos para actualizar' },
                { status: 400 }
            )
        }

        const { data: updatedOrder, error } = await supabase
            .from('orders')
            .update(updatePayload)
            .eq('id', orderId)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ order: updatedOrder })
    } catch (error) {
        const err = error as Error
        console.error('[MasPagos] Error updating order link:', err)
        return NextResponse.json(
            { error: err.message || 'Error interno' },
            { status: 500 }
        )
    }
}
