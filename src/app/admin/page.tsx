import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard from './components/AdminDashboard'
import { Category } from '@/types/category'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [productsResponse, categoriesResponse] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('name')
  ])

  const products = productsResponse.data || []
  const categories = (categoriesResponse.data || []) as Category[]

  return <AdminDashboard products={products} categories={categories} />
}