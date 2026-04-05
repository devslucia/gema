'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import { Product } from '@/types/product'
import { Category } from '@/types/category'
import { Plus, Trash2, X, Package, Folder, AlertCircle, Edit2, CheckCircle2, Loader2 } from 'lucide-react'
import { formatPriceARS } from '@/lib/utils'
import { toast } from 'sonner'

interface AdminDashboardProps {
  products: Product[]
  categories: Category[]
}

export default function AdminDashboard({
  products: initialProducts,
  categories: initialCategories,
}: AdminDashboardProps) {
  const supabase = createClient()
  const [productList, setProductList] = useState(initialProducts)
  const [categories, setCategories] = useState(initialCategories)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category_id: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; price?: string; category?: string }>({})
  const modalRef = useRef<HTMLDivElement>(null)
  const categoryModalRef = useRef<HTMLDivElement>(null)

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
    const newErrors: { name?: string; price?: string } = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }
    
    const price = parseFloat(formData.price)
    if (!formData.price || isNaN(price) || price < 0) {
      newErrors.price = 'Ingresa un precio válido'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateProductForm()) return
    
    setSubmitting(true)

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name.trim(),
          price: parseFloat(formData.price),
          category_id: formData.category_id || null,
        })
        .eq('id', editingProduct.id)

      if (!error) {
        setProductList(
          productList.map((p) =>
            p.id === editingProduct.id
              ? { ...p, name: formData.name.trim(), price: parseFloat(formData.price), category_id: formData.category_id || null }
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
        .insert({
          name: formData.name.trim(),
          price: parseFloat(formData.price),
          category_id: formData.category_id || null,
        })
        .select()

      if (!error && data) {
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
    setFormData({ name: '', price: '', category_id: '' })
    setErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category_id: product.category_id || '',
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const closeProductModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setFormData({ name: '', price: '', category_id: '' })
    setErrors({})
  }

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false)
    setNewCategoryName('')
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) closeProductModal()
        if (isCategoryModalOpen) closeCategoryModal()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (isModalOpen && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeProductModal()
      }
      if (isCategoryModalOpen && categoryModalRef.current && !categoryModalRef.current.contains(e.target as Node)) {
        closeCategoryModal()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isModalOpen, isCategoryModalOpen])

  const isFormValid = formData.name.trim() && formData.price && parseFloat(formData.price) >= 0

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2" aria-labelledby="products-heading">
            <div className="flex justify-between items-center mb-6">
              <h2 id="products-heading" className="text-heading text-text-primary-light dark:text-text-primary-dark">
                Productos
              </h2>
              <button
                onClick={openAddModal}
                className="btn-primary flex items-center gap-2 touch-target"
                aria-label="Agregar nuevo producto"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                Agregar producto
              </button>
            </div>

            <div className="card shadow-elevation-1 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-surface-light dark:divide-dark-200" aria-label="Lista de productos">
                  <thead className="bg-surface-light dark:bg-dark-200">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Nombre
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Precio
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Categoría
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-light dark:divide-dark-200">
                    {productList.map((product) => (
                      <tr key={product.id} className="hover:bg-surface-light dark:hover:bg-dark-200/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-body text-text-primary-light dark:text-text-primary-dark">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-body font-semibold text-primary">
                          {formatPriceARS(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge ${getCategoryColor(product.category_id)}`}>
                            {getCategoryName(product.category_id)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(product)}
                              className="btn-ghost flex items-center gap-1.5 touch-target"
                              aria-label={`Editar producto ${product.name}`}
                            >
                              <Edit2 className="w-4 h-4" aria-hidden="true" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                              onClick={() => handleProductDelete(product.id)}
                              className="btn-ghost flex items-center gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 touch-target"
                              aria-label={`Eliminar producto ${product.name}`}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                              <span className="hidden sm:inline">Eliminar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {productList.length === 0 && (
                <div className="text-center py-16 animate-fade-in" role="status" aria-live="polite">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-surface-light dark:bg-dark-200">
                      <Package className="w-12 h-12 text-text-secondary-light dark:text-text-secondary-dark" />
                    </div>
                  </div>
                  <p className="text-body text-text-secondary-light dark:text-text-secondary-dark">No hay productos todavía</p>
                  <p className="text-caption text-text-secondary-light/70 dark:text-text-secondary-dark/70 mt-1">Agregá tu primer producto</p>
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="categories-heading">
            <div className="flex justify-between items-center mb-6">
              <h2 id="categories-heading" className="text-heading text-text-primary-light dark:text-text-primary-dark">Categorías</h2>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="btn-secondary flex items-center gap-2 touch-target"
                aria-label="Agregar nueva categoría"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Agregar
              </button>
            </div>

            <div className="card shadow-elevation-1 overflow-hidden">
              <ul className="divide-y divide-surface-light dark:divide-dark-200" aria-label="Lista de categorías">
                {categories.map((category) => (
                  <li key={category.id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-light dark:hover:bg-dark-200/50 transition-colors duration-150">
                    <span className="text-body text-text-primary-light dark:text-text-primary-dark">{category.name}</span>
                    <button
                      onClick={() => handleCategoryDelete(category.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-150 touch-target"
                      aria-label={`Eliminar categoría ${category.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                {categories.length === 0 && (
                  <li className="px-6 py-12 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 rounded-full bg-surface-light dark:bg-dark-200">
                        <Folder className="w-6 h-6 text-text-secondary-light dark:text-text-secondary-dark" />
                      </div>
                    </div>
                    <p className="text-body text-text-secondary-light dark:text-text-secondary-dark">No hay categorías todavía</p>
                  </li>
                )}
              </ul>
            </div>
          </section>
        </div>
      </main>

      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <div 
            ref={modalRef}
            className="card max-w-md w-full shadow-elevation-4 animate-scale-in"
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-surface-light dark:border-dark-200">
              <h2 id="product-modal-title" className="text-heading text-text-primary-light dark:text-text-primary-dark">
                {editingProduct ? 'Editar producto' : 'Agregar producto'}
              </h2>
              <button 
                onClick={closeProductModal} 
                className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-surface-light dark:hover:bg-dark-200 rounded-lg transition-colors duration-150 touch-target"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="mb-5">
                <label 
                  htmlFor="product-name" 
                  className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-2"
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
                  <p id="product-name-error" className="mt-2 text-caption text-red-500 flex items-center gap-1" role="alert">
                    <AlertCircle className="w-4 h-4" aria-hidden="true" />
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="mb-5">
                <label 
                  htmlFor="product-price" 
                  className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-2"
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
                  <p id="product-price-error" className="mt-2 text-caption text-red-500 flex items-center gap-1" role="alert">
                    <AlertCircle className="w-4 h-4" aria-hidden="true" />
                    {errors.price}
                  </p>
                )}
              </div>
              <div className="mb-6">
                <label 
                  htmlFor="product-category" 
                  className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-2"
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
                <p className="mt-2 text-caption text-text-secondary-light dark:text-text-secondary-dark">Opcional: dejá vacío si no tiene categoría</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || !isFormValid}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
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
                  className="btn-ghost flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
        >
          <div 
            ref={categoryModalRef}
            className="card max-w-md w-full shadow-elevation-4 animate-scale-in"
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-surface-light dark:border-dark-200">
              <h2 id="category-modal-title" className="text-heading text-text-primary-light dark:text-text-primary-dark">Agregar categoría</h2>
              <button 
                onClick={closeCategoryModal} 
                className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-surface-light dark:hover:bg-dark-200 rounded-lg transition-colors duration-150 touch-target"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit}>
              <div className="mb-6">
                <label 
                  htmlFor="category-name" 
                  className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-2"
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
                <p className="mt-2 text-caption text-text-secondary-light dark:text-text-secondary-dark">Ingresa el nombre de la nueva categoría</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || !newCategoryName.trim()}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
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
                  className="btn-ghost flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}