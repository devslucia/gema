'use client'

import { Product } from '@/types/product'
import { Category } from '@/types/category'
import { formatPriceARS } from '@/lib/utils'

interface ProductSectionProps {
  category: { id: string; name: string } | null
  products: Product[]
  categories: Category[]
  categoryIndex: number
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

export default function ProductSection({
  category,
  products,
  categoryIndex,
}: ProductSectionProps) {
  const categoryName = category?.name || 'Sin categoría'
  const colorClass = getCategoryColor(categoryIndex)

  return (
    <section className="mb-12 last:mb-0 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-heading text-text-primary-light dark:text-text-primary-dark">
          {categoryName}
        </h2>
        <span className={`badge ${colorClass}`}>
          {products.length} {products.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
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
            <span className={`badge ${colorClass}`}>
              {categoryName}
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}