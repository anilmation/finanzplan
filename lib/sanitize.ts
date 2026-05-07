// Input sanitization utilities

export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // basic XSS prevention
}

export function sanitizeNumber(input: unknown, min?: number, max?: number): number | null {
  const num = Number(input)
  if (isNaN(num) || !isFinite(num)) return null
  if (min !== undefined && num < min) return null
  if (max !== undefined && num > max) return null
  return num
}

export function sanitizeEnum<T extends string>(input: unknown, allowed: T[]): T | null {
  if (typeof input !== 'string') return null
  return allowed.includes(input as T) ? (input as T) : null
}
