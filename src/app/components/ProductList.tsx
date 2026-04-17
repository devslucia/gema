'use client'

import { useState } from 'react'
import { Product } from '@/types/product'
import { Category } from '@/types/category'
import { Package, Sparkles, X, MapPin } from 'lucide-react'
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isSearchActive = searchQuery.trim().length > 0
  const isFiltered = categoryFilter !== 'all'
  const maxProducts = isFiltered ? Infinity : 4
  const totalProductCount = productsByCategory.reduce((acc, group) => acc + group.products.length, 0) + flatProducts.length

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sin categoría'
    const cat = categories.find(c => c.id === categoryId)
    return cat?.name || 'Sin categoría'
  }

  const getCategoryColor = (categoryId: string | null) => {
    const cat = categories.find(c => c.id === categoryId)
    const colorIndex = categories.indexOf(cat!) % 5
    const colors = [
      'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
      'bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-100',
      'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
      'bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-100',
      'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
    ]
    return colors[colorIndex] || colors[0]
  }

  const openModal = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

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
            {flatProducts.map((product, index) => {
              const category = categories.find(c => c.id === product.category_id)
              return (
                <article
                  key={product.id}
                  onClick={() => openModal(product)}
                  className="card card-hover group animate-slide-up relative cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <h3 className="text-subheading font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                    {product.name}
                  </h3>
                  <p className="text-display text-primary mb-3 font-bold">
                    {formatPriceARS(product.price)}
                  </p>
                  {category && (
                    <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-100">
                      {category.name}
                    </span>
                  )}
                </article>
              )
            })}
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

      {isModalOpen && selectedProduct && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <div className="card max-w-md w-full shadow-elevation-4 animate-scale-in">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-surface-light dark:border-dark-200">
              <h2 id="product-modal-title" className="text-heading text-text-primary-light dark:text-text-primary-dark">
                Detalle del Producto
              </h2>
              <button 
                onClick={closeModal} 
                className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-surface-light dark:hover:bg-dark-200 rounded-lg transition-colors duration-150 touch-target"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Nombre</p>
                <p className="text-body font-medium text-text-primary-light dark:text-text-primary-dark">{selectedProduct.name}</p>
              </div>
              <div>
                <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Precio</p>
                <p className="text-body font-semibold text-primary">{formatPriceARS(selectedProduct.price)}</p>
              </div>
              <div>
                <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Categoría</p>
                <span className={`badge ${getCategoryColor(selectedProduct.category_id)}`}>
                  {getCategoryName(selectedProduct.category_id)}
                </span>
              </div>
              <div>
                <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Ubicación</p>
                <a
                  href="https://www.google.com/maps/search/Av.+Bartolomé+Mitre+1772"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline cursor-pointer touch-target"
                >
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  Av. Bartolomé Mitre 1772
                </a>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="btn-primary flex-1"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}