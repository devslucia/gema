import { createClient } from '@/lib/supabase/server'
import ProductList from './components/ProductList'
import SearchBar from './components/SearchBar'
import CategoryFilter from './components/CategoryFilter'
import { Category } from '@/types/category'

export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const supabase = await createClient()
  const { q, category } = await searchParams

  const [categoriesResponse, productsResponse] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('products').select('*').order('created_at', { ascending: false })
  ])

  const categories = (categoriesResponse.data || []) as Category[]
  let products = productsResponse.data || []

  if (q) {
    products = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
  }

  if (category && category !== 'all') {
    products = products.filter(p => p.category_id === category)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <SearchBar defaultValue={q || ''} />
        <CategoryFilter 
          defaultValue={category || 'all'} 
          categories={categories}
        />
      </div>

      <ProductList products={products} categories={categories} />
    </main>
  )
}