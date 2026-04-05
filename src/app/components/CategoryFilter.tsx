'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Category } from '@/types/category'

interface CategoryFilterProps {
  defaultValue: string
  categories: Category[]
}

export default function CategoryFilter({ defaultValue, categories }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams(searchParams)
    if (categoryId === 'all') {
      params.delete('category')
    } else {
      params.set('category', categoryId)
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <div 
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filtrar por categoría"
    >
      <button
        onClick={() => handleCategoryClick('all')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          defaultValue === 'all'
            ? 'bg-primary text-white shadow-lg shadow-primary/30'
            : 'bg-surface-light dark:bg-dark-100 text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/10 hover:text-primary border border-surface-light dark:border-dark-200'
        }`}
        aria-pressed={defaultValue === 'all'}
      >
        Todos
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            defaultValue === category.id
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'bg-surface-light dark:bg-dark-100 text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/10 hover:text-primary border border-surface-light dark:border-dark-200'
          }`}
          aria-pressed={defaultValue === category.id}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
