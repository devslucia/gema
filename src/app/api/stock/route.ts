import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { StockAdjustment } from '@/types/product'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body: StockAdjustment = await request.json()
    const { product_id, tipo, cantidad, motivo } = body

    if (!product_id || !tipo || !cantidad || cantidad <= 0) {
      return NextResponse.json(
        { error: 'Datos inválidos: product_id, tipo y cantidad (positivo) son requeridos' },
        { status: 400 }
      )
    }

    if (!['entrada', 'salida', 'ajuste'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo inválido. Debe ser: entrada, salida o ajuste' },
        { status: 400 }
      )
    }

    // Get current product stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, stock_actual, stock_minimo')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const stockAnterior = product.stock_actual
    let stockNuevo: number

    switch (tipo) {
      case 'entrada':
        stockNuevo = stockAnterior + cantidad
        break
      case 'salida':
        stockNuevo = stockAnterior - cantidad
        if (stockNuevo < 0) {
          return NextResponse.json(
            { error: `Stock insuficiente. Stock actual: ${stockAnterior}, intentando restar: ${cantidad}` },
            { status: 400 }
          )
        }
        break
      case 'ajuste':
        stockNuevo = cantidad // For ajuste, cantidad is the new absolute value
        break
      default:
        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    // Update product stock
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        stock_actual: stockNuevo,
        updated_at: new Date().toISOString()
      })
      .eq('id', product_id)
      .select()
      .single()

    if (updateError) {
      console.error('Supabase update error:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      })
      return NextResponse.json({ 
        error: 'Error al actualizar stock', 
        details: updateError.message 
      }, { status: 500 })
    }

    // Record stock movement
    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        product_id,
        tipo,
        cantidad: tipo === 'ajuste' ? stockNuevo - stockAnterior : cantidad,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        motivo: motivo || null,
        usuario_id: user.id
      })

    if (movementError) {
      console.error('Supabase movement insert error:', {
        message: movementError.message,
        details: movementError.details,
        hint: movementError.hint,
        code: movementError.code
      })
      // Don't fail the request if movement logging fails
    }

    return NextResponse.json({
      product: updatedProduct,
      movement: {
        tipo,
        cantidad: tipo === 'ajuste' ? stockNuevo - stockAnterior : cantidad,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        motivo
      }
    })
  } catch (error) {
    console.error('Stock adjustment error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        product:products!inner(name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Get stock movements error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}