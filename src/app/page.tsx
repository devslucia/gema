import { getProductsGroupedByCategory, getCategories, searchProductsFlat } from '@/lib/supabase/pagination'
import ProductList from './components/ProductList'
import SearchBar from './components/SearchBar'
import CategoryFilter from './components/CategoryFilter'
import { Product } from '@/types/product'
import { Category } from '@/types/category'

export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>
}) {
  const { q, category } = await searchParams

  const isSearchActive = !!q

  let productsByCategory: { category: { id: string; name: string } | null; products: Product[] }[] = []
  let flatProducts: Product[] = []
  let totalProducts = 0
  let typedCategories: Category[] = []

  if (isSearchActive) {
    flatProducts = await searchProductsFlat(q!)
    totalProducts = flatProducts.length
    const categories = await getCategories()
    typedCategories = categories as Category[]
  } else {
    const [products, categories] = await Promise.all([
      getProductsGroupedByCategory(q, category || 'all'),
      getCategories(),
    ])
    productsByCategory = products
    typedCategories = categories as Category[]
    totalProducts = productsByCategory.reduce((acc, group) => acc + group.products.length, 0)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-4 mb-8">
        <SearchBar defaultValue={q || ''} />
        {!isSearchActive && (
          <CategoryFilter 
            defaultValue={category || 'all'} 
            categories={typedCategories}
          />
        )}
      </div>

      <ProductList 
        productsByCategory={isSearchActive ? [] : productsByCategory}
        flatProducts={isSearchActive ? flatProducts : []}
        categories={typedCategories}
        totalProducts={totalProducts}
        categoryFilter={category || 'all'}
        searchQuery={q || ''}
      />
    </main>
  )
}