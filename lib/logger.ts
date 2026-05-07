// Simple structured logger for production
type LogLevel = 'info' | 'warn' | 'error' | 'security'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  userId?: string
  ip?: string
  path?: string
  [key: string]: unknown
}

function log(level: LogLevel, message: string, meta: Record<string, unknown> = {}) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }

  if (level === 'error' || level === 'security') {
    console.error(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
  security: (msg: string, meta?: Record<string, unknown>) => log('security', msg, meta),
}
