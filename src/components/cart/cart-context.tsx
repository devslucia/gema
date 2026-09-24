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
    const existing = cart.find((item) => item.product_id === product.product_id)
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1, subtotal: item.price * (item.quantity + 1) }
            : item
        )
      )
    } else {
      setCart([
        ...cart,
        {
          product_id: product.product_id,
          product_name: product.product_name,
          price: product.price,
          quantity: 1,
          subtotal: product.price,
        },
      ])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product_id !== productId))
  }

  const clearCart = () => setCart([])

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  )
}