'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types/product'
import { CheckCircle2, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface StockEntryModalProps {
  productId: string
  currentStock: number
  onClose: () => void
  onStockUpdated: (newStock: number) => void
}

export default function StockEntryModal({
  productId,
  currentStock,
  onClose,
  onStockUpdated,
}: StockEntryModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [motivo, setMotivo] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!quantity || quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    setIsSaving(true)
    const newStock = currentStock + quantity

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
        tipo: 'entrada',
        cantidad: quantity,
        stock_anterior: currentStock,
        stock_nuevo: newStock,
        motivo: motivo || 'Entrada de stock',
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
            Entrada de stock
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
              Cantidad a agregar
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className={`input-field focus:shadow-elevation-2 min-h-[44px]`}
              placeholder="1"
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
              placeholder="Ej: Nueva mercancía recibida"
              className="input-field"
            />
          </div>

          <div className="mb-6">
            <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Stock actual: {currentStock}
            </p>
            <p className="text-caption text-primary font-medium">
              Nuevo stock: {currentStock + quantity}
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
              ) : 'Registrar entrada'}
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