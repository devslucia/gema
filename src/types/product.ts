import { Category } from './category'

export interface StockMovement {
  id: string
  product_id: string
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  motivo?: string | null
  created_at: string
  created_by: string | null
}

export interface Product {
  id: string
  name: string
  price: number
  stock_actual: number
  stock_minimo: number
  category_id: string | null
  created_at: string
  updated_at?: Date | string | null
}

export interface ProductWithCategory extends Product {
  category: Category | null
}

export type StockStatus = 'sin_stock' | 'bajo' | 'critico' | 'ok'

export interface StockAdjustment {
  product_id: string
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  motivo?: string
}

export function getStockStatus(product: Product): StockStatus {
  const stock = product.stock_actual ?? 0
  const stockMinimo = product.stock_minimo ?? 5
  if (stock === 0) return 'sin_stock'
  if (stock <= stockMinimo * 0.3) return 'critico'
  if (stock <= stockMinimo) return 'bajo'
  return 'ok'
}

export function getStockStatusLabel(stockStatus: StockStatus): string {
  const labels: Record<StockStatus, string> = {
    sin_stock: 'Sin stock',
    critico: 'Crítico',
    bajo: 'Bajo stock',
    ok: 'Suficiente'
  }
  return labels[stockStatus]
}

export function getStockStatusColor(stockStatus: StockStatus): string {
  const colors: Record<StockStatus, string> = {
    sin_stock: 'text-red-500',
    critico: 'text-orange-500',
    bajo: 'text-yellow-500',
    ok: 'text-green-500'
  }
  return colors[stockStatus]
}

export interface Order {
  id: string
  user_id: string | null
  status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  total: number
  mp_preference_id: string | null
  mp_payment_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  created_at: string
  updated_at: string | null
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  unit_price: number
  quantity: number
  subtotal: number
}

export interface CartItem {
  product_id: string
  product_name: string
  price: number
  quantity: number
  subtotal: number
}