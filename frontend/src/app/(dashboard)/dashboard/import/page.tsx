'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useDataStore } from '@/store/dataStore'
import {
  previewCsv, analyzeCsv,
  type RecurringCandidate, type PreviewResult,
} from '@/lib/api'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'JPY']

const CONFIDENCE_BADGE: Record<string, string> = {
  high:   'bg-green-500/15 text-green-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  low:    'bg-white/10 text-gray-400',
}

const CYCLE_LABEL: Record<string, string> = {
  monthly: '/mo', yearly: '/yr', weekly: '/wk', quarterly: '/qtr',
}

// ── Step indicator ────────────────────────────────────────────────────────────
function Stepper({ step }: { step: number }) {
  const steps = ['Upload & Map', 'Review', 'Import']
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
            i < step ? 'bg-indigo-600 text-white'
            : i === step ? 'border-2 border-indigo-500 text-indigo-400'
            : 'border border-white/20 text-gray-600'
          }`}>
            {i < step ? '✓' : i + 1}
          </div>
          <span className={`text-sm ${i === step ? 'text-white font-medium' : 'text-gray-500'}`}>{label}</span>
          {i < steps.length - 1 && <span className="mx-1 text-gray-700">›</span>}
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ImportPage() {
  const { token } = useAuth(true)
  const { addSub } = useDataStore()
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Step 0
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [currency, setCurrency] = useState('EUR')
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [dateCol, setDateCol] = useState('')
  const [descCol, setDescCol] = useState('')
  const [amountCol, setAmountCol] = useState('')

  // Step 1
  const [candidates, setCandidates] = useState<RecurringCandidate[]>([])
  const [transactionCount, setTransactionCount] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // Step 2
  const [imported, setImported] = useState(0)

  // ── Step 0: upload + preview ──
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f || !token) return
    setFile(f)
    setError(null)
    setLoading(true)
    try {
      const result = await previewCsv(token, f)
      setPreview(result)
      // Auto-detect common column names
      const lower = result.headers.map(h => h.toLowerCase())
      setDateCol(result.headers[lower.findIndex(h => h.includes('date'))] ?? result.headers[0] ?? '')
      setDescCol(result.headers[lower.findIndex(h => h.includes('label') || h.includes('desc') || h.includes('libel') || h.includes('merchant'))] ?? result.headers[1] ?? '')
      setAmountCol(result.headers[lower.findIndex(h => h.includes('amount') || h.includes('montant') || h.includes('debit') || h.includes('credit'))] ?? result.headers[2] ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
      setFile(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !token) return
    setError(null)
    setLoading(true)
    try {
      const result = await analyzeCsv(token, file, dateCol, descCol, amountCol, currency)
      setCandidates(result.candidates)
      setTransactionCount(result.transactionCount)
      // Pre-select high + medium confidence
      setSelected(new Set(
        result.candidates
          .map((_, i) => i)
          .filter(i => result.candidates[i].confidence !== 'low'),
      ))
      setStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1: review + confirm ──
  function toggleAll() {
    if (selected.size === candidates.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(candidates.map((_, i) => i)))
    }
  }

  async function handleImport() {
    if (!token) return
    setLoading(true)
    setError(null)
    let count = 0
    for (const i of selected) {
      const c = candidates[i]
      try {
        await addSub(token, {
          name: c.name,
          cost: String(c.amount),
          currency: c.currency,
          billingCycle: c.billingCycle,
          nextRenewalAt: c.nextRenewalAt,
          status: 'active',
        })
        count++
      } catch {
        // continue importing the rest
      }
    }
    setImported(count)
    setStep(2)
    setLoading(false)
  }

  // ── Step 2: done ──

  const selectCls = 'w-full rounded-lg border border-white/10 bg-[#161b27] px-3 py-2 text-sm text-gray-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'

  return (
    <div className="max-w-3xl">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white">Import transactions</h1>
        <p className="text-sm text-gray-500 mt-1">Detect recurring subscriptions from your bank CSV export</p>
      </div>

      <Stepper step={step} />

      {/* ── Step 0 ── */}
      {step === 0 && (
        <form onSubmit={handleAnalyze} className="flex flex-col gap-6">
          {/* File drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-[#161b27] p-10 cursor-pointer hover:border-indigo-500/50 transition-colors"
          >
            <span className="text-3xl">📂</span>
            <p className="text-sm text-gray-300">
              {file ? file.name : 'Click to select a CSV file'}
            </p>
            {file && <p className="text-xs text-gray-600">{(file.size / 1024).toFixed(0)} KB</p>}
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
          </div>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

          {loading && !preview && <p className="text-sm text-gray-500">Reading file…</p>}

          {preview && (
            <>
              {/* Column mapping */}
              <div className="rounded-2xl border border-white/10 bg-[#161b27] p-5 flex flex-col gap-4">
                <p className="text-sm font-medium text-white">Map columns</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-400">Date column</label>
                    <select value={dateCol} onChange={e => setDateCol(e.target.value)} className={selectCls} required>
                      {preview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-400">Description column</label>
                    <select value={descCol} onChange={e => setDescCol(e.target.value)} className={selectCls} required>
                      {preview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-400">Amount column</label>
                    <select value={amountCol} onChange={e => setAmountCol(e.target.value)} className={selectCls} required>
                      {preview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                {/* Currency */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-400 shrink-0">Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="rounded-lg border border-white/10 bg-[#161b27] px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-indigo-500">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Sample preview */}
                {preview.sample.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-500">
                          {preview.headers.map(h => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.sample.map((row, i) => (
                          <tr key={i} className="border-b border-white/5 last:border-0">
                            {row.map((cell, j) => <td key={j} className="px-3 py-2 text-gray-400 max-w-[120px] truncate">{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="self-end rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
              >
                {loading ? 'Analysing…' : 'Detect subscriptions →'}
              </button>
            </>
          )}
        </form>
      )}

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Found <span className="text-white font-medium">{candidates.length}</span> recurring patterns in{' '}
              <span className="text-white font-medium">{transactionCount}</span> transactions.
              {' '}<span className="text-gray-600">Select which to import.</span>
            </p>
            <button onClick={toggleAll} className="text-xs text-indigo-400 hover:underline shrink-0">
              {selected.size === candidates.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          {candidates.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#161b27] p-10 text-center">
              <p className="text-gray-400">No recurring patterns detected.</p>
              <p className="text-xs text-gray-600 mt-2">Try a longer date range or check your column mapping.</p>
              <button onClick={() => setStep(0)} className="mt-4 text-sm text-indigo-400 hover:underline">← Go back</button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {candidates.map((c, i) => (
                  <label
                    key={i}
                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                      selected.has(i)
                        ? 'border-indigo-500/40 bg-indigo-500/5'
                        : 'border-white/10 bg-[#161b27] hover:border-white/20'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => {
                        const next = new Set(selected)
                        next.has(i) ? next.delete(i) : next.add(i)
                        setSelected(next)
                      }}
                      className="accent-indigo-500 h-4 w-4 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-100 text-sm truncate">{c.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {c.occurrences} occurrences · last seen {new Date(c.lastSeen).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-3 text-sm">
                      <span className="text-gray-300 font-medium">
                        {c.currency} {c.amount.toFixed(2)}{CYCLE_LABEL[c.billingCycle] ?? ''}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_BADGE[c.confidence]}`}>
                        {c.confidence}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setStep(0)} className="text-sm text-gray-500 hover:text-gray-300">
                  ← Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading || selected.size === 0}
                  className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
                >
                  {loading ? 'Importing…' : `Import ${selected.size} subscription${selected.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div className="rounded-2xl border border-white/10 bg-[#161b27] p-10 flex flex-col items-center gap-5 text-center">
          <span className="text-4xl">🎉</span>
          <div>
            <p className="text-lg font-semibold text-white">
              {imported} subscription{imported !== 1 ? 's' : ''} imported
            </p>
            <p className="text-sm text-gray-500 mt-1">They've been added to your subscriptions list.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/subscriptions')}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            View subscriptions →
          </button>
        </div>
      )}
    </div>
  )
}
