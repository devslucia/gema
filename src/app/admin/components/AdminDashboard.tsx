'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import { Product } from '@/types/product'
import { Category } from '@/types/category'
import { Plus, Trash2, X, Package, Folder, AlertCircle, Edit2 } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)
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
    
    setLoading(true)

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
        toast.success('Producto actualizado correctamente')
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
        toast.success('Producto agregado correctamente')
      }
    }

    setLoading(false)
    closeProductModal()
  }

  const handleProductDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return

    const { error } = await supabase.from('products').delete().eq('id', id)

    if (!error) {
      setProductList(productList.filter((p) => p.id !== id))
      toast.success('Producto eliminado correctamente')
    } else {
      toast.error('Error al eliminar el producto')
    }
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

    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newCategoryName.trim() })
      .select()

    if (!error && data) {
      setCategories([...categories, data[0]])
      setNewCategoryName('')
      setIsCategoryModalOpen(false)
      toast.success('Categoría agregada correctamente')
    } else {
      toast.error('Error al agregar la categoría')
    }
    setLoading(false)
  }

  const handleCategoryDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría? Los productos que la usen quedarán sin categoría.')) return

    const { error } = await supabase.from('categories').delete().eq('id', id)

    if (!error) {
      setCategories(categories.filter((c) => c.id !== id))
      toast.success('Categoría eliminada correctamente')
    } else {
      toast.error('Error al eliminar la categoría')
    }
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2" aria-labelledby="products-heading">
            <div className="flex justify-between items-center mb-6">
              <h2 id="products-heading" className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">Productos</h2>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-lg shadow-primary/30 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Agregar nuevo producto"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Agregar producto
              </button>
            </div>

            <div className="bg-surface-light dark:bg-dark-100 rounded-xl shadow overflow-hidden border border-primary/10 dark:border-dark-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-surface-light dark:divide-dark-200" aria-label="Lista de productos">
                  <thead className="bg-surface-light dark:bg-dark-200">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Nombre
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Precio
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Categoría
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-light dark:divide-dark-200">
                    {productList.map((product) => (
                      <tr key={product.id} className="hover:bg-surface-light dark:hover:bg-dark-200/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary-light dark:text-text-primary-dark">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                          {formatPriceARS(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(product.category_id)}`}>
                            {getCategoryName(product.category_id)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => openEditModal(product)}
                            className="text-primary hover:text-primary/70 mr-4 inline-flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                            aria-label={`Editar producto ${product.name}`}
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleProductDelete(product.id)}
                            className="text-red-500 hover:text-red-400 inline-flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded"
                            aria-label={`Eliminar producto ${product.name}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {productList.length === 0 && (
                <div className="text-center py-12" role="status" aria-live="polite">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-surface-light dark:bg-dark-200">
                      <Package className="w-10 h-10 text-text-secondary-light dark:text-text-secondary-dark" />
                    </div>
                  </div>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark">No hay productos todavía</p>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">Agregá tu primer producto</p>
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="categories-heading">
            <div className="flex justify-between items-center mb-6">
              <h2 id="categories-heading" className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">Categorías</h2>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/90 text-white rounded-lg transition-colors shadow-lg shadow-secondary/30 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                aria-label="Agregar nueva categoría"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Agregar
              </button>
            </div>

            <div className="bg-surface-light dark:bg-dark-100 rounded-xl shadow overflow-hidden border border-secondary/10 dark:border-dark-200">
              <ul className="divide-y divide-surface-light dark:divide-dark-200" aria-label="Lista de categorías">
                {categories.map((category) => (
                  <li key={category.id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-light dark:hover:bg-dark-200/50 transition-colors">
                    <span className="text-sm text-text-primary-light dark:text-text-primary-dark">{category.name}</span>
                    <button
                      onClick={() => handleCategoryDelete(category.id)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      aria-label={`Eliminar categoría ${category.name}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
                {categories.length === 0 && (
                  <li className="px-6 py-8 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 rounded-full bg-surface-light dark:bg-dark-200">
                        <Folder className="w-6 h-6 text-text-secondary-light dark:text-text-secondary-dark" />
                      </div>
                    </div>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">No hay categorías todavía</p>
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
            className="bg-surface-light dark:bg-dark-100 rounded-xl p-6 max-w-md w-full shadow-xl border border-primary/20 dark:border-dark-200"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 id="product-modal-title" className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                {editingProduct ? 'Editar producto' : 'Agregar producto'}
              </h2>
              <button 
                onClick={closeProductModal} 
                className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark focus-visible:ring-2 focus-visible:ring-primary rounded"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="mb-4">
                <label 
                  htmlFor="product-name" 
                  className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2"
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
                  className={`w-full px-4 py-2.5 border rounded-lg bg-surface-light dark:bg-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                    errors.name ? 'border-red-500' : 'border-surface-light dark:border-dark-200'
                  }`}
                  aria-describedby={errors.name ? 'product-name-error' : undefined}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p id="product-name-error" className="mt-1 text-sm text-red-500 flex items-center gap-1" role="alert">
                    <AlertCircle className="w-4 h-4" aria-hidden="true" />
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label 
                  htmlFor="product-price" 
                  className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2"
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
                  className={`w-full px-4 py-2.5 border rounded-lg bg-surface-light dark:bg-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                    errors.price ? 'border-red-500' : 'border-surface-light dark:border-dark-200'
                  }`}
                  aria-describedby={errors.price ? 'product-price-error' : undefined}
                  aria-invalid={!!errors.price}
                />
                {errors.price && (
                  <p id="product-price-error" className="mt-1 text-sm text-red-500 flex items-center gap-1" role="alert">
                    <AlertCircle className="w-4 h-4" aria-hidden="true" />
                    {errors.price}
                  </p>
                )}
              </div>
              <div className="mb-6">
                <label 
                  htmlFor="product-category" 
                  className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2"
                >
                  Categoría
                </label>
                <select
                  id="product-category"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-surface-light dark:border-dark-200 rounded-lg bg-surface-light dark:bg-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">Opcional: dejá vacío si no tiene categoría</p>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {loading ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Agregar'}
                </button>
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="flex-1 py-2.5 bg-surface-light dark:bg-dark-200 text-text-primary-light dark:text-text-primary-dark hover:bg-surface-light dark:hover:bg-dark-300 font-medium rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
            className="bg-surface-light dark:bg-dark-100 rounded-xl p-6 max-w-md w-full shadow-xl border border-secondary/20 dark:border-dark-200"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 id="category-modal-title" className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">Agregar categoría</h2>
              <button 
                onClick={closeCategoryModal} 
                className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark focus-visible:ring-2 focus-visible:ring-secondary rounded"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit}>
              <div className="mb-6">
                <label 
                  htmlFor="category-name" 
                  className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2"
                >
                  Nombre de la categoría <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="category-name"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej: Electrónica"
                  className="w-full px-4 py-2.5 border border-surface-light dark:border-dark-200 rounded-lg bg-surface-light dark:bg-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary"
                />
                <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">Ingresa el nombre de la nueva categoría</p>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !newCategoryName.trim()}
                  className="flex-1 py-2.5 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                >
                  {loading ? 'Agregando...' : 'Agregar categoría'}
                </button>
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="flex-1 py-2.5 bg-surface-light dark:bg-dark-200 text-text-primary-light dark:text-text-primary-dark hover:bg-surface-light dark:hover:bg-dark-300 font-medium rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
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
