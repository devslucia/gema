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
            ? 'bg-blue-600 text-white dark:bg-blue-500'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
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
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}