'use client'

import { useState, useEffect, useCallback } from 'react'
import { Order, OrderItem } from '@/types/product'
import {
    ShoppingBag, CheckCircle2, Clock, XCircle, RefreshCw,
    ExternalLink, Copy, Link2, ChevronDown, ChevronUp,
    Loader2, AlertTriangle, X, Check, Pencil
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderWithItems extends Order {
    order_items: OrderItem[]
}

const STATUS_CONFIG: Record<string, {
    label: string
    color: string
    icon: React.ReactNode
}> = {
    pending: {
        label: 'Pendiente de pago',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
        icon: <Clock className="w-3 h-3" />,
    },
    paid: {
        label: 'Pagado',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
        icon: <CheckCircle2 className="w-3 h-3" />,
    },
    cancelled: {
        label: 'Cancelado',
        color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
        icon: <XCircle className="w-3 h-3" />,
    },
    refunded: {
        label: 'Reembolsado',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300',
        icon: <RefreshCw className="w-3 h-3" />,
    },
    expired: {
        label: 'Expirado',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
        icon: <AlertTriangle className="w-3 h-3" />,
    },
}

const fmt = (v: number) =>
    v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_CONFIG[status] ?? {
        label: status,
        color: 'bg-gray-100 text-gray-700',
        icon: null,
    }
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
            {s.icon}
            {s.label}
        </span>
    )
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    const handleCopy = async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={copied ? 'Copiado!' : 'Copiar'}
        >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    )
}

// ─── Order Row ────────────────────────────────────────────────────────────────

function MasPagosOrderRow({
    order,
    onUpdate,
}: {
    order: OrderWithItems
    onUpdate: () => void
}) {
    const [expanded, setExpanded] = useState(false)
    const [editLinkOpen, setEditLinkOpen] = useState(false)
    const [newLink, setNewLink] = useState(order.payment_link ?? '')
    const [newExtId, setNewExtId] = useState(order.external_payment_id ?? '')
    const [confirmModalOpen, setConfirmModalOpen] = useState(false)
    const [confirmExtId, setConfirmExtId] = useState('')
    const [saving, setSaving] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [cancelling, setCancelling] = useState(false)

    // ─ Actualizar link de pago ─
    const handleSaveLink = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/maspagos/link', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    paymentLink: newLink,
                    externalPaymentId: newExtId,
                }),
            })
            if (!res.ok) {
                const d = await res.json()
                throw new Error(d.error || 'Error al guardar')
            }
            toast.success('Link de pago actualizado')
            setEditLinkOpen(false)
            onUpdate()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    // ─ Confirmar pago ─
    const handleConfirmPayment = async () => {
        setConfirming(true)
        try {
            const res = await fetch('/api/maspagos/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    externalPaymentId: confirmExtId,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error al confirmar')

            if (data.stockErrors?.length) {
                toast.warning(`Pago confirmado ⚠️ Revisar stock: ${data.stockErrors.join(', ')}`)
            } else {
                toast.success('Pedido confirmado como pagado. Stock descontado.')
            }
            setConfirmModalOpen(false)
            onUpdate()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al confirmar')
        } finally {
            setConfirming(false)
        }
    }

    // ─ Cancelar / expirar ─
    const handleSetStatus = async (status: 'cancelled' | 'expired') => {
        setCancelling(true)
        try {
            const res = await fetch('/api/maspagos/link', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, status }),
            })
            if (!res.ok) {
                const d = await res.json()
                throw new Error(d.error || 'Error')
            }
            toast.success(
                status === 'cancelled' ? 'Pedido cancelado' : 'Pedido marcado como expirado'
            )
            onUpdate()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error')
        } finally {
            setCancelling(false)
        }
    }

    const isPending = order.status === 'pending'
    const isPaid = order.status === 'paid'

    return (
        <>
            {/* Main row */}
            <tr
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => setExpanded((v) => !v)}
            >
                {/* ID */}
                <td className="py-3 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                    {order.id.substring(0, 8)}…
                </td>

                {/* Cliente */}
                <td className="py-3 px-4">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {order.customer_name || '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {order.customer_email || ''}
                    </p>
                </td>

                {/* Total */}
                <td className="py-3 px-4 font-semibold text-[#003366] dark:text-[#6699cc] text-sm">
                    {fmt(order.total)}
                </td>

                {/* Estado */}
                <td className="py-3 px-4">
                    <StatusBadge status={order.status} />
                </td>

                {/* Link de pago */}
                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    {order.payment_link ? (
                        <div className="flex items-center gap-1">
                            <a
                                href={order.payment_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 max-w-[140px] truncate"
                                title={order.payment_link}
                            >
                                <Link2 className="w-3 h-3 flex-shrink-0" />
                                {new URL(order.payment_link).hostname}
                            </a>
                            <CopyButton text={order.payment_link} />
                            <a
                                href={order.payment_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            >
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                            Sin link
                        </span>
                    )}
                </td>

                {/* Fecha */}
                <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })}
                </td>

                {/* Expand */}
                <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                        onClick={() => setExpanded((v) => !v)}
                    >
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </td>
            </tr>

            {/* Expanded detail row */}
            {expanded && (
                <tr className="bg-gray-50/80 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                    <td colSpan={7} className="px-6 py-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left: order items */}
                            <div>
                                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3">
                                    Productos del pedido
                                </p>
                                {order.order_items.length === 0 ? (
                                    <p className="text-sm text-gray-400">Sin ítems</p>
                                ) : (
                                    <div className="space-y-2">
                                        {order.order_items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-700 dark:text-gray-200 font-medium">
                                                    {item.product_name}
                                                </span>
                                                <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                                                    <span>×{item.quantity}</span>
                                                    <span>{fmt(item.unit_price)}</span>
                                                    <span className="font-semibold text-[#003366] dark:text-[#6699cc]">
                                                        {fmt(item.subtotal)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {order.customer_phone && (
                                    <p className="mt-3 text-xs text-gray-500">
                                        📞 {order.customer_phone}
                                    </p>
                                )}
                                {order.payment_notes && (
                                    <p className="mt-2 text-xs text-gray-500">
                                        📋 {order.payment_notes}
                                    </p>
                                )}
                                {order.external_payment_id && (
                                    <p className="mt-2 text-xs text-gray-500 font-mono">
                                        🧾 ID Transacción: {order.external_payment_id}
                                    </p>
                                )}
                            </div>

                            {/* Right: acciones */}
                            <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                    Acciones del admin
                                </p>

                                {/* Editar link */}
                                {!isPaid && (
                                    <>
                                        {!editLinkOpen ? (
                                            <button
                                                onClick={() => setEditLinkOpen(true)}
                                                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                {order.payment_link ? 'Editar Link de Pago' : '+ Agregar Link de Pago'}
                                            </button>
                                        ) : (
                                            <div className="space-y-2">
                                                <input
                                                    type="url"
                                                    value={newLink}
                                                    onChange={(e) => setNewLink(e.target.value)}
                                                    placeholder="https://pago.maspagos.com.ar/..."
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                                />
                                                <input
                                                    type="text"
                                                    value={newExtId}
                                                    onChange={(e) => setNewExtId(e.target.value)}
                                                    placeholder="ID de transacción +Pagos (opcional)"
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleSaveLink}
                                                        disabled={saving}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003366] hover:bg-[#004488] text-white rounded-lg text-xs font-medium disabled:opacity-60"
                                                    >
                                                        {saving
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : <Check className="w-3.5 h-3.5" />}
                                                        Guardar
                                                    </button>
                                                    <button
                                                        onClick={() => setEditLinkOpen(false)}
                                                        className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs rounded-lg border border-gray-200 dark:border-gray-700"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Confirmar pago */}
                                {isPending && (
                                    <>
                                        <button
                                            onClick={() => setConfirmModalOpen(true)}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors w-full justify-center"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Confirmar pago recibido
                                        </button>

                                        <div className="flex gap-2">
                                            <button
                                                disabled={cancelling}
                                                onClick={() => handleSetStatus('cancelled')}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium disabled:opacity-60"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                Cancelar
                                            </button>
                                            <button
                                                disabled={cancelling}
                                                onClick={() => handleSetStatus('expired')}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors font-medium disabled:opacity-60"
                                            >
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                Expirado
                                            </button>
                                        </div>
                                    </>
                                )}

                                {isPaid && (
                                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Pago confirmado · Stock descontado
                                    </div>
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            )}

            {/* Modal de confirmación de pago */}
            {confirmModalOpen && (
                <tr>
                    <td colSpan={7} className="p-0">
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Confirmar pago recibido
                                    </h3>
                                    <button
                                        onClick={() => setConfirmModalOpen(false)}
                                        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
                                    ⚠️ Esta acción <strong>descuenta el stock</strong> de todos los productos
                                    del pedido y no se puede deshacer fácilmente. Verificá el pago en la
                                    app +Pagos Nación antes de confirmar.
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        ID de transacción +Pagos Nación
                                        <span className="ml-2 text-xs text-gray-400">(opcional pero recomendado)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmExtId}
                                        onChange={(e) => setConfirmExtId(e.target.value)}
                                        placeholder="Ej: TRX-123456789"
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/40"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleConfirmPayment}
                                        disabled={confirming}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
                                    >
                                        {confirming
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <CheckCircle2 className="w-4 h-4" />}
                                        Confirmar pago
                                    </button>
                                    <button
                                        onClick={() => setConfirmModalOpen(false)}
                                        className="px-4 py-2.5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'pending' | 'paid' | 'cancelled' | 'expired' | 'refunded'

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'paid', label: 'Pagados' },
    { value: 'cancelled', label: 'Cancelados' },
    { value: 'expired', label: 'Expirados' },
]

export default function MasPagosAdminPage() {
    const [orders, setOrders] = useState<OrderWithItems[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

    const fetchOrders = useCallback(async () => {
        setLoading(true)
        try {
            const url =
                statusFilter === 'all'
                    ? '/api/orders?status=all'
                    : `/api/orders?status=${statusFilter}`

            const res = await fetch(url)
            const data = await res.json()

            // Filtrar solo pedidos de maspagos
            const masPagosOrders = (data.orders || []).filter(
                (o: OrderWithItems) => o.payment_provider === 'maspagos'
            )
            setOrders(masPagosOrders)
        } catch (err) {
            console.error('[MasPagos Admin] Error fetching:', err)
        } finally {
            setLoading(false)
        }
    }, [statusFilter])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    const counts = orders.reduce(
        (acc, o) => {
            const s = o.status as keyof typeof acc
            acc[s] = (acc[s] ?? 0) + 1
            return acc
        },
        { pending: 0, paid: 0, cancelled: 0, expired: 0, refunded: 0 }
    )
    const totalRevenue = orders
        .filter((o) => o.status === 'paid')
        .reduce((s, o) => s + o.total, 0)

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#003366] text-white font-black text-lg">
                            +
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Pedidos +Pagos Nación
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Gestión de pagos con Link de Pago · Nación Servicios S.A.
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Actualizar
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Pendientes',
                        value: counts.pending,
                        color: 'text-yellow-600',
                        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
                        icon: <Clock className="w-5 h-5 text-yellow-500" />,
                    },
                    {
                        label: 'Pagados',
                        value: counts.paid,
                        color: 'text-green-600',
                        bg: 'bg-green-50 dark:bg-green-900/20',
                        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
                    },
                    {
                        label: 'Cancelados',
                        value: counts.cancelled,
                        color: 'text-red-600',
                        bg: 'bg-red-50 dark:bg-red-900/20',
                        icon: <XCircle className="w-5 h-5 text-red-500" />,
                    },
                    {
                        label: 'Expirados',
                        value: counts.expired,
                        color: 'text-orange-600',
                        bg: 'bg-orange-50 dark:bg-orange-900/20',
                        icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
                    },
                ].map((card) => (
                    <div
                        key={card.label}
                        className={`rounded-xl p-4 ${card.bg} border border-gray-100 dark:border-gray-800`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            {card.icon}
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {card.label}
                            </span>
                        </div>
                        <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Revenue banner */}
            <div className="bg-gradient-to-r from-[#003366] to-[#005599] rounded-xl p-5 text-white shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-white/80">
                        Ingresos confirmados (+Pagos Nación)
                    </p>
                    <p className="text-3xl font-bold mt-1">{fmt(totalRevenue)}</p>
                    <p className="text-xs text-white/60 mt-1">
                        {counts.paid} pedido{counts.paid !== 1 ? 's' : ''} pagado{counts.paid !== 1 ? 's' : ''}
                    </p>
                </div>
                <span className="text-6xl font-black text-white/10 select-none">+</span>
            </div>

            {/* Manual link workflow notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">ℹ️ Flujo de gestión manual (sin API privada)</p>
                <ol className="list-decimal ml-4 mt-1 space-y-1 text-blue-700 dark:text-blue-300/80 text-xs">
                    <li>El cliente realiza el pedido desde el checkout → queda en estado <strong>Pendiente</strong></li>
                    <li>Generá el Link de Pago desde la <strong>app +Pagos</strong> o el portal <a href="https://micomercio.maspagos.com.ar" target="_blank" rel="noopener noreferrer" className="underline">micomercio.maspagos.com.ar</a></li>
                    <li>Pegá el link en el pedido → hacé clic en <strong>&quot;Editar Link de Pago&quot;</strong> → Guardá</li>
                    <li>Compartí el link al cliente (WhatsApp, email, etc.)</li>
                    <li>Cuando el pago se acredite, hacé clic en <strong>&quot;Confirmar pago recibido&quot;</strong> → el stock se descuenta automáticamente</li>
                </ol>
            </div>

            {/* Orders table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                {/* Status tabs */}
                <div className="flex flex-wrap gap-1 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === tab.value
                                ? 'bg-[#003366] text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Table */}
                {loading ? (
                    <div className="py-16 text-center">
                        <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando pedidos...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="py-16 text-center">
                        <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No hay pedidos de +Pagos Nación para este filtro
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800">
                                    {['ID', 'Cliente', 'Total', 'Estado', 'Link de Pago', 'Fecha', ''].map((h) => (
                                        <th
                                            key={h}
                                            className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <MasPagosOrderRow
                                        key={order.id}
                                        order={order}
                                        onUpdate={fetchOrders}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && orders.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
                        {orders.length} pedido{orders.length !== 1 ? 's' : ''} de +Pagos Nación
                    </div>
                )}
            </div>
        </div>
    )
}
