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
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleCategoryClick('all')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          defaultValue === 'all'
            ? 'bg-primary text-white shadow-lg shadow-primary/30'
            : 'bg-white dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-primary/10 hover:text-primary border border-gray-200 dark:border-dark-200'
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            defaultValue === category.id
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'bg-white dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-primary/10 hover:text-primary border border-gray-200 dark:border-dark-200'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}