"use client"

import { createContext, useContext, useState, type ReactNode } from 'react'

type CartItem = {
  product_id: string
  product_name: string
  price: number
  quantity: number
  subtotal: number
}

type CartContextProps = {
  cart: CartItem[]
  addToCart: (product: { product_id: string; product_name: string; price: number }) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
}

const CartContext = createContext<CartContextProps | undefined>(undefined)

export const useCart = (): CartContextProps => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider')
  }
  return context
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = (product: { product_id: string; product_name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.product_id)
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1, subtotal: item.price * (item.quantity + 1) }
            : item
        )
      }
      return [
        ...prev,
        {
          product_id: product.product_id,
          product_name: product.product_name,
          price: product.price,
          quantity: 1,
          subtotal: product.price,
        },
      ]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantity, subtotal: item.price * quantity }
          : item
      )
    )
  }

  const clearCart = () => setCart([])

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  )
}