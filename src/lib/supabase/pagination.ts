import { createClient } from './server'
import { Product } from '@/types/product'

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  category?: string | null
}

export async function getProductsPaginated({
  page = 1,
  limit = 8,
  search,
  category,
}: PaginationParams): Promise<PaginatedResult<Product>> {
  const supabase = await createClient()

  const offset = (page - 1) * limit

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  if (category && category !== 'all') {
    query = query.eq('category_id', category)
  }

  const { data: products, count } = await query.range(offset, offset + limit - 1)

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    data: (products as Product[]) || [],
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  }
}

export async function getAdminProductsPaginated({
  page = 1,
  limit = 10,
}: PaginationParams): Promise<PaginatedResult<Product>> {
  const supabase = await createClient()

  const offset = (page - 1) * limit

  const { data: products, count } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    data: (products as Product[]) || [],
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  }
}

export async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  return data || []
}