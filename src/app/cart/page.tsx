"use client"

import { useCart } from '@/components/cart/cart-context'
import Link from 'next/link'
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, total } = useCart()

  const formatPrice = (value: number) =>
    value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Tu carrito está vacío
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Aún no has agregado ningún producto.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Continuar comprando
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mi carrito
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
        >
          Vaciar carrito
        </button>
      </div>

      <div className="space-y-3">
        {cart.map((item) => (
          <div
            key={item.product_id}
            className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm"
          >
            {/* Nombre y precio unitario */}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                {item.product_name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatPrice(item.price)} c/u
              </p>
            </div>

            {/* Control de cantidad */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Disminuir cantidad"
              >
                <Minus className="w-3 h-3" />
              </button>

              <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                {item.quantity}
              </span>

              <button
                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Aumentar cantidad"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Subtotal */}
            <span className="font-semibold text-primary min-w-[90px] text-right">
              {formatPrice(item.subtotal)}
            </span>

            {/* Eliminar */}
            <button
              onClick={() => removeFromCart(item.product_id)}
              className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
              aria-label={`Eliminar ${item.product_name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Resumen y pago */}
      <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-2 text-gray-600 dark:text-gray-400 text-sm">
          <span>{cart.reduce((acc, i) => acc + i.quantity, 0)} productos</span>
        </div>
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
          <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
          <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
        </div>

        <button
          onClick={() => (window.location.href = '/pago-exitoso')}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-lg font-semibold text-base hover:bg-primary/90 transition-colors shadow-md"
        >
          Pagar con Mercado Pago
        </button>

        <Link
          href="/"
          className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}