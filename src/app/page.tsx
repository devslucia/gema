import { getProductsPaginated, getCategories } from '@/lib/supabase/pagination'
import ProductList from './components/ProductList'
import SearchBar from './components/SearchBar'
import CategoryFilter from './components/CategoryFilter'
import { Category } from '@/types/category'

export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>
}) {
  const { q, category, page } = await searchParams

  const currentPage = page ? parseInt(page, 10) : 1

  const [paginatedResult, categories] = await Promise.all([
    getProductsPaginated({
      page: currentPage,
      limit: 8,
      search: q,
      category: category || 'all',
    }),
    getCategories(),
  ])

  const typedCategories = categories as Category[]

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <SearchBar defaultValue={q || ''} />
        <CategoryFilter 
          defaultValue={category || 'all'} 
          categories={typedCategories}
        />
      </div>

      <ProductList 
        products={paginatedResult.data} 
        categories={typedCategories}
        hasMore={paginatedResult.hasMore}
        currentPage={currentPage}
        totalProducts={paginatedResult.total}
      />
    </main>
  )
}