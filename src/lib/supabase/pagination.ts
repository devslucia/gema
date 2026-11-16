import { createClient } from './server'
import { Product } from '@/types/product'
import { matchesSearch } from '@/lib/utils'

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

// Supabase returns at most 1000 rows per request, so read in chunks to get everything
const CHUNK_SIZE = 1000

export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += CHUNK_SIZE) {
    const { data, error } = await fetchPage(from, from + CHUNK_SIZE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data || []))
    if (!data || data.length < CHUNK_SIZE) return rows
  }
}

/**
 * Admin product search across the whole catalog (not just the current page).
 * Matches name, category name and id; case/accent insensitive and partial.
 */
export async function searchAdminProducts({
  search = '',
  page = 1,
  limit = 10,
}: PaginationParams): Promise<PaginatedResult<Product>> {
  const supabase = await createClient()

  const [products, { data: categories }] = await Promise.all([
    fetchAllRows<Product>((from, to) =>
      supabase.from('products').select('*').order('created_at', { ascending: false }).order('id').range(from, to)
    ),
    supabase.from('categories').select('id, name'),
  ])

  const categoryNames = new Map((categories || []).map((c) => [c.id as string, c.name as string]))
  const matches = products.filter((p) =>
    matchesSearch([p.name, p.category_id ? categoryNames.get(p.category_id) : 'Sin categoría', p.id], search)
  )

  const total = matches.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const offset = (safePage - 1) * limit

  return {
    data: matches.slice(offset, offset + limit),
    total,
    page: safePage,
    limit,
    totalPages,
    hasMore: safePage < totalPages,
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

export async function searchProducts(query: string, limit = 10, offset = 0): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const supabase = await createClient()

  // Try full-text search first (requires pg_trgm extension), fallback to ILIKE
  let productsQuery = supabase
    .from('products')
    .select('*')
    .order('name')
    .range(offset, offset + limit - 1)

  // Use ILIKE for now (works without pg_trgm extension)
  // For better performance with large datasets, enable pg_trgm and use:
  // productsQuery = productsQuery.textSearch('name', query, { type: 'websearch' })
  productsQuery = productsQuery.ilike('name', `%${query}%`)

  const { data: products } = await productsQuery

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

export async function searchProductsFlat(query: string): Promise<Product[]> {
  if (!query.trim()) return []

  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name')

  return (products as Product[]) || []
}
export type LowStockProduct = Pick<Product, 'id' | 'name' | 'stock_actual' | 'stock_minimo'>

export async function getLowStockProducts(): Promise<LowStockProduct[]> {
  const supabase = await createClient()

  // PostgREST can't compare two columns, so filter stock_actual <= stock_minimo here
  const { data: products } = await supabase
    .from('products')
    .select('id, name, stock_actual, stock_minimo')
    .order('stock_actual', { ascending: true })

  return ((products as LowStockProduct[]) || []).filter(
    p => (p.stock_actual ?? 0) <= (p.stock_minimo ?? 5)
  )
}
