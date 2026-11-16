export function formatPriceARS(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(num)) return '$ 0,00'
  
  const [integerPart, decimalPart] = num.toFixed(2).split('.')
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  
  return `$ ${formattedInteger},${decimalPart}`
}
// Lowercase and strip accents so "Camára" and "camara" compare equal
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

const SEPARATORS = /[\s\-.#()/+]/g

/**
 * True when every word of the query appears (partially) in at least one field.
 * Case and accent insensitive; separators are ignored per field so
 * "3765123456" matches "3765 123456" and "42" matches "#000042".
 */
export function matchesSearch(fields: (string | number | null | undefined)[], query: string): boolean {
  const tokens = normalizeText(query).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true

  const values = fields.filter((f) => f !== null && f !== undefined && f !== '').map((f) => normalizeText(String(f)))
  const joined = values.join(' ')
  const compact = values.map((v) => v.replace(SEPARATORS, ''))

  return tokens.every((token) => {
    if (joined.includes(token)) return true
    const compactToken = token.replace(SEPARATORS, '')
    return compactToken !== '' && compact.some((v) => v.includes(compactToken))
  })
}
