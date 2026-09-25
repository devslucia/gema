'use client'

import { useState, useRef, useEffect } from 'react'
import { useCart } from '@/components/cart/cart-context'
import { Product } from '@/types/product'
import { Category } from '@/types/category'
import { formatPriceARS } from '@/lib/utils'
import { X, MapPin, ShoppingCart, ShoppingBag, MoreHorizontal, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface ProductSectionProps {
  category: { id: string; name: string } | null
  products: Product[]
  categories: Category[]
  categoryIndex: number
  maxProducts?: number
}

const getCategoryColor = (index: number) => {
  const colors = [
    'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
    'bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-100',
    'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
    'bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-100',
    'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
  ]
  return colors[index % 5]
}

// Dropdown menu for cart actions per product
function CartDropdown({
  product,
}: {
  product: Product
}) {
  const { cart, addToCart, removeFromCart } = useCart()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInCart = cart.some((item) => item.product_id === product.id)

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`p-1.5 rounded-lg transition-colors duration-150 ${isInCart
            ? 'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100'
            : 'bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-100'
          }`}
        aria-label="Opciones del producto"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {isInCart ? (
          <CheckCircle className="w-3.5 h-3.5" />
        ) : (
          <MoreHorizontal className="w-3.5 h-3.5" />
        )}
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-1 right-0 z-40 min-w-[170px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden animate-scale-in"
          role="menu"
        >
          <button
            role="menuitem"
            onClick={() => {
              addToCart({
                product_id: product.id,
                product_name: product.name,
                price: product.price,
              })
              setOpen(false)
            }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors"
          >
            <ShoppingCart className="w-4 h-4 flex-shrink-0" />
            Agregar al carrito
          </button>

          {isInCart && (
            <button
              role="menuitem"
              onClick={() => {
                removeFromCart(product.id)
                setOpen(false)
              }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 flex-shrink-0" />
              Quitar del carrito
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProductSection({
  category,
  products,
  categoryIndex,
  maxProducts = 4,
}: ProductSectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { cart, addToCart } = useCart()

  const categoryName = category?.name || 'Sin categoría'
  const colorClass = getCategoryColor(categoryIndex)
  const hasMore = products.length > maxProducts
  const visibleProducts = products.slice(0, maxProducts)

  const openModal = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  return (
    <section className="mb-10 last:mb-0 animate-fade-in pb-10 border-b border-surface-light dark:border-dark-200 last:border-b-0">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-heading text-text-primary-light dark:text-text-primary-dark">
            {categoryName}
          </h2>
          <span className={`badge ${colorClass}`}>
            {products.length} {products.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        {hasMore && (
          <Link
            href={`/?category=${category?.id || ''}`}
            className="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5"
          >
            Ver más
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visibleProducts.map((product, index) => {
          const isInCart = cart.some((item) => item.product_id === product.id)
          return (
            <article
              key={product.id}
              onClick={() => openModal(product)}
              className="card card-hover group animate-slide-up cursor-pointer relative"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {isInCart && (
                <span className="absolute top-2 right-2 flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 dark:bg-primary/20 rounded-full px-2 py-0.5">
                  <CheckCircle className="w-3 h-3" />
                  En carrito
                </span>
              )}
              <h3 className="text-subheading font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-200 pr-16">
                {product.name}
              </h3>
              <p className="text-display text-primary mb-4 font-bold">
                {formatPriceARS(product.price)}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-100">
                  {categoryName}
                </span>
                <CartDropdown product={product} />
              </div>
            </article>
          )
        })}
      </div>

      {/* Product Detail Modal */}
      {isModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <div className="card max-w-md w-full shadow-elevation-4 animate-scale-in">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-surface-light dark:border-dark-200">
              <h2 id="product-modal-title" className="text-heading text-text-primary-light dark:text-text-primary-dark">
                Detalle del Producto
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-surface-light dark:hover:bg-dark-200 rounded-lg transition-colors duration-150 touch-target"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Nombre</p>
                <p className="text-body font-medium text-text-primary-light dark:text-text-primary-dark">{selectedProduct.name}</p>
              </div>
              <div>
                <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Precio</p>
                <p className="text-body font-semibold text-primary">{formatPriceARS(selectedProduct.price)}</p>
              </div>
              <div>
                <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Categoría</p>
                <span className={`badge ${colorClass}`}>
                  {categoryName}
                </span>
              </div>
              <div>
                <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Ubicación</p>
                <a
                  href="https://www.google.com/maps/search/Av.+Bartolomé+Mitre+1772"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline cursor-pointer touch-target"
                >
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  Av. Bartolomé Mitre 1772
                </a>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              {cart.some((i) => i.product_id === selectedProduct.id) ? (
                <button
                  type="button"
                  onClick={() => { closeModal(); window.location.href = '/cart' }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Ver carrito
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    addToCart({
                      product_id: selectedProduct.id,
                      product_name: selectedProduct.name,
                      price: selectedProduct.price,
                    })
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Agregar al carrito
                </button>
              )}
              <button
                type="button"
                onClick={closeModal}
                className="btn-secondary flex-1"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}