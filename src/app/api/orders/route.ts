import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 411 })
  }

  try {
    const body = await request.json()
    const { items, customerName, customerEmail, customerPhone } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No hay items en el pedido' }, { status: 400 })
    }

    // Calculate total and prepare order items
    let total = 0
    const orderItems = await Promise.all(items.map(async (item) => {
      // Obtener producto actual para obtener precio
      const { data: product } = await supabase
        .from('products')
        .select('id, name, price, stock_actual, stock_minimo')
        .eq('id', item.product_id)
        .single()

      if (!product) {
        throw new Error(`Producto ${item.product_id} no encontrado`)
      }

      const subtotal = product.price * item.quantity
      total += subtotal

      return {
        id: crypto.randomUUID(),
        product_id: item.product_id,
        product_name: product.name,
        unit_price: product.price,
        quantity: item.quantity,
        subtotal,
      }
    }))

    // Crear la orden con status 'pending'
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        total,
        customer_name: customerName || '',
        customer_email: customerEmail || '',
        customer_phone: customerPhone || '',
      })
      .select()
      .single()

    if (orderError) {
      throw orderError
    }

    // Insertar items de la orden (sin descuentar stock todavía)
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId)

    if (itemsError) {
      // Intentar borrar la orden si falla el insert de items
      await supabase.from('orders').delete().eq('id', order.id)
      throw itemsError
    }

    // No descuentar stock aquí - se hará en el webhook al confirmar el pago
    // Esto evita descuentos dobles si el pago es aprobado

    return NextResponse.json({ order, items: orderItemsWithOrderId }, { status: 201 })
  } catch (error) {
    const err = error as Error
    console.error('Error creating order:', err)
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}