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

export interface ProductsByCategory {
  category: { id: string; name: string } | null
  products: Product[]
}

export async function getProductsGroupedByCategory(
  search?: string,
  categoryFilter?: string | null
): Promise<ProductsByCategory[]> {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  if (categoryFilter && categoryFilter !== 'all') {
    query = query.eq('category_id', categoryFilter)
  }

  const { data: products } = await query

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  const categoryMap = new Map(categories?.map(c => [c.id, c]) || [])

  const groupedByCategory = new Map<string, Product[]>()

  ;(products || []).forEach(product => {
    const categoryId = product.category_id || 'uncategorized'
    if (!groupedByCategory.has(categoryId)) {
      groupedByCategory.set(categoryId, [])
    }
    groupedByCategory.get(categoryId)!.push(product)
  })

  const result: ProductsByCategory[] = []

  groupedByCategory.forEach((prods, categoryId) => {
    if (categoryId === 'uncategorized') {
      result.push({
        category: null,
        products: prods,
      })
    } else {
      const category = categoryMap.get(categoryId)
      result.push({
        category: category ? { id: category.id, name: category.name } : null,
        products: prods,
      })
    }
  })

  result.sort((a, b) => {
    if (!a.category) return 1
    if (!b.category) return -1
    return a.category.name.localeCompare(b.category.name)
  })

  return result
}

export interface SearchResult {
  products: Product[]
  category: { id: string; name: string } | null
}

export async function searchProducts(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name')

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  const categoryMap = new Map(categories?.map(c => [c.id, c]) || [])

  const groupedByCategory = new Map<string, Product[]>()

  ;(products || []).forEach(product => {
    const categoryId = product.category_id || 'uncategorized'
    if (!groupedByCategory.has(categoryId)) {
      groupedByCategory.set(categoryId, [])
    }
    groupedByCategory.get(categoryId)!.push(product)
  })

  const results: SearchResult[] = []

  groupedByCategory.forEach((prods, categoryId) => {
    if (categoryId === 'uncategorized') {
      results.push({
        products: prods,
        category: null,
      })
    } else {
      const category = categoryMap.get(categoryId)
      results.push({
        products: prods,
        category: category ? { id: category.id, name: category.name } : null,
      })
    }
  })

  return results
}