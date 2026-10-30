import type { jsPDF as JsPDF } from 'jspdf'
import { formatPriceARS } from '@/lib/utils'
import {
  RepairOrder,
  LOCK_TYPE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STORE_INFO,
  LEGAL_TEXT,
  formatOrderNumber,
} from '@/types/repair'

// A4 portrait, millimeters
const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 14
const CONTENT_W = PAGE_W - MARGIN * 2

// GEMA brand colors (tailwind primary / secondary)
const PRIMARY: [number, number, number] = [41, 212, 245]
const SECONDARY: [number, number, number] = [123, 79, 191]
const TEXT: [number, number, number] = [26, 26, 46]
const MUTED: [number, number, number] = [100, 100, 125]
const BORDER: [number, number, number] = [210, 212, 225]

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch('/logo.png')
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function money(value: number | null) {
  return value === null || value === undefined ? '-' : formatPriceARS(value)
}

async function buildPdf(order: RepairOrder): Promise<JsPDF> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const logo = await loadLogo()
  let y = MARGIN

  const ensureSpace = (h: number) => {
    if (y + h > PAGE_H - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  const sectionTitle = (title: string) => {
    ensureSpace(12)
    doc.setFillColor(...SECONDARY)
    doc.rect(MARGIN, y, 1.2, 5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(...SECONDARY)
    doc.text(title.toUpperCase(), MARGIN + 3.5, y + 4)
    y += 8
  }

  // Label/value pair; returns height used
  const field = (label: string, value: string, x: number, width: number, top: number) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(label, x, top)
    doc.setFontSize(10)
    doc.setTextColor(...TEXT)
    const lines = doc.splitTextToSize(value || '-', width) as string[]
    doc.text(lines, x, top + 4.5)
    return 4.5 + lines.length * 4.6
  }

  // Row of fields laid out in equal columns
  const fieldRow = (items: [string, string][], totalWidth = CONTENT_W) => {
    const colW = totalWidth / items.length
    const heights = items.map(([, value]) => {
      doc.setFontSize(10)
      return 4.5 + (doc.splitTextToSize(value || '-', colW - 4) as string[]).length * 4.6
    })
    ensureSpace(Math.max(...heights) + 2)
    const used = items.map(([label, value], i) => field(label, value, MARGIN + i * colW, colW - 4, y + 3))
    y += Math.max(...used) + 2
  }

  const textBox = (label: string, value: string | null) => {
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(value?.trim() || '-', CONTENT_W - 6) as string[]
    const h = 7 + lines.length * 4.6
    ensureSpace(h + 3)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.roundedRect(MARGIN, y, CONTENT_W, h, 1.5, 1.5, 'S')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(label, MARGIN + 3, y + 4)
    doc.setFontSize(10)
    doc.setTextColor(...TEXT)
    doc.text(lines, MARGIN + 3, y + 8.5)
    y += h + 3
  }

  // ── Header ────────────────────────────────────────────────────────────────
  const logoH = 22
  const logoW = logoH * (474 / 526)
  if (logo) doc.addImage(logo, 'PNG', MARGIN, y, logoW, logoH)
  const brandX = MARGIN + (logo ? logoW + 4 : 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...TEXT)
  doc.text(STORE_INFO.name, brandX, y + 8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...SECONDARY)
  doc.text(STORE_INFO.tagline, brandX, y + 13.5)
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  doc.text(`${STORE_INFO.address}  ·  Tel/WhatsApp: ${STORE_INFO.phone}`, brandX, y + 19)

  const rightX = PAGE_W - MARGIN
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text('ORDEN DE REPARACIÓN', rightX, y + 4, { align: 'right' })
  doc.setFontSize(18)
  doc.setTextColor(...TEXT)
  doc.text(formatOrderNumber(order.order_number), rightX, y + 11.5, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Ingreso: ${formatDateTime(order.received_at)}`, rightX, y + 17, { align: 'right' })
  if (order.priority === 'urgent') {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(200, 30, 30)
    doc.text('URGENTE', rightX, y + 22, { align: 'right' })
  }

  y += logoH + 4
  doc.setFillColor(...PRIMARY)
  doc.rect(MARGIN, y, CONTENT_W, 1, 'F')
  doc.setFillColor(...SECONDARY)
  doc.rect(MARGIN + CONTENT_W * 0.7, y, CONTENT_W * 0.3, 1, 'F')
  y += 6

  // ── Customer ──────────────────────────────────────────────────────────────
  sectionTitle('Datos del cliente')
  fieldRow([
    ['Nombre y apellido', order.customer_name],
    ['Teléfono / WhatsApp', order.customer_phone],
    ['Email', order.customer_email || '-'],
  ])
  y += 2

  // ── Device (pattern drawn on the right when present) ──────────────────────
  sectionTitle('Datos del equipo')
  const hasPattern = order.lock_type === 'pattern' && (order.unlock_pattern?.length ?? 0) > 0
  const patternSize = 34
  const deviceW = hasPattern ? CONTENT_W - patternSize - 8 : CONTENT_W
  ensureSpace(hasPattern ? patternSize + 6 : 30)
  const deviceTop = y
  fieldRow([
    ['Marca / Modelo', `${order.device_brand} ${order.device_model}`.trim()],
    ['IMEI / N° de serie', order.imei || '-'],
  ], deviceW)
  fieldRow([
    ['Tipo de bloqueo', LOCK_TYPE_LABELS[order.lock_type]],
    ['Técnico asignado', order.technician || '-'],
    ['Prioridad', PRIORITY_LABELS[order.priority]],
  ], deviceW)
  fieldRow([['Accesorios recibidos', order.accessories.length ? order.accessories.join(', ') : 'Ninguno']], deviceW)
  fieldRow([['Estado estético del equipo', order.cosmetic_condition || '-']], deviceW)

  if (hasPattern) {
    drawPattern(doc, order.unlock_pattern!, PAGE_W - MARGIN - patternSize, deviceTop + 2, patternSize)
    y = Math.max(y, deviceTop + patternSize + 8)
  }
  y += 2

  // ── Issue / work ──────────────────────────────────────────────────────────
  sectionTitle('Falla y trabajo')
  textBox('Falla / descripción del problema', order.issue)
  textBox('Trabajo a realizar', order.work_to_do)

  // ── Budget ────────────────────────────────────────────────────────────────
  sectionTitle('Presupuesto')
  ensureSpace(16)
  const balance =
    order.estimated_budget !== null ? order.estimated_budget - (order.deposit ?? 0) : null
  const boxW = (CONTENT_W - 6) / 3
  const amounts: [string, string, boolean][] = [
    ['Presupuesto estimado', money(order.estimated_budget), false],
    ['Seña / anticipo', money(order.deposit), false],
    ['Saldo a abonar', money(balance), true],
  ]
  amounts.forEach(([label, value, highlight], i) => {
    const x = MARGIN + i * (boxW + 3)
    if (highlight) {
      doc.setFillColor(243, 236, 255)
      doc.roundedRect(x, y, boxW, 13, 1.5, 1.5, 'F')
    }
    doc.setDrawColor(...(highlight ? SECONDARY : BORDER))
    doc.roundedRect(x, y, boxW, 13, 1.5, 1.5, 'S')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(label, x + 3, y + 4.5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...(highlight ? SECONDARY : TEXT))
    doc.text(value, x + 3, y + 10.5)
  })
  y += 18

  // ── Legal + signatures (kept together) ────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  const legalLines = doc.splitTextToSize(LEGAL_TEXT, CONTENT_W) as string[]
  ensureSpace(legalLines.length * 3.4 + 38)
  doc.setTextColor(...MUTED)
  doc.text(legalLines, MARGIN, y)
  y += legalLines.length * 3.4 + 22

  const sigW = (CONTENT_W - 20) / 2
  ;[['Firma del cliente', MARGIN], ['Firma del técnico', MARGIN + sigW + 20]].forEach(([label, x]) => {
    doc.setDrawColor(...TEXT)
    doc.setLineWidth(0.3)
    doc.line(x as number, y, (x as number) + sigW, y)
    doc.setFontSize(8.5)
    doc.setTextColor(...TEXT)
    doc.text(label as string, x as number, y + 4.5)
    doc.setTextColor(...MUTED)
    doc.text('Aclaración:', x as number, y + 10)
  })
  y += 14

  // ── Footer on every page ──────────────────────────────────────────────────
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(
      `${STORE_INFO.name} ${STORE_INFO.tagline} · Orden ${formatOrderNumber(order.order_number)} · Estado: ${STATUS_LABELS[order.status]} · Emitido ${formatDateTime(new Date().toISOString())}`,
      MARGIN,
      PAGE_H - 7
    )
    if (pages > 1) doc.text(`${i}/${pages}`, PAGE_W - MARGIN, PAGE_H - 7, { align: 'right' })
  }

  return doc
}

function drawPattern(doc: JsPDF, pattern: number[], x: number, y: number, size: number) {
  const step = size / 3
  const center = (n: number) => ({
    cx: x + step / 2 + ((n - 1) % 3) * step,
    cy: y + step / 2 + Math.floor((n - 1) / 3) * step,
  })

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, size, size, 2, 2, 'S')

  doc.setDrawColor(...SECONDARY)
  doc.setLineWidth(1.2)
  for (let i = 1; i < pattern.length; i++) {
    const a = center(pattern[i - 1])
    const b = center(pattern[i])
    doc.line(a.cx, a.cy, b.cx, b.cy)
  }

  for (let n = 1; n <= 9; n++) {
    const { cx, cy } = center(n)
    const order = pattern.indexOf(n)
    if (order >= 0) {
      doc.setFillColor(...SECONDARY)
      doc.circle(cx, cy, 2.6, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(255, 255, 255)
      doc.text(String(order + 1), cx, cy + 1, { align: 'center' })
    } else {
      doc.setFillColor(...BORDER)
      doc.circle(cx, cy, 1.4, 'F')
    }
  }

  // Start marker label
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...MUTED)
  doc.text('Patrón (1 = inicio)', x + size / 2, y + size + 4, { align: 'center' })
}

export async function downloadRepairOrderPdf(order: RepairOrder) {
  const doc = await buildPdf(order)
  doc.save(`orden-${String(order.order_number).padStart(6, '0')}.pdf`)
}

export async function printRepairOrderPdf(order: RepairOrder) {
  const doc = await buildPdf(order)
  doc.autoPrint()
  window.open(doc.output('bloburl'), '_blank')
}
