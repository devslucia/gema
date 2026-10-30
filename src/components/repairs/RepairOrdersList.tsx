'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Plus, Search, Eye, Edit2, FileDown, X, Loader2, Wrench, AlertTriangle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPriceARS } from '@/lib/utils'
import { downloadRepairOrderPdf } from '@/lib/repairs/pdf'
import PatternLock from './PatternLock'
import {
  RepairOrder,
  RepairStatus,
  LOCK_TYPE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  formatOrderNumber,
} from '@/types/repair'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

function StatusSelect({ order, onChange, busy }: { order: RepairOrder; onChange: (s: RepairStatus) => void; busy: boolean }) {
  return (
    <select
      value={order.status}
      disabled={busy}
      onChange={(e) => onChange(e.target.value as RepairStatus)}
      onClick={(e) => e.stopPropagation()}
      className={`badge text-xs py-1 pl-2.5 pr-7 border-0 cursor-pointer focus:ring-2 focus:ring-primary disabled:opacity-60 ${STATUS_COLORS[order.status]}`}
      aria-label={`Estado de la orden ${formatOrderNumber(order.order_number)}`}
    >
      {(Object.keys(STATUS_LABELS) as RepairStatus[]).map((k) => (
        <option key={k} value={k}>{STATUS_LABELS[k]}</option>
      ))}
    </select>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">{label}</p>
      <div className="text-body text-text-primary-light dark:text-text-primary-dark whitespace-pre-wrap break-words">{children || '-'}</div>
    </div>
  )
}

export default function RepairOrdersList({ orders: initialOrders }: { orders: RepairOrder[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'all'>('all')
  const [viewing, setViewing] = useState<RepairOrder | null>(null)
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())

  useEffect(() => setOrders(initialOrders), [initialOrders])

  useEffect(() => {
    if (!viewing) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setViewing(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [viewing])

  const setBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev)
      if (busy) next.add(id)
      else next.delete(id)
      return next
    })

  const changeStatus = async (order: RepairOrder, status: RepairStatus) => {
    setBusy(order.id, true)
    const { data, error } = await createClient()
      .from('repair_orders')
      .update({ status })
      .eq('id', order.id)
      .select()
      .single()
    setBusy(order.id, false)

    if (error || !data) {
      toast.error(`No se pudo cambiar el estado: ${error?.message ?? ''}`)
      return
    }
    const updated = data as RepairOrder
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    setViewing((v) => (v && v.id === updated.id ? updated : v))
    toast.success(`${formatOrderNumber(updated.order_number)}: ${STATUS_LABELS[status]}`)
  }

  const downloadPdf = async (order: RepairOrder) => {
    setBusy(order.id, true)
    try {
      await downloadRepairOrderPdf(order)
    } catch (err) {
      console.error(err)
      toast.error('No se pudo generar el PDF')
    } finally {
      setBusy(order.id, false)
    }
  }

  const q = query.trim().toLowerCase()
  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (!q) return true
    return [
      formatOrderNumber(o.order_number),
      String(o.order_number),
      o.customer_name,
      o.customer_phone,
      o.device_brand,
      o.device_model,
      o.imei ?? '',
    ].some((v) => v.toLowerCase().includes(q))
  })

  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})

  const actions = (o: RepairOrder) => {
    const busy = busyIds.has(o.id)
    return (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setViewing(o)} className="btn-ghost p-2 touch-target flex items-center justify-center" aria-label={`Ver orden ${formatOrderNumber(o.order_number)}`} title="Ver">
          <Eye className="w-4 h-4" aria-hidden="true" />
        </button>
        <Link href={`/admin/repairs/${o.id}`} className="btn-ghost p-2 touch-target flex items-center justify-center" aria-label={`Editar orden ${formatOrderNumber(o.order_number)}`} title="Editar">
          <Edit2 className="w-4 h-4" aria-hidden="true" />
        </Link>
        <button onClick={() => downloadPdf(o)} disabled={busy} className="btn-ghost p-2 touch-target flex items-center justify-center text-secondary disabled:opacity-50" aria-label={`Descargar PDF de la orden ${formatOrderNumber(o.order_number)}`} title="Descargar PDF">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <FileDown className="w-4 h-4" aria-hidden="true" />}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-1 text-caption text-text-secondary-light dark:text-text-secondary-dark hover:text-primary mb-1">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Panel de administración
          </Link>
          <h1 className="text-heading sm:text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Órdenes de reparación</h1>
        </div>
        <Link href="/admin/repairs/new" className="btn-primary flex items-center justify-center gap-2 touch-target">
          <Plus className="w-5 h-5" aria-hidden="true" />
          Nueva orden
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="N°, cliente, teléfono, equipo, IMEI..." className="input-field pl-10" aria-label="Buscar órdenes" />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
          {(['all', ...Object.keys(STATUS_LABELS)] as (RepairStatus | 'all')[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              aria-pressed={statusFilter === s}
              className={`badge text-xs py-1.5 transition-colors ${statusFilter === s ? 'bg-secondary text-white' : 'bg-surface-light dark:bg-dark-100 text-text-secondary-light dark:text-text-secondary-dark hover:bg-secondary/10'}`}
            >
              {s === 'all' ? 'Todas' : STATUS_LABELS[s]}
              <span className="ml-1.5 opacity-70">{s === 'all' ? orders.length : counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-14" role="status">
            <div className="inline-flex p-4 rounded-full bg-background-light dark:bg-dark-200 mb-3">
              <Wrench className="w-10 h-10 text-text-secondary-light dark:text-text-secondary-dark" aria-hidden="true" />
            </div>
            <p className="text-body text-text-secondary-light dark:text-text-secondary-dark">
              {orders.length === 0 ? 'Todavía no hay órdenes de reparación' : 'No hay órdenes que coincidan con la búsqueda'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-background-light dark:divide-dark-200">
                <thead className="bg-background-light/60 dark:bg-dark-200">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                    <th className="px-4 py-3">N°</th>
                    <th className="px-4 py-3">Ingreso</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Equipo</th>
                    <th className="px-4 py-3 text-right">Presupuesto</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-background-light dark:divide-dark-200">
                  {filtered.map((o) => (
                    <tr key={o.id} onClick={() => setViewing(o)} className="hover:bg-background-light/60 dark:hover:bg-dark-200/50 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-secondary whitespace-nowrap">
                        {formatOrderNumber(o.order_number)}
                        {o.priority === 'urgent' && <AlertTriangle className="inline w-4 h-4 ml-1.5 text-red-500" aria-label="Urgente" />}
                      </td>
                      <td className="px-4 py-3 text-caption whitespace-nowrap text-text-secondary-light dark:text-text-secondary-dark">{formatDate(o.received_at)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{o.customer_name}</p>
                        <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">{o.customer_phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-text-primary-light dark:text-text-primary-dark">{o.device_brand} {o.device_model}</p>
                        <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark line-clamp-1 max-w-[16rem]">{o.issue}</p>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-text-primary-light dark:text-text-primary-dark">
                        {o.estimated_budget !== null ? formatPriceARS(o.estimated_budget) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusSelect order={o} busy={busyIds.has(o.id)} onChange={(s) => changeStatus(o, s)} />
                      </td>
                      <td className="px-4 py-3">{actions(o)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-background-light dark:divide-dark-200">
              {filtered.map((o) => (
                <article key={o.id} onClick={() => setViewing(o)} className="p-4 cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono font-semibold text-secondary">
                        {formatOrderNumber(o.order_number)}
                        {o.priority === 'urgent' && <span className="ml-2 text-xs font-sans text-red-500">URGENTE</span>}
                      </p>
                      <p className="font-medium text-text-primary-light dark:text-text-primary-dark truncate">{o.customer_name}</p>
                      <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark truncate">{o.device_brand} {o.device_model} · {formatDate(o.received_at)}</p>
                    </div>
                    <StatusSelect order={o} busy={busyIds.has(o.id)} onChange={(s) => changeStatus(o, s)} />
                  </div>
                  <div className="mt-2">{actions(o)}</div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {/* View modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="repair-view-title" onMouseDown={(e) => e.target === e.currentTarget && setViewing(null)}>
          <div className="card w-full max-w-2xl shadow-elevation-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-3 mb-4 pb-4 border-b border-background-light dark:border-dark-200">
              <div>
                <h2 id="repair-view-title" className="text-heading text-text-primary-light dark:text-text-primary-dark">
                  Orden <span className="font-mono text-secondary">{formatOrderNumber(viewing.order_number)}</span>
                </h2>
                <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">Ingreso: {formatDate(viewing.received_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusSelect order={viewing} busy={busyIds.has(viewing.id)} onChange={(s) => changeStatus(viewing, s)} />
                <button onClick={() => setViewing(null)} className="btn-ghost p-2 touch-target flex items-center justify-center" aria-label="Cerrar">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Detail label="Cliente">{viewing.customer_name}</Detail>
              <Detail label="Teléfono / WhatsApp">{viewing.customer_phone}</Detail>
              <Detail label="Email">{viewing.customer_email}</Detail>
              <Detail label="Equipo">{viewing.device_brand} {viewing.device_model}</Detail>
              <Detail label="IMEI / Serie"><span className="font-mono">{viewing.imei}</span></Detail>
              <Detail label="Bloqueo">
                {LOCK_TYPE_LABELS[viewing.lock_type]}
                {viewing.lock_notes && <span className="font-mono ml-2">({viewing.lock_notes})</span>}
              </Detail>
              {viewing.lock_type === 'pattern' && viewing.unlock_pattern?.length ? (
                <div className="sm:col-span-2">
                  <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark mb-1">Patrón</p>
                  <PatternLock value={viewing.unlock_pattern} readOnly size={140} />
                </div>
              ) : null}
              <Detail label="Falla">{viewing.issue}</Detail>
              <Detail label="Trabajo a realizar">{viewing.work_to_do}</Detail>
              <Detail label="Accesorios">{viewing.accessories.join(', ')}</Detail>
              <Detail label="Estado estético">{viewing.cosmetic_condition}</Detail>
              <Detail label="Presupuesto">{viewing.estimated_budget !== null ? formatPriceARS(viewing.estimated_budget) : null}</Detail>
              <Detail label="Seña">{viewing.deposit !== null ? formatPriceARS(viewing.deposit) : null}</Detail>
              <Detail label="Técnico">{viewing.technician}</Detail>
              <Detail label="Prioridad">{PRIORITY_LABELS[viewing.priority]}</Detail>
              <div className="sm:col-span-2">
                <Detail label="Observaciones internas">{viewing.internal_notes}</Detail>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link href={`/admin/repairs/${viewing.id}`} className="btn-primary flex-1 flex items-center justify-center gap-2 touch-target">
                <Edit2 className="w-4 h-4" aria-hidden="true" />
                Editar
              </Link>
              <button onClick={() => downloadPdf(viewing)} disabled={busyIds.has(viewing.id)} className="btn-secondary flex-1 flex items-center justify-center gap-2 touch-target">
                <FileDown className="w-4 h-4" aria-hidden="true" />
                Descargar PDF
              </button>
              <button onClick={() => setViewing(null)} className="btn-ghost flex-1 touch-target">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
