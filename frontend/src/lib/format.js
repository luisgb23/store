// Símbolo que se antepone a los precios. Cambialo por el de tu moneda.
export const CURRENCY_SYMBOL = '$'

const priceFormatter = new Intl.NumberFormat('es-UY', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatPrice(value) {
  return `${CURRENCY_SYMBOL} ${priceFormatter.format(value)}`
}
