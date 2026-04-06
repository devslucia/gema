'use client'

import { Product } from '@/types/product'
import { formatPriceARS } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

interface SearchResultGroup {
  products: Product[]
  category: { id: string; name: string } | null
}

interface SearchDropdownProps {
  results: SearchResultGroup[]
  query: string
  isLoading: boolean
}

const getCategoryColor = (index: number) => {
  const colors = [
    'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
    'bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-100',
    'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
    'bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-100',
    'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
  ]
  return colors[index % 5]
}

export default function SearchDropdown({
  results,
  query,
  isLoading,
}: SearchDropdownProps) {
  const searchParams = useSearchParams()

  const handleProductClick = () => {
    const params = new URLSearchParams(searchParams)
    params.set('q', query)
    window.location.href = `/?${params.toString()}`
  }

  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 card shadow-elevation-3 z-50 p-4">
        <div className="flex items-center justify-center gap-2 text-text-secondary-light dark:text-text-secondary-dark">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Buscando...</span>
        </div>
      </div>
    )
  }

  if (results.length === 0 && query.trim()) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 card shadow-elevation-3 z-50 p-6 text-center">
        <p className="text-body text-text-secondary-light dark:text-text-secondary-dark">
          No se encontraron productos para <span className="font-semibold text-primary">&ldquo;{query}&rdquo;</span>
        </p>
      </div>
    )
  }

  if (results.length === 0) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-2 card shadow-elevation-3 z-50 max-h-96 overflow-y-auto">
      {results.map((group, groupIndex) => (
        <div key={group.category?.id || 'uncategorized'} className="border-b border-surface-light dark:border-dark-200 last:border-b-0">
          <div className="px-4 py-3 bg-surface-light dark:bg-dark-200/50 sticky top-0">
            <h3 className={`badge ${getCategoryColor(groupIndex)}`}>
              {group.category?.name || 'Sin categoría'}
            </h3>
          </div>
          <ul>
            {group.products.map((product) => (
              <li key={product.id}>
                <button
                  onClick={handleProductClick}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors duration-150 text-left"
                >
                  <span className="text-body text-text-primary-light dark:text-text-primary-dark font-medium">
                    {product.name}
                  </span>
                  <span className="text-body font-semibold text-primary">
                    {formatPriceARS(product.price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}