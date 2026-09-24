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
  stock: number
  stock_minimo: number
  category_id: string | null
  created_at: string
}

export interface ProductWithCategory extends Product {
  category: Category | null
}