'use client'

import { Product } from '@/types/product'
import { Category } from '@/types/category'
import { Package, Sparkles } from 'lucide-react'
import ProductSection from './ProductSection'

export interface ProductsByCategory {
  category: { id: string; name: string } | null
  products: Product[]
}

interface ProductListProps {
  productsByCategory: ProductsByCategory[]
  categories: Category[]
  isLoading?: boolean
  totalProducts?: number
  maxProductsPerCategory?: number
}

function ProductListSkeleton() {
  return (
    <div className="space-y-10">
      {[...Array(3)].map((_, i) => (
        <div key={i}>
          <div className="skeleton h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="card skeleton h-48" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProductList({
  productsByCategory,
  categories,
  isLoading,
  totalProducts,
  maxProductsPerCategory = 4
}: ProductListProps) {
  const totalProductCount = productsByCategory.reduce((acc, group) => acc + group.products.length, 0)

  if (isLoading) {
    return <ProductListSkeleton />
  }

  if (totalProductCount === 0) {
    return (
      <div 
        className="text-center py-16 animate-fade-in" 
        role="status" 
        aria-live="polite"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="p-6 rounded-full bg-surface-light dark:bg-dark-100">
              <Package className="w-16 h-16 text-text-secondary-light dark:text-text-secondary-dark" />
            </div>
            <div className="absolute -top-1 -right-1 p-2 bg-primary/20 rounded-full animate-pulse-subtle">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
        <h3 className="text-heading text-text-primary-light dark:text-text-primary-dark mb-2">
          No hay productos todavía
        </h3>
        <p className="text-body text-text-secondary-light dark:text-text-secondary-dark max-w-sm mx-auto">
          Explora nuestro catálogo pronto o contactános para más información
        </p>
      </div>
    )
  }

  return (
    <div>
      {productsByCategory.map((group, index) => (
        <ProductSection
          key={group.category?.id || 'uncategorized'}
          category={group.category}
          products={group.products}
          categories={categories}
          categoryIndex={index}
          maxProducts={maxProductsPerCategory}
        />
      ))}

      {totalProducts !== undefined && totalProducts > 0 && (
        <p className="text-center text-caption text-text-secondary-light dark:text-text-secondary-dark mt-6 pt-6 border-t border-surface-light dark:border-dark-200">
          Total: {totalProducts} {totalProducts === 1 ? 'producto' : 'productos'}
        </p>
      )}
    </div>
  )
}