'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import { Product } from '@/types/product'
import { Category } from '@/types/category'
import { Plus, Trash2, X, Package, Folder, AlertCircle, Edit2, CheckCircle2, Loader2, ChevronLeft, ChevronRight, Search, Eye, MapPin } from 'lucide-react'
import { formatPriceARS } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { getStockStatus, getStockStatusLabel, getStockStatusColor, StockAdjustment } from '@/types/product'

interface AdminDashboardProps {
  products: Product[]
  categories: Category[]
  currentPage?: number
  totalProducts?: number
  totalPages?: number
}

export default function AdminDashboard({
  products: initialProducts,
  categories: initialCategories,
  currentPage = 1,
  totalProducts = 0,
  totalPages = 1,
}: AdminDashboardProps) {
  const supabase = createClient()
  const [productList, setProductList] = useState(initialProducts)
  const [categories, setCategories] = useState(initialCategories)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category_id: '',
    stock_actual: '',
    stock_minimo: '',
  })
  const [stockFormData, setStockFormData] = useState({
    tipo: 'entrada' as 'entrada' | 'salida' | 'ajuste',
    cantidad: '',
    motivo: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [stockSubmitting, setStockSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; price?: string; category?: string; stock_actual?: string; stock_minimo?: string }>({})
  const [stockErrors, setStockErrors] = useState<{ cantidad?: string; motivo?: string }>({})
  const modalRef = useRef<HTMLDivElement>(null)
  const categoryModalRef = useRef<HTMLDivElement>(null)
  const detailModalRef = useRef<HTMLDivElement>(null)
  const stockModalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setProductList(initialProducts)
  }, [initialProducts])

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sin categoría'
    const category = categories.find(c => c.id === categoryId)
    return category?.name || 'Desconocida'
  }

  const getCategoryColor = (categoryId: string | null) => {
    const category = categories.find(c => c.id === categoryId)
    const colorIndex = categories.indexOf(category!) % 5
    const colors = [
      'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
      'bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-100',
      'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
      'bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-100',
      'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-100',
    ]
    return colors[colorIndex] || colors[0]
  }

  const validateProductForm = () => {
    const newErrors: { name?: string; price?: string; category?: string; stock_actual?: string; stock_minimo?: string } = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }
    
    const price = parseFloat(formData.price)
    if (!formData.price || isNaN(price) || price < 0) {
      newErrors.price = 'Ingresa un precio válido'
    }

    const stockActual = parseInt(formData.stock_actual, 10)
    if (formData.stock_actual === '' || isNaN(stockActual) || stockActual < 0) {
      newErrors.stock_actual = 'Stock actual inválido'
    }

    const stockMinimo = parseInt(formData.stock_minimo, 10)
    if (formData.stock_minimo === '' || isNaN(stockMinimo) || stockMinimo < 0) {
      newErrors.stock_minimo = 'Stock mínimo inválido'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateProductForm()) return
    
    setSubmitting(true)

    const productData = {
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      category_id: formData.category_id || null,
      stock_actual: parseInt(formData.stock_actual, 10),
      stock_minimo: parseInt(formData.stock_minimo, 10),
    }

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update({
          ...productData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProduct.id)

      if (error) {
        console.error('Error updating product:', error)
        toast.error(`Error al actualizar: ${error.message}`)
      } else {
        setProductList(
          productList.map((p) =>
            p.id === editingProduct.id
              ? { ...p, ...productData }
              : p
          )
        )
        toast.success('Producto actualizado correctamente', {
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        })
      }
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()

      if (error) {
        console.error('Error inserting product:', error)
        toast.error(`Error al crear: ${error.message}`)
      } else if (data) {
        setProductList([data[0], ...productList])
        toast.success('Producto agregado correctamente', {
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        })
      }
    }

    setSubmitting(false)
    closeProductModal()
  }

  const handleProductDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return

    setSubmitting(true)
    const { error } = await supabase.from('products').delete().eq('id', id)

    if (!error) {
      setProductList(productList.filter((p) => p.id !== id))
      toast.success('Producto eliminado correctamente')
    } else {
      toast.error('Error al eliminar el producto')
    }
    setSubmitting(false)
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newCategoryName.trim()) {
      toast.error('El nombre de la categoría es requerido')
      return
    }

    const exists = categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())
    if (exists) {
      toast.error('Ya existe una categoría con este nombre')
      return
    }

    setSubmitting(true)
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newCategoryName.trim() })
      .select()

    if (!error && data) {
      setCategories([...categories, data[0]])
      setNewCategoryName('')
      setIsCategoryModalOpen(false)
      toast.success('Categoría agregada correctamente', {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      })
    } else {
      toast.error('Error al agregar la categoría')
    }
    setSubmitting(false)
  }

  const handleCategoryDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría? Los productos que la usen quedarán sin categoría.')) return

    setSubmitting(true)
    const { error } = await supabase.from('categories').delete().eq('id', id)

    if (!error) {
      setCategories(categories.filter((c) => c.id !== id))
      toast.success('Categoría eliminada correctamente')
    } else {
      toast.error('Error al eliminar la categoría')
    }
    setSubmitting(false)
  }

  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({ name: '', price: '', category_id: '', stock_actual: '0', stock_minimo: '5' })
    setErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category_id: product.category_id || '',
      stock_actual: (product.stock_actual ?? 0).toString(),
      stock_minimo: (product.stock_minimo ?? 5).toString(),
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const closeProductModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setFormData({ name: '', price: '', category_id: '', stock_actual: '0', stock_minimo: '5' })
    setErrors({})
  }

  const openStockModal = (product: Product) => {
    setStockAdjustProduct(product)
    setStockFormData({ tipo: 'entrada', cantidad: '', motivo: '' })
    setStockErrors({})
    setIsStockModalOpen(true)
  }

  const closeStockModal = () => {
    setIsStockModalOpen(false)
    setStockAdjustProduct(null)
    setStockFormData({ tipo: 'entrada', cantidad: '', motivo: '' })
    setStockErrors({})
  }

  const validateStockForm = () => {
    const newErrors: { cantidad?: string; motivo?: string } = {}
    
    const cantidad = parseInt(stockFormData.cantidad, 10)
    if (!stockFormData.cantidad || isNaN(cantidad) || cantidad <= 0) {
      newErrors.cantidad = 'Cantidad requerida (mayor a 0)'
    }

    if (stockFormData.tipo === 'salida' && stockAdjustProduct) {
      const cantidad = parseInt(stockFormData.cantidad, 10)
      if (cantidad > stockAdjustProduct.stock_actual) {
        newErrors.cantidad = `Stock insuficiente. Disponible: ${stockAdjustProduct.stock_actual}`
      }
    }
    
    setStockErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStockForm() || !stockAdjustProduct) return
    
    setStockSubmitting(true)

    try {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: stockAdjustProduct.id,
          tipo: stockFormData.tipo,
          cantidad: parseInt(stockFormData.cantidad, 10),
          motivo: stockFormData.motivo.trim() || undefined,
        } as StockAdjustment),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al ajustar stock')
      }

      // Update local product list with new stock
      setProductList(
        productList.map((p) =>
          p.id === stockAdjustProduct.id
            ? { ...p, stock_actual: result.product.stock_actual, updated_at: result.product.updated_at }
            : p
        )
      )

      // Also update the selected product in detail modal if open
      if (selectedProduct && selectedProduct.id === stockAdjustProduct.id) {
        setSelectedProduct({ ...selectedProduct, stock_actual: result.product.stock_actual, updated_at: result.product.updated_at })
      }

      toast.success('Stock actualizado correctamente', {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      })

      closeStockModal()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al ajustar stock')
    } finally {
      setStockSubmitting(false)
    }
  }

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false)
    setNewCategoryName('')
  }

  const openDetailModal = (product: Product) => {
    setSelectedProduct(product)
    setIsDetailModalOpen(true)
  }

  const closeDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedProduct(null)
  }

  const filteredProducts = searchQuery.trim()
    ? productList.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : productList

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) closeProductModal()
        if (isCategoryModalOpen) closeCategoryModal()
        if (isDetailModalOpen) closeDetailModal()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (isModalOpen && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeProductModal()
      }
      if (isCategoryModalOpen && categoryModalRef.current && !categoryModalRef.current.contains(e.target as Node)) {
        closeCategoryModal()
      }
      if (isDetailModalOpen && detailModalRef.current && !detailModalRef.current.contains(e.target as Node)) {
        closeDetailModal()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isModalOpen, isCategoryModalOpen, isDetailModalOpen])

  const isFormValid = formData.name.trim() && formData.price && parseFloat(formData.price) >= 0 && formData.stock_actual !== '' && formData.stock_minimo !== '' && parseInt(formData.stock_actual, 10) >= 0 && parseInt(formData.stock_minimo, 10) >= 0

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header with responsive layout */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-heading sm:text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Panel de Administración
              </h1>
              <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Gestioná productos y categorías
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="btn-primary flex items-center justify-center gap-2 touch-target w-full sm:w-auto"
              aria-label="Agregar nuevo producto"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              <span className="hidden sm:inline">Agregar producto</span>
            </button>
          </div>
        </div>

        {/* Search bar - full width on all screens */}
        <div className="mb-4 sm:mb-6">
          <div className="relative max-w-md w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
              aria-label="Buscar productos"
            />
          </div>
        </div>

        {/* Main content grid - responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Products Section */}
          <section className="lg:col-span-2" aria-labelledby="products-heading">
            <div className="card shadow-elevation-1 overflow-hidden">
              {/* Table with responsive card view on mobile */}
              <div className="overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-light dark:divide-dark-200" aria-label="Lista de productos">
                    <thead className="bg-surface-light dark:bg-dark-200">
                      <tr>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                          Producto
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider hidden md:table-cell">
                          Precio
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider hidden lg:table-cell">
                          Categoría
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider hidden sm:table-cell">
                          Stock
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-light dark:divide-dark-200">
                      {filteredProducts.map((product) => {
                        const stockStatus = getStockStatus(product)
                        return (
                        <tr 
                          key={product.id} 
                          onClick={() => openDetailModal(product)}
                          className="hover:bg-surface-light dark:hover:bg-dark-200/50 transition-colors duration-150 cursor-pointer"
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-body text-text-primary-light dark:text-text-primary-dark font-medium">
                            {product.name}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-body font-semibold text-primary hidden md:table-cell">
                            {formatPriceARS(product.price)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            <span className={`badge ${getCategoryColor(product.category_id)}`}>
                              {getCategoryName(product.category_id)}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center hidden sm:table-cell">
                            <div className="flex items-center justify-center gap-2">
                              <span className={`font-mono font-semibold text-body ${stockStatus === 'sin_stock' ? 'text-red-500' : stockStatus === 'critico' ? 'text-orange-500' : stockStatus === 'bajo' ? 'text-yellow-500' : 'text-green-500'}`}>
                                {product.stock_actual ?? 0}
                              </span>
                              <span className={`badge ${getStockStatusColor(stockStatus)} text-xs px-2 py-0.5`}>
                                {getStockStatusLabel(stockStatus)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => openDetailModal(product)}
                                className="btn-ghost p-2 touch-target"
                                aria-label={`Ver detalle del producto ${product.name}`}
                              >
                                <Eye className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => openEditModal(product)}
                                className="btn-ghost p-2 touch-target"
                                aria-label={`Editar producto ${product.name}`}
                              >
                                <Edit2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => openStockModal(product)}
                                className="btn-ghost p-2 touch-target text-primary hover:bg-primary/10"
                                aria-label={`Ajustar stock de ${product.name}`}
                              >
                                <Package className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => handleProductDelete(product.id)}
                                className="btn-ghost p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 touch-target"
                                aria-label={`Eliminar producto ${product.name}`}
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product)
                    return (
                    <article 
                      key={product.id} 
                      onClick={() => openDetailModal(product)}
                      className="p-4 border-b border-surface-light dark:border-dark-200 last:border-b-0 hover:bg-surface-light dark:hover:bg-dark-200/50 transition-colors duration-150 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-body font-medium text-text-primary-light dark:text-text-primary-dark truncate">
                            {product.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-display font-bold text-primary">
                              {formatPriceARS(product.price)}
                            </span>
                            <span className={`badge ${getCategoryColor(product.category_id)} text-xs`}>
                              {getCategoryName(product.category_id)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`font-mono text-sm ${stockStatus === 'sin_stock' ? 'text-red-500' : stockStatus === 'critico' ? 'text-orange-500' : stockStatus === 'bajo' ? 'text-yellow-500' : 'text-green-500'}`}>
                              Stock: {product.stock_actual ?? 0}
                            </span>
                            <span className={`badge ${getStockStatusColor(stockStatus)} text-xs px-2 py-0.5`}>
                              {getStockStatusLabel(stockStatus)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); openDetailModal(product); }}
                            className="btn-ghost p-2 touch-target"
                            aria-label={`Ver detalle de ${product.name}`}
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(product); }}
                            className="btn-ghost p-2 touch-target"
                            aria-label={`Editar ${product.name}`}
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openStockModal(product); }}
                            className="btn-ghost p-2 touch-target text-primary hover:bg-primary/10"
                            aria-label={`Ajustar stock de ${product.name}`}
                          >
                            <Package className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleProductDelete(product.id); }}
                            className="btn-ghost p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 touch-target"
                            aria-label={`Eliminar ${product.name}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </article>
                    )
                  })}
                </div>

                {/* Empty State */}
                {productList.length === 0 && (
                  <div className="text-center py-12 sm:py-16 animate-fade-in" role="status" aria-live="polite">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 rounded-full bg-surface-light dark:bg-dark-200">
                        <Package className="w-12 h-12 text-text-secondary-light dark:text-text-secondary-dark" />
                      </div>
                    </div>
                    <p className="text-body text-text-secondary-light dark:text-text-secondary-dark">No hay productos todavía</p>
                    <p className="text-caption text-text-secondary-light/70 dark:text-text-secondary-dark/70 mt-1">Agregá tu primer producto</p>
                  </div>
                )}

                {/* Pagination - responsive */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-surface-light dark:border-dark-200">
                    <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark text-center sm:text-left">
                      Página {currentPage} de {totalPages} ({totalProducts} productos)
                    </p>
                    <div className="flex items-center gap-2">
                      <Link
                        href={currentPage > 1 ? `?page=${currentPage - 1}` : '#'}
                        className={`btn-ghost flex items-center gap-1.5 touch-target px-3 py-2 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                        aria-disabled={currentPage <= 1}
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Anterior</span>
                      </Link>
                      <Link
                        href={currentPage < totalPages ? `?page=${currentPage + 1}` : '#'}
                        className={`btn-ghost flex items-center gap-1.5 touch-target px-3 py-2 ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                        aria-disabled={currentPage >= totalPages}
                        aria-label="Página siguiente"
                      >
                        <span className="hidden sm:inline">Siguiente</span>
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Categories Sidebar */}
          <section aria-labelledby="categories-heading">
            <div className="card shadow-elevation-1 overflow-hidden h-fit sticky top-24 lg:top-32">
              <div className="px-4 sm:px-6 py-4 border-b border-surface-light dark:border-dark-200">
                <h2 id="categories-heading" className="text-subheading font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Categorías
                </h2>
              </div>
              <ul className="divide-y divide-surface-light dark:divide-dark-200 max-h-[60vh] overflow-y-auto" aria-label="Lista de categorías">
                {categories.map((category) => (
                  <li key={category.id} className="px-4 sm:px-6 py-3 flex items-center justify-between hover:bg-surface-light dark:hover:bg-dark-200/50 transition-colors duration-150">
                    <span className="text-body text-text-primary-light dark:text-text-primary-dark truncate pr-2">{category.name}</span>
                    <button
                      onClick={() => handleCategoryDelete(category.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-150 touch-target flex-shrink-0"
                      aria-label={`Eliminar categoría ${category.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                {categories.length === 0 && (
                  <li className="px-4 sm:px-6 py-8 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 rounded-full bg-surface-light dark:bg-dark-200">
                        <Folder className="w-6 h-6 text-text-secondary-light dark:text-text-secondary-dark" />
                      </div>
                    </div>
                    <p className="text-body text-text-secondary-light dark:text-text-secondary-dark">No hay categorías</p>
                    <p className="text-caption text-text-secondary-light/70 dark:text-text-secondary-dark/70 mt-1">Creá la primera desde el botón superior</p>
                  </li>
                )}
              </ul>
              {/* Add Category Button - fixed at bottom of card on mobile */}
              <div className="p-4 border-t border-surface-light dark:border-dark-200 lg:hidden">
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="btn-secondary flex items-center justify-center gap-2 touch-target w-full"
                  aria-label="Agregar nueva categoría"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Agregar categoría
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Add Category Button - Desktop only (shown in sidebar header) */}
        <div className="hidden lg:block">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="btn-secondary flex items-center gap-2 touch-target mt-4"
            aria-label="Agregar nueva categoría"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Agregar categoría
          </button>
        </div>

        {/* Product Modal */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <div 
              ref={modalRef}
              className="card w-full max-w-md sm:max-w-lg shadow-elevation-4 animate-scale-in max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-surface-light dark:border-dark-200 flex-shrink-0">
                <h2 id="product-modal-title" className="text-heading text-text-primary-light dark:text-text-primary-dark">
                  {editingProduct ? 'Editar producto' : 'Agregar producto'}
                </h2>
                <button 
                  onClick={closeProductModal} 
                  className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-surface-light dark:hover:bg-dark-200 rounded-lg transition-colors duration-150 touch-target flex-shrink-0"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleProductSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label 
                    htmlFor="product-name" 
                    className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5"
                  >
                    Nombre <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="product-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (errors.name) setErrors({ ...errors, name: undefined })
                    }}
                    placeholder="Ej: Placa de carga"
                    className={`input-field ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    aria-describedby={errors.name ? 'product-name-error' : undefined}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <p id="product-name-error" className="mt-1.5 text-caption text-red-500 flex items-center gap-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label 
                    htmlFor="product-price" 
                    className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5"
                  >
                    Precio <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="product-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({ ...formData, price: e.target.value })
                      if (errors.price) setErrors({ ...errors, price: undefined })
                    }}
                    placeholder="Ej: 15000,00"
                    className={`input-field ${errors.price ? 'border-red-500 focus:ring-red-500' : ''}`}
                    aria-describedby={errors.price ? 'product-price-error' : undefined}
                    aria-invalid={!!errors.price}
                  />
                  {errors.price && (
                    <p id="product-price-error" className="mt-1.5 text-caption text-red-500 flex items-center gap-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      {errors.price}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label 
                      htmlFor="product-stock-actual" 
                      className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5"
                    >
                      Stock actual <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="product-stock-actual"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.stock_actual}
                      onChange={(e) => {
                        setFormData({ ...formData, stock_actual: e.target.value })
                        if (errors.stock_actual) setErrors({ ...errors, stock_actual: undefined })
                      }}
                      placeholder="0"
                      className={`input-field ${errors.stock_actual ? 'border-red-500 focus:ring-red-500' : ''}`}
                      aria-describedby={errors.stock_actual ? 'product-stock-actual-error' : undefined}
                      aria-invalid={!!errors.stock_actual}
                    />
                    {errors.stock_actual && (
                      <p id="product-stock-actual-error" className="mt-1.5 text-caption text-red-500 flex items-center gap-1" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        {errors.stock_actual}
                      </p>
                    )}
                  </div>
                  <div>
                    <label 
                      htmlFor="product-stock-minimo" 
                      className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5"
                    >
                      Stock mínimo <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="product-stock-minimo"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.stock_minimo}
                      onChange={(e) => {
                        setFormData({ ...formData, stock_minimo: e.target.value })
                        if (errors.stock_minimo) setErrors({ ...errors, stock_minimo: undefined })
                      }}
                      placeholder="5"
                      className={`input-field ${errors.stock_minimo ? 'border-red-500 focus:ring-red-500' : ''}`}
                      aria-describedby={errors.stock_minimo ? 'product-stock-minimo-error' : undefined}
                      aria-invalid={!!errors.stock_minimo}
                    />
                    {errors.stock_minimo && (
                      <p id="product-stock-minimo-error" className="mt-1.5 text-caption text-red-500 flex items-center gap-1" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        {errors.stock_minimo}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label 
                    htmlFor="product-category" 
                    className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5"
                  >
                    Categoría
                  </label>
                  <select
                    id="product-category"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-caption text-text-secondary-light dark:text-text-secondary-dark">Opcional: dejá vacío si no tiene categoría</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !isFormValid}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 touch-target py-3"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        Guardando...
                      </>
                    ) : editingProduct ? 'Actualizar' : 'Agregar'}
                  </button>
                  <button
                    type="button"
                    onClick={closeProductModal}
                    className="btn-ghost flex-1 touch-target py-3"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {isCategoryModalOpen && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
          >
            <div 
              ref={categoryModalRef}
              className="card w-full max-w-md shadow-elevation-4 animate-scale-in"
            >
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-surface-light dark:border-dark-200">
                <h2 id="category-modal-title" className="text-heading text-text-primary-light dark:text-text-primary-dark">Agregar categoría</h2>
                <button 
                  onClick={closeCategoryModal} 
                  className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-surface-light dark:hover:bg-dark-200 rounded-lg transition-colors duration-150 touch-target"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label 
                    htmlFor="category-name" 
                    className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5"
                  >
                    Nombre de la categoría <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="category-name"
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ej: Electrónica"
                    className="input-field"
                  />
                  <p className="mt-1.5 text-caption text-text-secondary-light dark:text-text-secondary-dark">Ingresa el nombre de la nueva categoría</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !newCategoryName.trim()}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2 touch-target py-3"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        Agregando...
                      </>
                    ) : 'Agregar categoría'}
                  </button>
                  <button
                    type="button"
                    onClick={closeCategoryModal}
                    className="btn-ghost flex-1 touch-target py-3"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stock Adjustment Modal */}
        {isStockModalOpen && stockAdjustProduct && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-modal-title"
          >
            <div 
              ref={stockModalRef}
              className="card w-full max-w-md shadow-elevation-4 animate-scale-in"
            >
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-surface-light dark:border-dark-200">
                <h2 id="stock-modal-title" className="text-heading text-text-primary-light dark:text-text-primary-dark">Ajustar Stock</h2>
                <button 
                  onClick={closeStockModal} 
                  className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-surface-light dark:hover:bg-dark-200 rounded-lg transition-colors duration-150 touch-target"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleStockSubmit} className="space-y-4">
                <div className="bg-surface-light dark:bg-dark-200/50 rounded-lg p-4">
                  <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Producto</p>
                  <p className="text-body font-medium text-text-primary-light dark:text-text-primary-dark">{stockAdjustProduct.name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`font-mono text-display font-bold ${getStockStatus(stockAdjustProduct) === 'sin_stock' ? 'text-red-500' : getStockStatus(stockAdjustProduct) === 'critico' ? 'text-orange-500' : getStockStatus(stockAdjustProduct) === 'bajo' ? 'text-yellow-500' : 'text-green-500'}`}>
                      Stock actual: {stockAdjustProduct.stock_actual ?? 0}
                    </span>
                    <span className={`badge ${getStockStatusColor(getStockStatus(stockAdjustProduct))} text-xs`}>
                      {getStockStatusLabel(getStockStatus(stockAdjustProduct))}
                    </span>
                  </div>
                  <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark mt-1">Stock mínimo: {stockAdjustProduct.stock_minimo ?? 5}</p>
                </div>
                <div>
                  <label 
                    htmlFor="stock-tipo" 
                    className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5"
                  >
                    Tipo de movimiento <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="stock-tipo"
                    value={stockFormData.tipo}
                    onChange={(e) => setStockFormData({ ...stockFormData, tipo: e.target.value as 'entrada' | 'salida' | 'ajuste' })}
                    className="input-field"
                  >
                    <option value="entrada">Entrada (sumar al stock)</option>
                    <option value="salida">Salida (restar del stock)</option>
                    <option value="ajuste">Ajuste (establecer valor exacto)</option>
                  </select>
                </div>
                <div>
                  <label 
                    htmlFor="stock-cantidad" 
                    className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5"
                  >
                    Cantidad <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="stock-cantidad"
                    type="number"
                    min="1"
                    step="1"
                    value={stockFormData.cantidad}
                    onChange={(e) => {
                      setStockFormData({ ...stockFormData, cantidad: e.target.value })
                      if (stockErrors.cantidad) setStockErrors({ ...stockErrors, cantidad: undefined })
                    }}
                    placeholder={stockFormData.tipo === 'ajuste' ? 'Nuevo valor de stock' : 'Cantidad a agregar/restar'}
                    className={`input-field ${stockErrors.cantidad ? 'border-red-500 focus:ring-red-500' : ''}`}
                    aria-describedby={stockErrors.cantidad ? 'stock-cantidad-error' : undefined}
                    aria-invalid={!!stockErrors.cantidad}
                  />
                  {stockErrors.cantidad && (
                    <p id="stock-cantidad-error" className="mt-1.5 text-caption text-red-500 flex items-center gap-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      {stockErrors.cantidad}
                    </p>
                  )}
                  <p className="mt-1.5 text-caption text-text-secondary-light dark:text-text-secondary-dark">
                    {stockFormData.tipo === 'entrada' && 'Se sumará al stock actual'}
                    {stockFormData.tipo === 'salida' && `Se restará del stock actual (máx: ${stockAdjustProduct.stock_actual})`}
                    {stockFormData.tipo === 'ajuste' && 'Establecerá el stock a este valor exacto'}
                  </p>
                </div>
                <div>
                  <label 
                    htmlFor="stock-motivo" 
                    className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5"
                  >
                    Motivo (opcional)
                  </label>
                  <input
                    id="stock-motivo"
                    type="text"
                    value={stockFormData.motivo}
                    onChange={(e) => setStockFormData({ ...stockFormData, motivo: e.target.value })}
                    placeholder="Ej: Recepción de mercadería, Venta, Inventario..."
                    className="input-field"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={stockSubmitting || !stockFormData.cantidad}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 touch-target py-3"
                  >
                    {stockSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        Guardando...
                      </>
                    ) : 'Aplicar ajuste'}
                  </button>
                  <button
                    type="button"
                    onClick={closeStockModal}
                    className="btn-ghost flex-1 touch-target py-3"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {isDetailModalOpen && selectedProduct && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-modal-title"
          >
            <div 
              ref={detailModalRef}
              className="card w-full max-w-md shadow-elevation-4 animate-scale-in max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-surface-light dark:border-dark-200">
                <h2 id="detail-modal-title" className="text-heading text-text-primary-light dark:text-text-primary-dark">Detalle del Producto</h2>
                <button 
                  onClick={closeDetailModal} 
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
                  <span className={`badge ${getCategoryColor(selectedProduct.category_id)}`}>
                    {getCategoryName(selectedProduct.category_id)}
                  </span>
                </div>
                <div>
                  <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Stock actual</p>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-display font-bold ${getStockStatus(selectedProduct) === 'sin_stock' ? 'text-red-500' : getStockStatus(selectedProduct) === 'critico' ? 'text-orange-500' : getStockStatus(selectedProduct) === 'bajo' ? 'text-yellow-500' : 'text-green-500'}`}>
                      {selectedProduct.stock_actual ?? 0}
                    </span>
                    <span className={`badge ${getStockStatusColor(getStockStatus(selectedProduct))}`}>
                      {getStockStatusLabel(getStockStatus(selectedProduct))}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Stock mínimo</p>
                  <p className="text-body font-medium text-text-primary-light dark:text-text-primary-dark">{selectedProduct.stock_minimo ?? 5}</p>
                </div>
                <div>
                  <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Fecha de creación</p>
                  <p className="text-body text-text-primary-light dark:text-text-primary-dark">
                    {new Date(selectedProduct.created_at).toLocaleDateString('es-AR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Fecha de actualización</p>
                  <p className="text-body text-text-primary-light dark:text-text-primary-dark">
                    {new Date(selectedProduct.updated_at).toLocaleDateString('es-AR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
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
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    closeDetailModal()
                    openEditModal(selectedProduct)
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 touch-target py-3"
                >
                  <Edit2 className="w-4 h-4" aria-hidden="true" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeDetailModal()
                    openStockModal(selectedProduct)
                  }}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 touch-target py-3"
                >
                  <Package className="w-4 h-4" aria-hidden="true" />
                  Ajustar Stock
                </button>
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="btn-ghost flex-1 touch-target py-3"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}