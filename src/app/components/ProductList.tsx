import { Product } from '@/types/product'
import { Category } from '@/types/category'
import { formatPriceARS } from '@/lib/utils'
import { Package, Sparkles } from 'lucide-react'

interface ProductListProps {
  products: Product[]
  categories: Category[]
  isLoading?: boolean
}

function ProductCardSkeleton() {
  return (
    <div className="card skeleton h-48" />
  )
}

function ProductListSkeleton() {
  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
      aria-label="Cargando productos..."
    >
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
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      role="list"
      aria-label="Lista de productos"
    >
      {products.map((product, index) => (
        <article
          key={product.id}
          className="card card-hover group cursor-pointer animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
          role="listitem"
        >
          <h3 className="text-subheading font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h3>
          <p className="text-display text-primary mb-4 font-bold">
            {formatPriceARS(product.price)}
          </p>
          <span className={`badge ${getCategoryColor(product.category_id)}`}>
            {getCategoryName(product.category_id)}
          </span>
        </article>
      ))}
    </div>
  )
}