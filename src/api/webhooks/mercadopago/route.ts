import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, data: paymentData } = body

    // Mercado Pago envía notificaciones con diferentes tipos
    // Nos interesa el pago aprobado
    if (type !== 'payment' || !paymentData || paymentData.status !== 'approved') {
      return NextResponse.json({ received: true, status: 'ignored' })
    }

    const paymentId = paymentData.id
    const orderId = paymentData.external_reference as string

    if (!orderId) {
      return NextResponse.json({ error: 'No external_reference en el webhook' }, { status: 400 })
    }

    // Buscar la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Orden no encontrada en webhook:', orderError)
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // Si ya está pagado, ignorar
    if (order.status === 'paid') {
      return NextResponse.json({ status: 'already_paid' })
    }

    // Actualizar orden a 'paid' y agregar ID de pago de Mercado Pago
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        mp_payment_id: paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      throw updateError
    }

    // Descontar stock automáticamente por cada item
    for (const item of order.order_items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_actual')
        .eq('id', item.product_id)
        .single()

      if (productError || !product) {
        continue
      }

      const currentStock = product.stock_actual as number
      if (currentStock >= item.quantity) {
        await supabase
          .from('products')
          .update({ stock_actual: currentStock - item.quantity })
          .eq('id', item.product_id)

        // Registrar movimiento de stock de tipo 'salida' por la venta
        await supabase.from('stock_movements').insert({
          id: crypto.randomUUID(),
          product_id: item.product_id,
          tipo: 'salida',
          cantidad: item.quantity,
          stock_anterior: currentStock,
          stock_nuevo: currentStock - item.quantity,
          motivo: 'Venta - Pedido #' + orderId,
          created_by: user.id,
        })
      } else {
        // Stock insuficiente - registrar error pero no detener el proceso
        console.error(
          `Stock insuficiente para producto ${item.product_id} en webhook. Solicitado: ${item.quantity}, Disponible: ${currentStock}`
        )
      }
    }

    return NextResponse.json({ status: 'success', order: order.id })
  } catch (error) {
    const err = error as Error
    console.error('Error processing Mercado Pago webhook:', err)
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}