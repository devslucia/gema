'use client'

import { Product } from '@/types/product'
import { Category } from '@/types/category'
import { Package, Sparkles } from 'lucide-react'
import { formatPriceARS } from '@/lib/utils'
import ProductSection from './ProductSection'

export interface ProductsByCategory {
  category: { id: string; name: string } | null
  products: Product[]
}

interface ProductListProps {
  productsByCategory: ProductsByCategory[]
  flatProducts?: Product[]
  categories: Category[]
  isLoading?: boolean
  totalProducts?: number
  categoryFilter?: string
  searchQuery?: string
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
  flatProducts = [],
  categories,
  isLoading,
  totalProducts,
  categoryFilter = 'all',
  searchQuery = ''
}: ProductListProps) {
  const isSearchActive = searchQuery.trim().length > 0
  const isFiltered = categoryFilter !== 'all'
  const maxProducts = isFiltered ? Infinity : 4
  const totalProductCount = productsByCategory.reduce((acc, group) => acc + group.products.length, 0) + flatProducts.length

  if (isLoading) {
    return <ProductListSkeleton />
  }

  if (totalProductCount === 0) {
    const message = isSearchActive 
      ? `No se encontraron resultados para ${'"'}${searchQuery}${'"'}`
      : 'No hay productos todavía'
    const description = isSearchActive
      ? 'Probá con otras palabras o contactános para más información'
      : 'Explora nuestro catálogo pronto o contactános para más información'

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
          {message}
        </h3>
        <p className="text-body text-text-secondary-light dark:text-text-secondary-dark max-w-sm mx-auto">
          {description}
        </p>
      </div>
    )
  }

  return (
    <div>
      {isSearchActive && flatProducts.length > 0 && (
        <div className="mb-8 animate-fade-in">
          <p className="text-subheading text-text-primary-light dark:text-text-primary-dark mb-6">
            Resultados para &ldquo;{searchQuery}&rdquo; <span className="text-text-secondary-light dark:text-text-secondary-dark font-normal">({totalProducts} {totalProducts === 1 ? 'producto' : 'productos'})</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {flatProducts.map((product, index) => (
              <article
                key={product.id}
                className="card card-hover group animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <h3 className="text-subheading font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                  {product.name}
                </h3>
                <p className="text-display text-primary mb-4 font-bold">
                  {formatPriceARS(product.price)}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}

      {!isSearchActive && productsByCategory.map((group, index) => (
        <ProductSection
          key={group.category?.id || 'uncategorized'}
          category={group.category}
          products={group.products}
          categories={categories}
          categoryIndex={index}
          maxProducts={maxProducts}
        />
      ))}

      {totalProducts !== undefined && totalProducts > 0 && !isSearchActive && (
        <p className="text-center text-caption text-text-secondary-light dark:text-text-secondary-dark mt-6 pt-6 border-t border-surface-light dark:border-dark-200">
          Total: {totalProducts} {totalProducts === 1 ? 'producto' : 'productos'}
        </p>
      )}
    </div>
  )
}