import { searchProducts } from '@/lib/supabase/pagination'
import { NextResponse } from 'next/server'

// Simple in-memory cache for API responses
const apiCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 60000 // 60 seconds

function getCacheKey(query: string, limit: number, offset: number): string {
  return `${query}:${limit}:${offset}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  if (!query?.trim()) {
    return NextResponse.json([])
  }

  const cacheKey = getCacheKey(query.trim(), limit, offset)
  const cached = apiCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'X-Cache': 'HIT'
      }
    })
  }

  const results = await searchProducts(query.trim(), limit, offset)
  
  // Cache the results
  apiCache.set(cacheKey, { data: results, timestamp: Date.now() })

  // Clean old cache entries periodically
  if (apiCache.size > 100) {
    const now = Date.now()
    const keysToDelete: string[] = []
    apiCache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_TTL) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => apiCache.delete(key))
  }

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'public, max-age=60',
      'X-Cache': 'MISS'
    }
  })
}