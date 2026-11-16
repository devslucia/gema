import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard from './components/AdminDashboard'
import { Category } from '@/types/category'
import { getAdminProductsPaginated, getCategories, getLowStockProducts, searchAdminProducts } from '@/lib/supabase/pagination'

export const dynamic = 'force-dynamic'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { page, q } = await searchParams
  const parsedPage = page ? parseInt(page, 10) : 1
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const search = q?.trim() ?? ''

  const [paginatedResult, categoriesData, lowStockProducts] = await Promise.all([
    search
      ? searchAdminProducts({ search, page: currentPage, limit: 10 })
      : getAdminProductsPaginated({ page: currentPage, limit: 10 }),
    getCategories(),
    getLowStockProducts(),
  ])

  const categories = categoriesData as Category[]

  return (
    <AdminDashboard
      products={paginatedResult.data}
      categories={categories}
      searchQuery={search}
      lowStockProducts={lowStockProducts}
      currentPage={paginatedResult.page}
      totalProducts={paginatedResult.total}
      totalPages={paginatedResult.totalPages}
    />
  )
}