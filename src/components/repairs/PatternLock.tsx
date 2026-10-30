'use client'

import { useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'

interface PatternLockProps {
  value: number[]
  onChange?: (value: number[]) => void
  readOnly?: boolean
  size?: number
}

// Dots are numbered 1..9 row by row (top-left = 1, bottom-right = 9)
const GRID = 3
const VIEWBOX = 300
const STEP = VIEWBOX / GRID
const HIT_RADIUS = 34

const dotCenter = (n: number) => {
  const i = n - 1
  return { x: STEP / 2 + (i % GRID) * STEP, y: STEP / 2 + Math.floor(i / GRID) * STEP }
}

// Android adds the middle dot when the line passes straight over it (e.g. 1 -> 3 also selects 2)
const middleDot = (a: number, b: number): number | null => {
  const ca = dotCenter(a)
  const cb = dotCenter(b)
  const mx = (ca.x + cb.x) / 2
  const my = (ca.y + cb.y) / 2
  for (let n = 1; n <= 9; n++) {
    const c = dotCenter(n)
    if (n !== a && n !== b && c.x === mx && c.y === my) return n
  }
  return null
}

export default function PatternLock({ value, onChange, readOnly = false, size = 220 }: PatternLockProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
  // Pointer moves can fire faster than re-renders, so track the sequence being drawn here
  const seqRef = useRef<number[]>(value)

  const toSvgPoint = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * VIEWBOX,
      y: ((e.clientY - rect.top) / rect.height) * VIEWBOX,
    }
  }

  const hitDot = (p: { x: number; y: number }) => {
    for (let n = 1; n <= 9; n++) {
      const c = dotCenter(n)
      if (Math.hypot(c.x - p.x, c.y - p.y) <= HIT_RADIUS) return n
    }
    return null
  }

  const extend = (seq: number[], n: number) => {
    if (seq.includes(n)) return seq
    const last = seq[seq.length - 1]
    const mid = last ? middleDot(last, n) : null
    return mid && !seq.includes(mid) ? [...seq, mid, n] : [...seq, n]
  }

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly || !onChange) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toSvgPoint(e)
    const n = hitDot(p)
    setDrawing(true)
    setPointer(p)
    seqRef.current = n ? [n] : []
    onChange(seqRef.current)
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing || !onChange) return
    const p = toSvgPoint(e)
    setPointer(p)
    const n = hitDot(p)
    if (n) {
      const next = extend(seqRef.current, n)
      if (next !== seqRef.current) {
        seqRef.current = next
        onChange(next)
      }
    }
  }

  const handlePointerUp = () => {
    setDrawing(false)
    setPointer(null)
  }

  const points = value.map(dotCenter)
  const last = points[points.length - 1]

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        width={size}
        height={size}
        className={`rounded-xl bg-background-light dark:bg-dark border border-surface-light dark:border-dark-200 select-none ${readOnly ? '' : 'cursor-crosshair touch-none'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="img"
        aria-label={value.length ? `Patrón: ${value.join(' - ')}` : 'Patrón vacío'}
      >
        {points.length > 1 && (
          <polyline
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            className="stroke-secondary"
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.8}
          />
        )}
        {drawing && last && pointer && (
          <line x1={last.x} y1={last.y} x2={pointer.x} y2={pointer.y} className="stroke-secondary" strokeWidth={6} strokeLinecap="round" opacity={0.4} />
        )}
        {Array.from({ length: 9 }, (_, i) => {
          const n = i + 1
          const c = dotCenter(n)
          const order = value.indexOf(n)
          const active = order >= 0
          return (
            <g key={n}>
              <circle cx={c.x} cy={c.y} r={active ? 22 : 12} className={active ? 'fill-secondary' : 'fill-text-secondary-light/40 dark:fill-text-secondary-dark/40'} />
              {active && (
                <text x={c.x} y={c.y + 7} textAnchor="middle" fontSize={20} fontWeight={700} className="fill-white pointer-events-none">
                  {order + 1}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {!readOnly && (
        <div className="flex items-center gap-3 text-caption text-text-secondary-light dark:text-text-secondary-dark">
          <span>{value.length ? `Secuencia: ${value.join('-')}` : 'Dibujá el patrón'}</span>
          {value.length > 0 && (
            <button type="button" onClick={() => onChange?.([])} className="flex items-center gap-1 text-secondary hover:underline">
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Borrar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
