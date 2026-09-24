'use client'

import { Product } from '@/types/product'

interface ProductStockInfoProps {
  product: Product
  onStockAction: (productId: string, type: 'entry' | 'exit' | 'adjustment') => void
}

export default function ProductStockInfo({
  product,
  onStockAction,
}: ProductStockInfoProps) {
  const stock = product.stock_actual ?? 0
  const stockMinimo = product.stock_minimo ?? 5
  const isLowStock = stock <= stockMinimo && stock > 0

  return (
    <div className="flex items-center gap-3">
      <span className="text-caption text-text-secondary-light dark:text-text-secondary-dark">
        Stock: {stock}
      </span>
      <span className={`badge ${isLowStock ? 'bg-red-100 text-red-800' : 'bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-100'}`}>
        {stock}
      </span>
      {isLowStock && (
        <span className="text-xs text-red-600 dark:text-red-400">
          ⚠ Bajo stock
        </span>
      )}
      <div className="hidden sm:block flex items-center gap-1.5">
        <span className="text-caption text-text-secondary-light dark:text-text-secondary-dark">/{stockMinimo}</span>
      </div>
      <button
        onClick={() => onStockAction(product.id, 'entry')}
        className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors duration-150 touch-target"
        title="Entrar stock"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6l4 2"
          />
        </svg>
      </button>
      <button
        onClick={() => onStockAction(product.id, 'exit')}
        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors duration-150 touch-target"
        title="Salir stock"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L6 6m0 0L12 6m-6 12L12 6m0 0L6 18"
          />
        </svg>
      </button>
      <button
        onClick={() => onStockAction(product.id, 'adjustment')}
        className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors duration-150 touch-target"
        title="Ajustar stock"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6l4 2"
          />
        </svg>
      </button>
    </div>
  )
}