import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/maspagos/orders
 *
 * Crea un pedido con payment_provider = 'maspagos'.
 * En el flujo actual (sin API privada), el link de pago se agrega después
 * desde el panel de admin o se puede pasar opcionalmente en el body.
 *
 * Body esperado:
 * {
 *   items: Array<{ product_id: string; quantity: number }>
 *   customerName:  string
 *   customerEmail: string
 *   customerPhone?: string
 *   paymentLink?:  string   // Si el admin ya tiene el link listo
 *   paymentNotes?: string   // Notas internas del pedido
 * }
 */
export async function POST(request: Request) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const {
            items,
            customerName,
            customerEmail,
            customerPhone,
            paymentLink,
            paymentNotes,
        } = body as {
            items: Array<{ product_id: string; quantity: number }>
            customerName: string
            customerEmail: string
            customerPhone?: string
            paymentLink?: string
            paymentNotes?: string
        }

        // Validación básica
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'No hay ítems en el pedido' },
                { status: 400 }
            )
        }

        if (!customerName?.trim() || !customerEmail?.trim()) {
            return NextResponse.json(
                { error: 'Nombre y email del cliente son requeridos' },
                { status: 400 }
            )
        }

        // Obtener productos y calcular total
        let total = 0
        const orderItems: Array<{
            id: string
            product_id: string
            product_name: string
            unit_price: number
            quantity: number
            subtotal: number
        }> = []

        for (const item of items) {
            if (!item.product_id || !item.quantity || item.quantity <= 0) {
                return NextResponse.json(
                    { error: `Ítem inválido: product_id y quantity son requeridos` },
                    { status: 400 }
                )
            }

            const { data: product, error: productError } = await supabase
                .from('products')
                .select('id, name, price, stock_actual')
                .eq('id', item.product_id)
                .single()

            if (productError || !product) {
                return NextResponse.json(
                    { error: `Producto ${item.product_id} no encontrado` },
                    { status: 404 }
                )
            }

            // Verificar stock disponible
            if (product.stock_actual < item.quantity) {
                return NextResponse.json(
                    {
                        error: `Stock insuficiente para "${product.name}". ` +
                            `Disponible: ${product.stock_actual}, solicitado: ${item.quantity}`,
                    },
                    { status: 409 }
                )
            }

            const subtotal = product.price * item.quantity
            total += subtotal

            orderItems.push({
                id: crypto.randomUUID(),
                product_id: item.product_id,
                product_name: product.name,
                unit_price: product.price,
                quantity: item.quantity,
                subtotal,
            })
        }

        // Crear la orden con status 'pending' y payment_provider = 'maspagos'
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                status: 'pending',
                total,
                payment_provider: 'maspagos',
                payment_link: paymentLink?.trim() || null,
                payment_notes: paymentNotes?.trim() || null,
                external_payment_id: null, // Se completa cuando el admin confirma el pago
                customer_name: customerName.trim(),
                customer_email: customerEmail.trim(),
                customer_phone: customerPhone?.trim() || null,
            })
            .select()
            .single()

        if (orderError) {
            throw orderError
        }

        // Insertar ítems de la orden
        const orderItemsWithOrderId = orderItems.map((item) => ({
            ...item,
            order_id: order.id,
        }))

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsWithOrderId)

        if (itemsError) {
            // Rollback: eliminar la orden si falla inserción de ítems
            await supabase.from('orders').delete().eq('id', order.id)
            throw itemsError
        }

        return NextResponse.json(
            {
                order,
                items: orderItemsWithOrderId,
                message:
                    paymentLink
                        ? 'Pedido creado con Link de Pago adjunto.'
                        : 'Pedido creado. Un administrador generará el Link de Pago y se lo enviará.',
            },
            { status: 201 }
        )
    } catch (error) {
        const err = error as Error
        console.error('[MasPagos] Error creating order:', err)
        return NextResponse.json(
            { error: err.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
