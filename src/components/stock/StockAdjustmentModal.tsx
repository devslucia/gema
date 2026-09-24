'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface StockAdjustmentModalProps {
  productId: string
  currentStock: number
  onClose: () => void
  onStockUpdated: (newStock: number) => void
}

export default function StockAdjustmentModal({
  productId,
  currentStock,
  onClose,
  onStockUpdated,
}: StockAdjustmentModalProps) {
  const [quantity, setQuantity] = useState(currentStock)
  const [motivo, setMotivo] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newStock = quantity || currentStock

    if (isNaN(newStock) || newStock < 0) {
      toast.error('La cantidad debe ser un número válido')
      return
    }

    setIsSaving(true)

    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)

    if (error) {
      toast.error('Error al actualizar el stock: ' + error.message)
      setIsSaving(false)
      return
    }

    // Create stock movement record
    const { error: moveError } = await supabase
      .from('stock_movements')
      .insert({
        product_id: productId,
        tipo: 'ajuste',
        cantidad: Math.abs(newStock - currentStock),
        stock_anterior: currentStock,
        stock_nuevo: newStock,
        motivo: motivo || 'Ajuste de inventario',
        created_by: (await supabase.auth.getUser()).data.user?.id || null,
      })

    if (moveError) {
      toast.error('Error al registrar el movimiento: ' + moveError.message)
    } else {
      toast.success('Stock actualizado correctamente', {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      })
    }

    onStockUpdated(newStock)
    setIsSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="card max-w-md w-full shadow-elevation-4 animate-scale-in">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-surface-light dark:border-dark-200">
          <h2 className="text-heading text-text-primary-light dark:text-text-primary-dark">
            Ajuste de inventario
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-primary dark:hover:bg-surface-light dark:hover:bg-dark-200 rounded-lg transition-colors duration-150 touch-target"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Cantidad de stock
            </label>
            <input
              type="number"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || currentStock)}
              className={`input-field focus:shadow-elevation-2 min-h-[44px]`}
              min="0"
              placeholder={String(currentStock)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-body font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Inventario fisico, rotura, etc."
              className="input-field"
            />
          </div>

          <div className="mb-6">
            <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Stock actual: {currentStock}
            </p>
            <p className="text-caption text-primary font-medium">
              Nuevo stock: {quantity}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : 'Aplicar ajuste'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}