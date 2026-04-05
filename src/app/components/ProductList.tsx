import { Product } from '@/types/product'
import { Category } from '@/types/category'
import { formatPriceARS } from '@/lib/utils'
import { Package } from 'lucide-react'

interface ProductListProps {
  products: Product[]
  categories: Category[]
  isLoading?: boolean
}

function ProductCardSkeleton() {
  return (
    <div className="bg-surface-light dark:bg-dark-100 rounded-xl shadow-md p-6 border border-surface-light dark:border-dark-200 animate-pulse">
      <div className="h-5 bg-surface-light dark:bg-dark-200 rounded w-3/4 mb-3" />
      <div className="h-8 bg-surface-light dark:bg-dark-200 rounded w-1/2 mb-3" />
      <div className="h-6 bg-surface-light dark:bg-dark-200 rounded w-24" />
    </div>
  )
}

function ProductListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" aria-label="Cargando productos...">
      {[...Array(8)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default function ProductList({ products, categories, isLoading }: ProductListProps) {
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sin categoría'
    const category = categories.find(c => c.id === categoryId)
    return category?.name || 'Desconocida'
  }

  const getCategoryColor = (categoryId: string | null) => {
    const category = categories.find(c => c.id === categoryId)
    const colorIndex = categories.indexOf(category!) % 5
    const colors = [
      'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
      'bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-100',
      'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
      'bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-100',
      'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
    ]
    return colors[colorIndex] || colors[0]
  }

  if (isLoading) {
    return <ProductListSkeleton />
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16" role="status" aria-live="polite">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-surface-light dark:bg-dark-100">
            <Package className="w-12 h-12 text-text-secondary-light dark:text-text-secondary-dark" aria-hidden="true" />
          </div>
        </div>
        <p className="text-text-secondary-light dark:text-text-secondary-dark text-lg">No se encontraron productos</p>
        <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-2">Intenta con otros términos de búsqueda</p>
      </div>
    )
  }

  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      role="list"
      aria-label="Lista de productos"
    >
      {products.map((product) => (
        <article
          key={product.id}
          className="bg-surface-light dark:bg-dark-100 rounded-xl shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 p-6 border border-surface-light dark:border-dark-200 hover:border-primary/50"
          role="listitem"
        >
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-2xl font-bold text-primary mb-3">
            {formatPriceARS(product.price)}
          </p>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(product.category_id)}`}
          >
            {getCategoryName(product.category_id)}
          </span>
        </article>
      ))}
    </div>
  )
}
