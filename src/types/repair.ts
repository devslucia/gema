export type LockType = 'none' | 'pin' | 'pattern' | 'fingerprint' | 'other'

export type RepairPriority = 'normal' | 'urgent'

export type RepairStatus = 'ingresado' | 'en_reparacion' | 'listo' | 'entregado' | 'cancelado'

export interface RepairOrder {
  id: string
  order_number: number
  received_at: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  device_brand: string
  device_model: string
  imei: string | null
  lock_type: LockType
  lock_notes: string | null
  unlock_pattern: number[] | null
  issue: string
  accessories: string[]
  cosmetic_condition: string | null
  work_to_do: string | null
  estimated_budget: number | null
  deposit: number | null
  technician: string | null
  priority: RepairPriority
  internal_notes: string | null
  status: RepairStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

// Fields editable from the form (the rest are set by the database)
export type RepairOrderInput = Omit<RepairOrder, 'id' | 'order_number' | 'created_by' | 'created_at' | 'updated_at'>

export const LOCK_TYPE_LABELS: Record<LockType, string> = {
  none: 'Sin bloqueo',
  pin: 'PIN / Contraseña',
  pattern: 'Patrón',
  fingerprint: 'Huella',
  other: 'Otro',
}

export const PRIORITY_LABELS: Record<RepairPriority, string> = {
  normal: 'Normal',
  urgent: 'Urgente',
}

export const STATUS_LABELS: Record<RepairStatus, string> = {
  ingresado: 'Ingresado',
  en_reparacion: 'En reparación',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const STATUS_COLORS: Record<RepairStatus, string> = {
  ingresado: 'bg-primary/20 text-primary-700 dark:bg-primary/30 dark:text-primary-100',
  en_reparacion: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  listo: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  entregado: 'bg-secondary/20 text-secondary-700 dark:bg-secondary/30 dark:text-secondary-100',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
}

export const COMMON_ACCESSORIES = ['Cargador', 'Cable', 'Funda', 'Chip / SIM', 'Tarjeta de memoria', 'Caja', 'Lápiz / Stylus']

export const STORE_INFO = {
  name: 'GEMA',
  tagline: 'Reparación & Accesorios',
  address: 'Av. Bartolomé Mitre 1772',
  phone: '+54 3765 222240',
}

export const LEGAL_TEXT =
  'El equipo se recibe en las condiciones descriptas en esta orden. GEMA no se responsabiliza por la pérdida de datos, ' +
  'ni por fallas preexistentes no detectadas al momento del ingreso o que surjan al abrir el equipo. El presupuesto es ' +
  'estimado y puede variar tras el diagnóstico; cualquier cambio será informado al cliente antes de realizarse. ' +
  'Pasados 90 días desde la notificación de equipo listo sin ser retirado, se considerará abandonado. ' +
  'Es indispensable presentar esta orden para retirar el equipo.'

export function formatOrderNumber(n: number): string {
  return `#${String(n).padStart(6, '0')}`
}
