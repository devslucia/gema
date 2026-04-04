import { Category } from './category'

export interface Product {
  id: string
  name: string
  price: number
  category_id: string | null
  created_at: string
}

export interface ProductWithCategory extends Product {
  category: Category | null
}