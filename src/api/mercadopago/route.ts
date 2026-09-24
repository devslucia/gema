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
    const { orderId, items } = body

    if (!orderId) {
      return NextResponse.json({ error: 'ID de orden requerido' }, { status: 400 })
    }

    // Obtener la orden y sus items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // Verificar que el pago aún no esté procesado
    if (order.status === 'paid') {
      return NextResponse.json({ error: 'Pago ya procesado' }, { status: 400 })
    }

    // Preparar items para Mercado Pago
    const mpItems = items.map((item: { product_id: string; product_name?: string; quantity: number; unit_price: number }) => ({
      id: item.product_id,
      title: item.product_name || 'Producto',
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))

    // Construir la preferencia de Mercado Pago
    const preferenceData = {
      items: mpItems,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'} /pago-exitoso`,
        failure: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'} /pago-fallido`,
        pending: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'} /pago-pendiente`,
      },
      notification_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'} /api/webhooks/mercadopago`,
      external_reference: orderId,
    }

    return NextResponse.json({ preference: preferenceData, order })
  } catch (error) {
    const err = error as Error
    console.error('Error creating Mercado Pago preference:', err)
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}