export function formatPriceARS(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(num)) return '$ 0,00'
  
  const [integerPart, decimalPart] = num.toFixed(2).split('.')
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  
  return `$ ${formattedInteger},${decimalPart}`
}