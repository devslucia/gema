import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard from './components/AdminDashboard'
import { Category } from '@/types/category'
import { getAdminProductsPaginated, getCategories } from '@/lib/supabase/pagination'

export const dynamic = 'force-dynamic'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { page } = await searchParams
  const currentPage = page ? parseInt(page, 10) : 1

  const [paginatedResult, categoriesData] = await Promise.all([
    getAdminProductsPaginated({
      page: currentPage,
      limit: 10,
    }),
    getCategories(),
  ])

  const categories = categoriesData as Category[]

  return (
    <AdminDashboard
      products={paginatedResult.data}
      categories={categories}
      currentPage={paginatedResult.page}
      totalProducts={paginatedResult.total}
      totalPages={paginatedResult.totalPages}
    />
  )
}