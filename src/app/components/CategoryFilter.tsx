'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Category } from '@/types/category'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CategoryFilterProps {
  defaultValue: string
  categories: Category[]
}

const MAX_VISIBLE_CATEGORIES = 6

export default function CategoryFilter({ defaultValue, categories }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAll, setShowAll] = useState(false)

  const visibleCategories = showAll ? categories : categories.slice(0, MAX_VISIBLE_CATEGORIES)
  const hasMore = categories.length > MAX_VISIBLE_CATEGORIES

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
      className="flex gap-3 items-center overflow-x-auto pb-2 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none]"
      role="group"
      aria-label="Filtrar por categoría"
    >
      <button
        onClick={() => handleCategoryClick('all')}
        className={`flex-shrink-0 px-5 py-2.5 rounded-lg text-body font-medium transition-all duration-200 ease-smooth touch-target focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          defaultValue === 'all'
            ? 'bg-primary text-white shadow-elevation-2 hover:scale-[1.02] active:scale-[0.98]'
            : 'bg-surface-light dark:bg-dark-100 text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20'
        }`}
        aria-pressed={defaultValue === 'all'}
      >
        Todos
      </button>
      
      {visibleCategories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className={`flex-shrink-0 px-5 py-2.5 rounded-lg text-body font-medium transition-all duration-200 ease-smooth touch-target focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            defaultValue === category.id
              ? 'bg-primary text-white shadow-elevation-2 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-surface-light dark:bg-dark-100 text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20'
          }`}
          aria-pressed={defaultValue === category.id}
        >
          {category.name}
        </button>
      ))}
      
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex-shrink-0 px-4 py-2.5 rounded-lg text-body font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors duration-200 ease-smooth touch-target flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-expanded={showAll}
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Ver menos
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Ver más ({categories.length - MAX_VISIBLE_CATEGORIES})
            </>
          )}
        </button>
      )}
    </div>
  )
}