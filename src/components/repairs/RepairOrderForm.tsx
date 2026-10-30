'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Save, Eraser, FileDown, Printer, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { downloadRepairOrderPdf, printRepairOrderPdf } from '@/lib/repairs/pdf'
import PatternLock from './PatternLock'
import {
  RepairOrder,
  RepairOrderInput,
  LockType,
  RepairPriority,
  RepairStatus,
  LOCK_TYPE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  COMMON_ACCESSORIES,
  formatOrderNumber,
} from '@/types/repair'

interface FormState {
  received_at: string
  customer_name: string
  customer_phone: string
  customer_email: string
  device_brand: string
  device_model: string
  imei: string
  lock_type: LockType
  lock_notes: string
  unlock_pattern: number[]
  issue: string
  accessories: string[]
  accessories_other: string
  cosmetic_condition: string
  work_to_do: string
  estimated_budget: string
  deposit: string
  technician: string
  priority: RepairPriority
  internal_notes: string
  status: RepairStatus
}

type Errors = Partial<Record<keyof FormState, string>>

// <input type="datetime-local"> works with local time without timezone
const toLocalInput = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const emptyForm = (): FormState => ({
  received_at: toLocalInput(new Date().toISOString()),
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  device_brand: '',
  device_model: '',
  imei: '',
  lock_type: 'none',
  lock_notes: '',
  unlock_pattern: [],
  issue: '',
  accessories: [],
  accessories_other: '',
  cosmetic_condition: '',
  work_to_do: '',
  estimated_budget: '',
  deposit: '',
  technician: '',
  priority: 'normal',
  internal_notes: '',
  status: 'ingresado',
})

const fromOrder = (o: RepairOrder): FormState => ({
  received_at: toLocalInput(o.received_at),
  customer_name: o.customer_name,
  customer_phone: o.customer_phone,
  customer_email: o.customer_email ?? '',
  device_brand: o.device_brand,
  device_model: o.device_model,
  imei: o.imei ?? '',
  lock_type: o.lock_type,
  lock_notes: o.lock_notes ?? '',
  unlock_pattern: o.unlock_pattern ?? [],
  issue: o.issue,
  accessories: o.accessories.filter((a) => COMMON_ACCESSORIES.includes(a)),
  accessories_other: o.accessories.filter((a) => !COMMON_ACCESSORIES.includes(a)).join(', '),
  cosmetic_condition: o.cosmetic_condition ?? '',
  work_to_do: o.work_to_do ?? '',
  estimated_budget: o.estimated_budget?.toString() ?? '',
  deposit: o.deposit?.toString() ?? '',
  technician: o.technician ?? '',
  priority: o.priority,
  internal_notes: o.internal_notes ?? '',
  status: o.status,
})

const nullIfEmpty = (v: string) => (v.trim() ? v.trim() : null)
const amountOrNull = (v: string) => (v.trim() === '' ? null : parseFloat(v))

const toInput = (f: FormState): RepairOrderInput => ({
  received_at: new Date(f.received_at).toISOString(),
  customer_name: f.customer_name.trim(),
  customer_phone: f.customer_phone.trim(),
  customer_email: nullIfEmpty(f.customer_email),
  device_brand: f.device_brand.trim(),
  device_model: f.device_model.trim(),
  imei: nullIfEmpty(f.imei),
  lock_type: f.lock_type,
  lock_notes: f.lock_type === 'pin' || f.lock_type === 'other' ? nullIfEmpty(f.lock_notes) : null,
  unlock_pattern: f.lock_type === 'pattern' && f.unlock_pattern.length ? f.unlock_pattern : null,
  issue: f.issue.trim(),
  accessories: [
    ...f.accessories,
    ...f.accessories_other.split(',').map((a) => a.trim()).filter(Boolean),
  ],
  cosmetic_condition: nullIfEmpty(f.cosmetic_condition),
  work_to_do: nullIfEmpty(f.work_to_do),
  estimated_budget: amountOrNull(f.estimated_budget),
  deposit: amountOrNull(f.deposit),
  technician: nullIfEmpty(f.technician),
  priority: f.priority,
  internal_notes: nullIfEmpty(f.internal_notes),
  status: f.status,
})

function validate(f: FormState): Errors {
  const e: Errors = {}
  if (!f.received_at || isNaN(new Date(f.received_at).getTime())) e.received_at = 'Fecha inválida'
  if (!f.customer_name.trim()) e.customer_name = 'Requerido'
  if (!f.customer_phone.trim()) e.customer_phone = 'Requerido'
  if (f.customer_email.trim() && !/^\S+@\S+\.\S+$/.test(f.customer_email.trim())) e.customer_email = 'Email inválido'
  if (!f.device_brand.trim()) e.device_brand = 'Requerido'
  if (!f.device_model.trim()) e.device_model = 'Requerido'
  if (!f.issue.trim()) e.issue = 'Describí la falla'
  for (const key of ['estimated_budget', 'deposit'] as const) {
    const v = f[key].trim()
    if (v !== '' && (isNaN(parseFloat(v)) || parseFloat(v) < 0)) e[key] = 'Monto inválido'
  }
  return e
}

const labelClass = 'block text-caption font-medium text-text-primary-light dark:text-text-primary-dark mb-1'
const sectionTitleClass = 'text-subheading font-semibold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2'

function Field({ label, error, required, children, className = '' }: { label: string; error?: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className={labelClass}>
        {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
        {children}
      </label>
      {error && (
        <p className="mt-1 text-caption text-red-500 flex items-center gap-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

interface RepairOrderFormProps {
  order?: RepairOrder
}

export default function RepairOrderForm({ order }: RepairOrderFormProps) {
  const router = useRouter()
  const [saved, setSaved] = useState<RepairOrder | undefined>(order)
  // Baseline for a new order (keeps its timestamp so "dirty" doesn't change as time passes)
  const [blank, setBlank] = useState<FormState>(emptyForm)
  const [form, setForm] = useState<FormState>(() => (order ? fromOrder(order) : blank))
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(saved ? fromOrder(saved) : blank),
    [form, saved, blank]
  )

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const inputClass = (key: keyof FormState) =>
    `input-field py-2.5 mt-1 font-normal ${errors[key] ? 'border-red-500 focus:ring-red-500' : ''}`

  const toggleAccessory = (a: string) =>
    set('accessories', form.accessories.includes(a) ? form.accessories.filter((x) => x !== a) : [...form.accessories, a])

  const budget = parseFloat(form.estimated_budget) || 0
  const deposit = parseFloat(form.deposit) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate(form)
    setErrors(v)
    if (Object.keys(v).length) {
      toast.error('Revisá los campos marcados')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const payload = toInput(form)
    const query = saved
      ? supabase.from('repair_orders').update(payload).eq('id', saved.id)
      : supabase.from('repair_orders').insert(payload)
    const { data, error } = await query.select().single()
    setSaving(false)

    if (error || !data) {
      toast.error(`Error al guardar: ${error?.message ?? 'sin respuesta'}`)
      return
    }

    const result = data as RepairOrder
    setSaved(result)
    setForm(fromOrder(result))
    toast.success(`Orden ${formatOrderNumber(result.order_number)} guardada`, {
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    })
    if (!saved) router.replace(`/admin/repairs/${result.id}`)
    router.refresh()
  }

  const handleClear = () => {
    if (isDirty && !confirm(saved ? '¿Descartar los cambios sin guardar?' : '¿Limpiar todos los campos del formulario?')) return
    if (saved) {
      setForm(fromOrder(saved))
    } else {
      const fresh = emptyForm()
      setBlank(fresh)
      setForm(fresh)
    }
    setErrors({})
  }

  const runPdf = async (fn: (o: RepairOrder) => Promise<void>) => {
    if (!saved) return
    setPdfBusy(true)
    try {
      await fn(saved)
    } catch (err) {
      console.error(err)
      toast.error('No se pudo generar el PDF')
    } finally {
      setPdfBusy(false)
    }
  }

  const pdfDisabled = !saved || isDirty || pdfBusy
  const pdfTitle = !saved ? 'Guardá la orden para generar el PDF' : isDirty ? 'Guardá los cambios antes de generar el PDF' : undefined

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <Link href="/admin/repairs" className="inline-flex items-center gap-1 text-caption text-text-secondary-light dark:text-text-secondary-dark hover:text-primary mb-1">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Órdenes de reparación
          </Link>
          <h1 className="text-heading sm:text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Ingreso – Orden de Reparación
          </h1>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-caption text-text-secondary-light dark:text-text-secondary-dark">N° de orden</p>
          <p className="font-mono text-heading font-bold text-secondary">
            {saved ? formatOrderNumber(saved.order_number) : 'Se asigna al guardar'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Order + customer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="card">
            <h2 className={sectionTitleClass}>Cliente</h2>
            <div className="space-y-4">
              <Field label="Nombre y apellido" required error={errors.customer_name}>
                <input className={inputClass('customer_name')} value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} placeholder="Ej: Juan Pérez" autoComplete="off" />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Teléfono / WhatsApp" required error={errors.customer_phone}>
                  <input type="tel" className={inputClass('customer_phone')} value={form.customer_phone} onChange={(e) => set('customer_phone', e.target.value)} placeholder="Ej: 3765 123456" />
                </Field>
                <Field label="Email (opcional)" error={errors.customer_email}>
                  <input type="email" className={inputClass('customer_email')} value={form.customer_email} onChange={(e) => set('customer_email', e.target.value)} placeholder="cliente@mail.com" />
                </Field>
              </div>
              <Field label="Fecha y hora de ingreso" required error={errors.received_at}>
                <input type="datetime-local" className={inputClass('received_at')} value={form.received_at} onChange={(e) => set('received_at', e.target.value)} />
              </Field>
            </div>
          </section>

          <section className="card">
            <h2 className={sectionTitleClass}>Equipo</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Marca" required error={errors.device_brand}>
                  <input className={inputClass('device_brand')} value={form.device_brand} onChange={(e) => set('device_brand', e.target.value)} placeholder="Ej: Samsung" />
                </Field>
                <Field label="Modelo" required error={errors.device_model}>
                  <input className={inputClass('device_model')} value={form.device_model} onChange={(e) => set('device_model', e.target.value)} placeholder="Ej: Galaxy A32" />
                </Field>
              </div>
              <Field label="IMEI / N° de serie">
                <input className={`${inputClass('imei')} font-mono`} value={form.imei} onChange={(e) => set('imei', e.target.value)} placeholder="Marcá *#06# para ver el IMEI" />
              </Field>
              <Field label="Tipo de bloqueo">
                <select className={inputClass('lock_type')} value={form.lock_type} onChange={(e) => set('lock_type', e.target.value as LockType)}>
                  {(Object.keys(LOCK_TYPE_LABELS) as LockType[]).map((k) => (
                    <option key={k} value={k}>{LOCK_TYPE_LABELS[k]}</option>
                  ))}
                </select>
              </Field>
              {(form.lock_type === 'pin' || form.lock_type === 'other') && (
                <Field label={form.lock_type === 'pin' ? 'PIN / contraseña' : 'Detalle del bloqueo'}>
                  <input className={`${inputClass('lock_notes')} font-mono`} value={form.lock_notes} onChange={(e) => set('lock_notes', e.target.value)} placeholder="Uso interno, no se imprime" />
                </Field>
              )}
              {form.lock_type === 'pattern' && (
                <div>
                  <p className={labelClass}>Patrón de desbloqueo</p>
                  <PatternLock value={form.unlock_pattern} onChange={(v) => set('unlock_pattern', v)} />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Reception */}
        <section className="card">
          <h2 className={sectionTitleClass}>Recepción</h2>
          <div className="space-y-4">
            <Field label="Falla / descripción del problema" required error={errors.issue}>
              <textarea rows={3} className={inputClass('issue')} value={form.issue} onChange={(e) => set('issue', e.target.value)} placeholder="Ej: No carga, se apaga solo, pantalla con líneas..." />
            </Field>
            <fieldset>
              <legend className={labelClass}>Accesorios recibidos</legend>
              <div className="flex flex-wrap gap-2 mt-1">
                {COMMON_ACCESSORIES.map((a) => {
                  const checked = form.accessories.includes(a)
                  return (
                    <label
                      key={a}
                      className={`badge cursor-pointer select-none border text-caption ${checked ? 'bg-secondary text-white border-secondary' : 'bg-transparent border-surface-light dark:border-dark-200 text-text-secondary-light dark:text-text-secondary-dark hover:border-secondary/50'}`}
                    >
                      <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleAccessory(a)} />
                      {a}
                    </label>
                  )
                })}
              </div>
              <input className={`${inputClass('accessories_other')} mt-2`} value={form.accessories_other} onChange={(e) => set('accessories_other', e.target.value)} placeholder="Otros (separados por coma)" aria-label="Otros accesorios" />
            </fieldset>
            <Field label="Estado estético del equipo">
              <textarea rows={2} className={inputClass('cosmetic_condition')} value={form.cosmetic_condition} onChange={(e) => set('cosmetic_condition', e.target.value)} placeholder="Ej: Rayones en tapa trasera, golpe en esquina superior, pantalla astillada..." />
            </Field>
          </div>
        </section>

        {/* Work + budget + internal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="card">
            <h2 className={sectionTitleClass}>Trabajo y presupuesto</h2>
            <div className="space-y-4">
              <Field label="Trabajo a realizar">
                <textarea rows={3} className={inputClass('work_to_do')} value={form.work_to_do} onChange={(e) => set('work_to_do', e.target.value)} placeholder="Ej: Cambio de módulo y diagnóstico de placa" />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Presupuesto estimado ($)" error={errors.estimated_budget}>
                  <input type="number" min="0" step="0.01" className={inputClass('estimated_budget')} value={form.estimated_budget} onChange={(e) => set('estimated_budget', e.target.value)} placeholder="0,00" />
                </Field>
                <Field label="Seña / anticipo ($)" error={errors.deposit}>
                  <input type="number" min="0" step="0.01" className={inputClass('deposit')} value={form.deposit} onChange={(e) => set('deposit', e.target.value)} placeholder="Opcional" />
                </Field>
              </div>
              {form.estimated_budget !== '' && (
                <p className={`text-caption ${deposit > budget ? 'text-red-500' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                  Saldo a abonar: <span className="font-semibold">{(budget - deposit).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
                  {deposit > budget && ' (la seña supera el presupuesto)'}
                </p>
              )}
            </div>
          </section>

          <section className="card">
            <h2 className={sectionTitleClass}>Gestión interna</h2>
            <div className="space-y-4">
              <Field label="Técnico asignado">
                <input className={inputClass('technician')} value={form.technician} onChange={(e) => set('technician', e.target.value)} placeholder="Nombre del técnico" />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Prioridad">
                  <select className={inputClass('priority')} value={form.priority} onChange={(e) => set('priority', e.target.value as RepairPriority)}>
                    {(Object.keys(PRIORITY_LABELS) as RepairPriority[]).map((k) => (
                      <option key={k} value={k}>{PRIORITY_LABELS[k]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Estado de la orden">
                  <select className={inputClass('status')} value={form.status} onChange={(e) => set('status', e.target.value as RepairStatus)}>
                    {(Object.keys(STATUS_LABELS) as RepairStatus[]).map((k) => (
                      <option key={k} value={k}>{STATUS_LABELS[k]}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Observaciones internas">
                <textarea rows={3} className={inputClass('internal_notes')} value={form.internal_notes} onChange={(e) => set('internal_notes', e.target.value)} placeholder="No se imprimen en el PDF" />
              </Field>
            </div>
          </section>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 z-10 -mx-4 sm:mx-0 px-4 py-3 sm:rounded-xl bg-surface-light/95 dark:bg-dark-100/95 backdrop-blur border-t sm:border border-surface-light dark:border-dark-200 shadow-elevation-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
          <button type="button" onClick={handleClear} className="btn-ghost flex items-center justify-center gap-2 touch-target">
            <Eraser className="w-4 h-4" aria-hidden="true" />
            {saved ? 'Descartar cambios' : 'Limpiar formulario'}
          </button>
          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" onClick={() => runPdf(printRepairOrderPdf)} disabled={pdfDisabled} title={pdfTitle} className="btn-ghost flex items-center justify-center gap-2 touch-target disabled:opacity-50 disabled:cursor-not-allowed">
              <Printer className="w-4 h-4" aria-hidden="true" />
              Imprimir
            </button>
            <button type="button" onClick={() => runPdf(downloadRepairOrderPdf)} disabled={pdfDisabled} title={pdfTitle} className="btn-secondary flex items-center justify-center gap-2 touch-target">
              {pdfBusy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <FileDown className="w-4 h-4" aria-hidden="true" />}
              Descargar PDF
            </button>
            <button type="submit" disabled={saving || (!!saved && !isDirty)} className="btn-primary flex items-center justify-center gap-2 touch-target">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
              {saved ? 'Guardar cambios' : 'Guardar orden'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
