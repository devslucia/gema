import { searchProducts } from '@/lib/supabase/pagination'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query?.trim()) {
    return NextResponse.json([])
  }

  const results = await searchProducts(query)
  return NextResponse.json(results)
}