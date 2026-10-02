import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/maspagos/confirm
 *
 * Confirma manualmente el pago de un pedido +Pagos Nación.
 * Solo pueden hacerlo usuarios autenticados (admins).
 *
 * Flujo:
 *  1. Admin ve el pedido en su panel con status 'pending'
 *  2. Verifica el pago en la app o portal de +Pagos Nación
 *  3. Llama a este endpoint con el orderId y opcionalmente
 *     el external_payment_id (ID de transacción de MasPagos)
 *  4. El sistema cambia status → 'paid' y descuenta stock
 *
 * Body:
 * {
 *   orderId:           string  (UUID del pedido en GEMA)
 *   externalPaymentId?: string (ID de transacción en +Pagos Nación)
 *   paymentLink?:      string  (Link de pago si se agrega en este paso)
 * }
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { orderId, externalPaymentId, paymentLink } = body as {
            orderId: string
            externalPaymentId?: string
            paymentLink?: string
        }

        if (!orderId) {
            return NextResponse.json(
                { error: 'orderId es requerido' },
                { status: 400 }
            )
        }

        // Obtener la orden con sus ítems
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Pedido no encontrado' },
                { status: 404 }
            )
        }

        if (order.payment_provider !== 'maspagos') {
            return NextResponse.json(
                { error: 'Este pedido no corresponde al proveedor +Pagos Nación' },
                { status: 400 }
            )
        }

        if (order.status === 'paid') {
            return NextResponse.json(
                { error: 'El pedido ya fue confirmado como pagado' },
                { status: 409 }
            )
        }

        if (order.status === 'cancelled' || order.status === 'expired') {
            return NextResponse.json(
                { error: `No se puede confirmar un pedido con estado '${order.status}'` },
                { status: 400 }
            )
        }

        // ─── Descuento de stock (transaccional) ────────────────────────────────
        const orderItems = order.order_items as Array<{
            product_id: string
            product_name: string
            quantity: number
        }>

        const stockErrors: string[] = []

        for (const item of orderItems) {
            // Obtener stock actual
            const { data: product } = await supabase
                .from('products')
                .select('id, name, stock_actual')
                .eq('id', item.product_id)
                .single()

            if (!product) {
                stockErrors.push(`Producto ${item.product_id} no encontrado`)
                continue
            }

            const stockAnterior = product.stock_actual
            const stockNuevo = stockAnterior - item.quantity

            if (stockNuevo < 0) {
                stockErrors.push(
                    `Stock insuficiente para "${item.product_name}": ` +
                    `disponible ${stockAnterior}, necesario ${item.quantity}`
                )
                continue
            }

            // Actualizar stock del producto
            await supabase
                .from('products')
                .update({
                    stock_actual: stockNuevo,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', item.product_id)

            // Registrar movimiento de stock
            await supabase.from('stock_movements').insert({
                product_id: item.product_id,
                tipo: 'salida',
                cantidad: item.quantity,
                stock_anterior: stockAnterior,
                stock_nuevo: stockNuevo,
                motivo: `Venta +Pagos Nación — Pedido #${orderId.substring(0, 8)}`,
                usuario_id: user.id,
            })
        }

        // Si hubo errores de stock, registramos pero no bloqueamos la confirmación
        // (el pago ya fue recibido, el admin deberá ajustar stock manualmente)
        if (stockErrors.length > 0) {
            console.warn('[MasPagos] Stock errors during confirmation:', stockErrors)
        }

        // ─── Actualizar estado del pedido a 'paid' ────────────────────────────
        const updateData: Record<string, string | null> = {
            status: 'paid',
        }

        if (externalPaymentId) {
            updateData.external_payment_id = externalPaymentId.trim()
        }
        if (paymentLink) {
            updateData.payment_link = paymentLink.trim()
        }

        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId)
            .select()
            .single()

        if (updateError) {
            throw updateError
        }

        return NextResponse.json({
            order: updatedOrder,
            stockErrors: stockErrors.length > 0 ? stockErrors : undefined,
            message: `Pedido #${orderId.substring(0, 8)} confirmado como pagado.${stockErrors.length > 0
                    ? ' ⚠️ Hubo errores en el descuento de stock. Revisar manualmente.'
                    : ' Stock descontado correctamente.'
                }`,
        })
    } catch (error) {
        const err = error as Error
        console.error('[MasPagos] Error confirming payment:', err)
        return NextResponse.json(
            { error: err.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
