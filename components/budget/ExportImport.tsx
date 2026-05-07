'use client'

import { useState, useRef } from 'react'
import { Download, Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface ExportImportProps {
  yearId: string
  yearNumber: number
  getToken: () => Promise<string | null>
  onImported: () => void
}

export function ExportImport({ yearId, yearNumber, getToken, onImported }: ExportImportProps) {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ updated: number; created: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    const token = await getToken()
    const resp = await fetch(`/api/export?yearId=${yearId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!resp.ok) return
    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finanzplan_${yearNumber}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(file: File) {
    setImporting(true)
    setResult(null)
    const token = await getToken()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('yearId', yearId)

    try {
      const resp = await fetch('/api/import', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await resp.json()
      setResult(data)
      onImported()
    } catch {
      setResult({ updated: 0, created: 0, errors: ['Import fehlgeschlagen'] })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Export */}
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition-all"
      >
        <Download className="w-4 h-4" />
        Excel Export
      </button>

      {/* Import */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition-all disabled:opacity-50"
        >
          {importing
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Upload className="w-4 h-4" />
          }
          Import
        </button>
      </div>

      {/* Result feedback */}
      {result && (
        <div className="flex items-center gap-1.5">
          {result.errors.length === 0 ? (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <CheckCircle className="w-3.5 h-3.5" />
              {result.updated} aktualisiert, {result.created} neu
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <AlertTriangle className="w-3.5 h-3.5" />
              {result.errors[0]}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
