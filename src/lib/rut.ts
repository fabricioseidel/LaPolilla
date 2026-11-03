/** RUT chileno: limpieza, dígito verificador (módulo 11) y formato 12.345.678-5. */

/** Deja sólo dígitos y la K del dígito verificador. */
export const cleanRut = (rut: string) => rut.replace(/[^0-9kK]/g, '').toUpperCase()

/** Dígito verificador de un cuerpo de RUT (sólo números). */
export function rutCheckDigit(body: string): string {
  let sum = 0
  let factor = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }
  const rest = 11 - (sum % 11)
  return rest === 11 ? '0' : rest === 10 ? 'K' : String(rest)
}

/** true si el RUT tiene un cuerpo de 7 u 8 dígitos y su dígito verificador es correcto. */
export function isValidRut(rut: string): boolean {
  const clean = cleanRut(rut).replace(/^0+/, '')
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false
  return rutCheckDigit(clean.slice(0, -1)) === clean.slice(-1)
}

/** "123456785" o "12345678-5" → "12.345.678-5". Si no hay suficientes caracteres, lo deja limpio. */
export function formatRut(rut: string): string {
  const clean = cleanRut(rut).replace(/^0+/, '')
  if (clean.length < 2) return clean
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${body}-${clean.slice(-1)}`
}
