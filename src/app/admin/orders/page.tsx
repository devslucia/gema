"use client"

import { useState, useEffect, useCallback } from 'react'
import { Order, OrderItem } from '@/types/product'
import {
  ShoppingBag, CheckCircle2, Clock, XCircle, RefreshCw,
  TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Search, X
} from 'lucide-react'

type StatusFilter = 'all' | 'pending' | 'paid' | 'cancelled' | 'refunded'

interface OrderWithItems extends Order {
  order_items: OrderItem[]
}

interface TopProduct {
  product_id: string
  product_name: string
  total_qty: number
  total_revenue: number
}

interface LowStockProduct {
  id: string
  name: string
  stock_actual: number
  stock_minimo: number
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', icon: <Clock className="w-3 h-3" /> },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: <XCircle className="w-3 h-3" /> },
  refunded: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: <RefreshCw className="w-3 h-3" /> },
}

const fmt = (value: number) =>
  value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: 'bg-gray-100 text-gray-700', icon: null }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
      {s.icon}
      {s.label}
    </span>
  )
}

function OrderRow({ order }: { order: OrderWithItems }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="py-3 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">
          {order.id.substring(0, 8)}…
        </td>
        <td className="py-3 px-4">
          <p className="font-medium text-gray-900 dark:text-white text-sm">{order.customer_name || '—'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{order.customer_email || ''}</p>
        </td>
        <td className="py-3 px-4 font-semibold text-primary text-sm">{fmt(order.total)}</td>
        <td className="py-3 px-4"><StatusBadge status={order.status} /></td>
        <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
          {new Date(order.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </td>
        <td className="py-3 px-4 text-center">
          <button
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            aria-label={expanded ? 'Colapsar detalle' : 'Ver detalle'}
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50/80 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
          <td colSpan={6} className="px-6 py-4">
            <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3">Productos del pedido</p>
            {order.order_items.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Sin ítems registrados</p>
            ) : (
              <div className="space-y-2">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-200 font-medium">{item.product_name}</span>
                    <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                      <span>x{item.quantity}</span>
                      <span>{fmt(item.unit_price)} c/u</span>
                      <span className="font-semibold text-primary">{fmt(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {order.customer_phone && (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                📞 {order.customer_phone}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async (status: StatusFilter) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders?status=${status}`)
      const data = await res.json()
      setOrders(data.orders || [])
      setTopProducts(data.topProducts || [])
      setLowStock(data.lowStockProducts || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(statusFilter)
  }, [statusFilter, fetchData])

  const filteredOrders = orders.filter((order) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      order.id.toLowerCase().includes(q) ||
      (order.customer_name || '').toLowerCase().includes(q) ||
      (order.customer_email || '').toLowerCase().includes(q)
    )
  })

  // Summary counters (from ALL loaded orders regardless of search)
  const counts = orders.reduce(
    (acc, o) => {
      acc[o.status as keyof typeof acc] = (acc[o.status as keyof typeof acc] ?? 0) + 1
      return acc
    },
    { pending: 0, paid: 0, cancelled: 0, refunded: 0 }
  )
  const totalRevenue = orders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.total, 0)

  const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'paid', label: 'Pagados' },
    { value: 'cancelled', label: 'Cancelados' },
    { value: 'refunded', label: 'Reembolsados' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Pedidos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión y seguimiento de todos los pedidos
          </p>
        </div>
        <button
          onClick={() => fetchData(statusFilter)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pendientes', value: counts.pending, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: <Clock className="w-5 h-5 text-yellow-500" /> },
          { label: 'Pagados', value: counts.paid, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', icon: <CheckCircle2 className="w-5 h-5 text-green-500" /> },
          { label: 'Cancelados', value: counts.cancelled, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', icon: <XCircle className="w-5 h-5 text-red-500" /> },
          { label: 'Reembolsados', value: counts.refunded, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800', icon: <RefreshCw className="w-5 h-5 text-gray-500" /> },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl p-4 ${card.bg} border border-gray-100 dark:border-gray-800`}>
            <div className="flex items-center gap-2 mb-2">{card.icon}<span className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.label}</span></div>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue + Analytics row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-primary to-primary/80 rounded-xl p-5 text-white shadow-lg">
          <p className="text-sm font-medium text-white/80 mb-1">Ingreso de pedidos pagados</p>
          <p className="text-3xl font-bold">{fmt(totalRevenue)}</p>
          <p className="text-xs text-white/60 mt-2">{counts.paid} pedido{counts.paid !== 1 ? 's' : ''} confirmado{counts.paid !== 1 ? 's' : ''}</p>
        </div>

        {/* Top products */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Productos más vendidos</h2>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Sin datos todavía</p>
          ) : (
            <ol className="space-y-2">
              {topProducts.map((p, i) => (
                <li key={p.product_id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="truncate text-gray-700 dark:text-gray-200">{p.product_name}</span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">{p.total_qty} u.</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Low stock */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Stock bajo / Agotados</h2>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-green-600 dark:text-green-400">✓ Todo el stock es suficiente</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-gray-700 dark:text-gray-200">{p.name}</span>
                  <span className={`flex-shrink-0 ml-2 font-semibold ${p.stock_actual === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                    {p.stock_actual === 0 ? 'Sin stock' : `${p.stock_actual} u.`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        {/* Filters row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === tab.value
                    ? 'bg-primary text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, ID..."
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No hay pedidos para este filtro</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['ID', 'Cliente', 'Total', 'Estado', 'Fecha', ''].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && filteredOrders.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
            Mostrando {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}
            {search ? ` para "${search}"` : ''}
          </div>
        )}
      </div>
    </div>
  )
}