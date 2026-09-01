import { Category } from './category'

export interface Product {
  id: string
  name: string
  price: number
  category_id: string | null
  stock_actual: number
  stock_minimo: number
  created_at: string
  updated_at: string
}

export interface ProductWithCategory extends Product {
  category: Category | null
}

export interface StockMovement {
  id: string
  product_id: string
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  motivo: string | null
  usuario_id: string | null
  created_at: string
}

export interface StockAdjustment {
  product_id: string
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  motivo?: string
}

export type StockStatus = 'normal' | 'bajo' | 'critico' | 'sin_stock'

export function getStockStatus(product: Product): StockStatus {
  if (product.stock_actual <= 0) return 'sin_stock'
  if (product.stock_actual <= product.stock_minimo) return 'critico'
  if (product.stock_actual <= product.stock_minimo * 2) return 'bajo'
  return 'normal'
}

export function getStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case 'sin_stock': return 'Sin stock'
    case 'critico': return 'Crítico'
    case 'bajo': return 'Bajo'
    case 'normal': return 'Normal'
  }
}

export function getStockStatusColor(status: StockStatus): string {
  switch (status) {
    case 'sin_stock': return 'bg-red-500/20 text-red-500 dark:bg-red-900/30 dark:text-red-400'
    case 'critico': return 'bg-orange-500/20 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400'
    case 'bajo': return 'bg-yellow-500/20 text-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'normal': return 'bg-green-500/20 text-green-500 dark:bg-green-900/30 dark:text-green-400'
  }
}

export function getStockStatusBorder(status: StockStatus): string {
  switch (status) {
    case 'sin_stock': return 'border-red-500'
    case 'critico': return 'border-orange-500'
    case 'bajo': return 'border-yellow-500'
    case 'normal': return 'border-green-500'
  }
}