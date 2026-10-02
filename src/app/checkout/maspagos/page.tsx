'use client'

import { useState } from 'react'
// Note: router intentionally omitted — success state is shown inline
import { useCart } from '@/components/cart/cart-context'
import Link from 'next/link'
import {
    ArrowLeft,
    Loader2,
    CheckCircle2,
    AlertCircle,
    User,
    Mail,
    Phone,
    CreditCard,
    ExternalLink,
    Info,
} from 'lucide-react'

const fmt = (v: number) =>
    v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

export default function MasPagosCheckoutPage() {
    const { cart, total, clearCart } = useCart()

    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        paymentNotes: '',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState<{
        orderId: string
        paymentLink: string | null
    } | null>(null)
    const [apiError, setApiError] = useState<string | null>(null)

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.customerName.trim()) {
            newErrors.customerName = 'El nombre es requerido'
        }
        if (!formData.customerEmail.trim()) {
            newErrors.customerEmail = 'El email es requerido'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
            newErrors.customerEmail = 'Ingresá un email válido'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        if (cart.length === 0) return

        setLoading(true)
        setApiError(null)

        try {
            const res = await fetch('/api/maspagos/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.map((item) => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                    })),
                    customerName: formData.customerName,
                    customerEmail: formData.customerEmail,
                    customerPhone: formData.customerPhone,
                    paymentNotes: formData.paymentNotes,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Error al crear el pedido')
            }

            setSuccess({
                orderId: data.order.id,
                paymentLink: data.order.payment_link,
            })
            clearCart()
        } catch (error) {
            setApiError(error instanceof Error ? error.message : 'Error inesperado')
        } finally {
            setLoading(false)
        }
    }

    if (cart.length === 0 && !success) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 shadow-lg text-center max-w-md w-full">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Tu carrito está vacío
                    </h1>
                    <Link
                        href="/cart"
                        className="inline-flex items-center gap-2 mt-4 text-primary hover:underline text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al carrito
                    </Link>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 shadow-lg max-w-lg w-full space-y-6">
                    {/* Header success */}
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            ¡Pedido registrado!
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                            Pedido #{success.orderId.substring(0, 8).toUpperCase()}
                        </p>
                    </div>

                    {/* Link de pago (si ya está disponible) */}
                    {success.paymentLink ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Link de Pago disponible
                            </p>
                            <a
                                href={success.paymentLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full bg-[#003366] hover:bg-[#004488] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                Pagar con +Pagos Nación
                                <ExternalLink className="w-4 h-4" />
                            </a>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 text-center">
                                Serás redirigido al portal de pago seguro de Banco Nación
                            </p>
                        </div>
                    ) : (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-5">
                            <div className="flex gap-3">
                                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                        Tu pedido está en proceso
                                    </p>
                                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                        En breve recibirás el <strong>Link de Pago</strong> de +Pagos Nación
                                        al email registrado. También podés consultarlo directamente con el comercio.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info de la pasarela */}
                    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p className="flex items-center gap-2">
                            <span className="text-[#003366] dark:text-[#5599cc] font-bold">+</span>
                            Pagos procesados por <strong>+Pagos Nación (Nación Servicios S.A.)</strong>
                        </p>
                        <p className="text-xs text-gray-400">
                            El pago se acredita en aproximadamente 18 días hábiles.
                            Ante consultas: info@maspagos.com.ar
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Seguir comprando
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            {/* Breadcrumb */}
            <Link
                href="/cart"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver al carrito
            </Link>

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    {/* +Pagos Nación brand mark */}
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#003366] text-white font-black text-lg leading-none select-none">
                        +
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Pagar con +Pagos Nación
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Link de Pago · Nación Servicios S.A.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Form */}
                <div className="md:col-span-3">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
                            Datos de contacto
                        </h2>

                        {apiError && (
                            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-5">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nombre */}
                            <div>
                                <label
                                    htmlFor="mp-name"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                >
                                    <User className="inline w-4 h-4 mr-1.5 opacity-60" />
                                    Nombre completo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="mp-name"
                                    type="text"
                                    autoComplete="name"
                                    value={formData.customerName}
                                    onChange={(e) => {
                                        setFormData({ ...formData, customerName: e.target.value })
                                        if (errors.customerName)
                                            setErrors({ ...errors, customerName: '' })
                                    }}
                                    placeholder="Ej: María García"
                                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${errors.customerName
                                        ? 'border-red-400'
                                        : 'border-gray-200 dark:border-gray-700'
                                        }`}
                                />
                                {errors.customerName && (
                                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.customerName}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="mp-email"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                >
                                    <Mail className="inline w-4 h-4 mr-1.5 opacity-60" />
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="mp-email"
                                    type="email"
                                    autoComplete="email"
                                    value={formData.customerEmail}
                                    onChange={(e) => {
                                        setFormData({ ...formData, customerEmail: e.target.value })
                                        if (errors.customerEmail)
                                            setErrors({ ...errors, customerEmail: '' })
                                    }}
                                    placeholder="tu@email.com"
                                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${errors.customerEmail
                                        ? 'border-red-400'
                                        : 'border-gray-200 dark:border-gray-700'
                                        }`}
                                />
                                {errors.customerEmail && (
                                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.customerEmail}
                                    </p>
                                )}
                            </div>

                            {/* Teléfono */}
                            <div>
                                <label
                                    htmlFor="mp-phone"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                >
                                    <Phone className="inline w-4 h-4 mr-1.5 opacity-60" />
                                    Teléfono
                                    <span className="ml-2 text-xs text-gray-400">(opcional)</span>
                                </label>
                                <input
                                    id="mp-phone"
                                    type="tel"
                                    autoComplete="tel"
                                    value={formData.customerPhone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, customerPhone: e.target.value })
                                    }
                                    placeholder="+54 9 11 1234-5678"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
                                />
                            </div>

                            {/* Notas */}
                            <div>
                                <label
                                    htmlFor="mp-notes"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                >
                                    Notas del pedido
                                    <span className="ml-2 text-xs text-gray-400">(opcional)</span>
                                </label>
                                <textarea
                                    id="mp-notes"
                                    rows={2}
                                    value={formData.paymentNotes}
                                    onChange={(e) =>
                                        setFormData({ ...formData, paymentNotes: e.target.value })
                                    }
                                    placeholder="Indicaciones especiales, dirección de entrega, etc."
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                id="maspagos-checkout-submit"
                                className="w-full flex items-center justify-center gap-2 bg-[#003366] hover:bg-[#004488] disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-lg transition-colors mt-2 shadow-md"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <span className="font-black text-lg leading-none">+</span>
                                        Confirmar pedido con +Pagos Nación
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                                Al confirmar, crearemos tu pedido. Recibirás el Link de Pago para completar la transacción.
                            </p>
                        </form>
                    </div>
                </div>

                {/* Order summary */}
                <div className="md:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 sticky top-4">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                            Resumen del pedido
                        </h2>
                        <div className="space-y-2 mb-4">
                            {cart.map((item) => (
                                <div
                                    key={item.product_id}
                                    className="flex items-start justify-between gap-2 text-sm"
                                >
                                    <span className="text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">
                                        {item.product_name}
                                        <span className="text-gray-400 ml-1">×{item.quantity}</span>
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white flex-shrink-0">
                                        {fmt(item.subtotal)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Total
                            </span>
                            <span className="text-xl font-bold text-[#003366] dark:text-[#6699cc]">
                                {fmt(total)}
                            </span>
                        </div>

                        {/* Comisión info */}
                        <div className="mt-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            <p className="font-medium text-gray-600 dark:text-gray-300">
                                ℹ️ Información de pago
                            </p>
                            <p>Procesado por <strong>+Pagos Nación</strong> (Nación Servicios S.A.)</p>
                            <p>Comisión: ~3% · Acreditación: ~18 días hábiles</p>
                            <p className="text-gray-400">Sujeto a condiciones vigentes.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
