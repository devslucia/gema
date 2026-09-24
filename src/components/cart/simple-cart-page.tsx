import { useCart } from '@/components/cart/cart-context'

export default function SimpleCartPage() {
  const { cart, removeFromCart, clearCart, total } = useCart()

  const handleRemove = (productId: string) => {
    removeFromCart(productId)
  }

  const handleClear = () => {
    clearCart()
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary-dark mb-4">Carrito vacío</h2>
          <p className="text-text-secondary-dark">
            Tu carrito no tiene productos. <a href="/catalogo" className="text-primary-600 hover:text-primary-800">
              Volver al catálogo
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-text-primary-dark mb-6">Carrito de compras</h1>

      <div className="space-y-4">
        {cart.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded bg-secondary/20 dark:bg-secondary/40">
            <span className="font-medium text-text-primary-dark">
              {item.product_name}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRemove(item.product_id)}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                title="Eliminar"
              >
                ×
              </button>
              <span className="text-caption text-text-secondary-dark">
                x{item.quantity}
              </span>
            </div>
          </div>
        ))}

        <div className="mt-6 p-4 border-t border-secondary/20 pt-6">
          <div className="flex justify-between mb-2">
            <span className="font-medium text-text-primary-dark">Total</span>
            <span className="text-xl font-bold text-primary-600">
              {total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
          </div>
          <button
            onClick={handleClear}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
            title="Clear cart"
          >
            Limpiar carrito
          </button>
          <button
            className="mt-2 w-full py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            title="Proceed to checkout"
          >
            Pagar
          </button>
        </div>
      </div>
    </div>
  )
}