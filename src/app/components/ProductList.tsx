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
    <div className="bg-white dark:bg-dark-100 rounded-xl shadow-md p-6 border border-gray-100 dark:border-dark-200 animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-dark-200 rounded w-3/4 mb-3" />
      <div className="h-8 bg-gray-200 dark:bg-dark-200 rounded w-1/2 mb-3" />
      <div className="h-6 bg-gray-200 dark:bg-dark-200 rounded w-24" />
    </div>
  )
}

function ProductListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      <div className="text-center py-16">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-gray-100 dark:bg-dark-200">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">No se encontraron productos</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Intenta con otros términos de búsqueda</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white dark:bg-dark-100 rounded-xl shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 p-6 border border-gray-100 dark:border-dark-200 hover:border-primary/50"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
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
        </div>
      ))}
    </div>
  )
}
