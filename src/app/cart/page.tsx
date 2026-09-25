"use client"

import { useCart } from '@/components/cart/cart-context'
import { Button } from '@/components/ui/button'

export default function CartPage() {
  const { cart, removeFromCart, total } = useCart()

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg max-w-md w-full">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path className="stroke-primary dark:text-primary-400" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7a5.5 5.5 0 017.5-7.5H21a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-2.5 2.5H17l4.5 4.5a5.5 5.5 0 01-7.5 7.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary-dark mb-2">Carrito vacío</h2>
            <p className="text-text-secondary-dark mb-6">Aún no has agregado productos.</p>
            <Button size="lg" type="primary" onClick={() => window.history.back()} className="w-full">
              Continuar comprando
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-text-primary-dark mb-4">Mi carrito</h2>

      <div className="space-y-4">
        {cart.map((item) => (
          <div key={item.product_id} className="p-4 border rounded bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-medium text-text-primary-dark">
                  {item.product_name}
                </h3>
                <p className="text-caption text-text-secondary-dark">
                  ${item.price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })} c/u
                </p>
              </div>

              <span className="font-medium text-primary">
                ${item.price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </span>

              <button
                onClick={() => removeFromCart(item.product_id)}
                className="ml-2 p-1 rounded bg-red-100 dark:bg-red-900 text-red-600 hover:bg-red-200 dark:hover:bg-red-800 text-sm hover:text-white transition-colors"
                aria-label="Eliminar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L6 6m0 0L12 6m-6 12L12 6m0 0L6 18" />
                </svg>
                Eliminar
              </button>
            </div>
          </div>
        ))}

        <div className="mt-6 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between mb-2">
            <span className="font-medium text-text-primary-dark">Total</span>
            <span className="text-xl font-bold text-primary">
              ${total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
            </span>
          </div>

          <Button
            size="lg"
            type="primary"
            onClick={() => window.location.href = '/pago-exitoso'}
          >
            Pagar con Mercado Pago
          </Button>
        </div>
      </div>
    </div>
  )
}