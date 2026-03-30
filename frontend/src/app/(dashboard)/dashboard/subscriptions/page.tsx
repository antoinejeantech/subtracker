'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useDataStore } from '@/store/dataStore'
import type { Subscription } from '@/lib/api'
import Modal from '@/components/Modal'

const CYCLES = ['monthly', 'yearly', 'quarterly', 'weekly']
const STATUSES = ['active', 'paused', 'cancelled']
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'JPY']

type FormState = {
  name: string
  url: string
  cost: string
  currency: string
  billingCycle: string
  nextRenewalAt: string
  status: string
  notes: string
  category: string
}

const DEFAULT_FORM: FormState = {
  name: '', url: '', cost: '', currency: 'EUR',
  billingCycle: 'monthly', nextRenewalAt: '', status: 'active',
  notes: '', category: '',
}

function statusClasses(status: string) {
  if (status === 'active') return 'bg-green-500/15 text-green-400'
  if (status === 'paused') return 'bg-yellow-500/15 text-yellow-400'
  return 'bg-white/10 text-gray-400'
}

function cycleLabel(cycle: string) {
  return { monthly: '/mo', yearly: '/yr', quarterly: '/qtr', weekly: '/wk' }[cycle] ?? ''
}

function FaviconIcon({ url, name }: { url?: string; name: string }) {
  const [failed, setFailed] = useState(false)

  if (!url || failed) {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-gray-400 uppercase select-none">
        {name.slice(0, 2)}
      </span>
    )
  }

  let domain: string
  try {
    domain = new URL(url).hostname
  } catch {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-gray-400 uppercase select-none">
        {name.slice(0, 2)}
      </span>
    )
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt=""
      width={32}
      height={32}
      className="h-8 w-8 rounded-lg object-contain"
      onError={() => setFailed(true)}
    />
  )
}

export default function SubscriptionsPage() {
  const { token } = useAuth(true)
  const { subs, categories, subsLoading, subsError, loadAll, addSub, editSub, removeSub } = useDataStore()
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Subscription | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) loadAll(token)
  }, [token])

  function openCreate() {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setError(null)
    setModal('create')
  }

  function openEdit(sub: Subscription) {
    setEditing(sub)
    setForm({
      name: sub.name,
      url: sub.url ?? '',
      cost: sub.cost,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      nextRenewalAt: sub.nextRenewalAt.slice(0, 10),
      status: sub.status,
      notes: sub.notes ?? '',
      category: sub.category ? `/api/categories/${sub.category.id}` : '',
    })
    setError(null)
    setModal('edit')
  }

  function field(key: keyof FormState) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(f => ({ ...f, [key]: e.target.value })),
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        cost: form.cost,
        currency: form.currency,
        billingCycle: form.billingCycle,
        nextRenewalAt: form.nextRenewalAt,
        status: form.status,
        url: form.url || null,
        notes: form.notes || null,
        category: form.category || null,
      }
      if (modal === 'edit' && editing) {
        await editSub(token, editing.id, payload)
      } else {
        await addSub(token, payload)
      }
      setModal(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(sub: Subscription) {
    if (!token || !confirm(`Delete "${sub.name}"?`)) return
    try {
      await removeSub(token, sub.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    }
  }

  const inputCls = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
  const selectCls = 'w-full rounded-lg border border-white/10 bg-[#161b27] px-3 py-2 text-sm text-gray-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
  const labelCls = 'mb-1 block text-sm font-medium text-gray-300'

  return (
    <>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
            <p className="text-sm text-gray-500 mt-1">{subs.length} total</p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            + New subscription
          </button>
        </div>

        {subsLoading && subs.length === 0 ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : subsError ? (
          <p className="text-sm text-red-400">{subsError}</p>
        ) : subs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#161b27] p-10 text-center">
            <p className="text-gray-400 mb-3">No subscriptions yet</p>
            <button onClick={openCreate} className="text-sm text-indigo-400 hover:underline">
              Add your first subscription
            </button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden flex flex-col gap-2">
              {subs.map(sub => (
                <div key={sub.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#161b27] px-4 py-3">
                  <FaviconIcon url={sub.url} name={sub.name} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-100 text-sm truncate">{sub.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>{sub.currency} {sub.cost}{cycleLabel(sub.billingCycle)}</span>
                      {sub.category && (
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sub.category.color }} />
                          {sub.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(sub.status)}`}>
                      {sub.status}
                    </span>
                    <button
                      onClick={() => openEdit(sub)}
                      className="rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(sub)}
                      className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block rounded-2xl border border-white/10 bg-[#161b27] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Cost</th>
                    <th className="px-4 py-3 text-left">Renewal</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {subs.map(sub => (
                    <tr key={sub.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <FaviconIcon url={sub.url} name={sub.name} />
                          <div>
                            <div className="font-medium text-gray-100">{sub.name}</div>
                            {sub.url && (
                              <a href={sub.url} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-indigo-400 truncate block max-w-[180px]">
                                {new URL(sub.url).hostname}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {sub.category ? (
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sub.category.color }} />
                            <span className="text-gray-400">{sub.category.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        {sub.currency} {sub.cost}{cycleLabel(sub.billingCycle)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {new Date(sub.nextRenewalAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(sub.status)}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(sub)}
                            className="rounded-lg px-3 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(sub)}
                            className="rounded-lg px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === 'edit' ? 'Edit subscription' : 'New subscription'}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSave} className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label className={labelCls}>Name *</label>
              <input required className={inputCls} placeholder="Netflix, AWS, Gym…" {...field('name')} />
            </div>
            <div>
              <label className={labelCls}>URL</label>
              <input type="url" className={inputCls} placeholder="https://…" {...field('url')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Cost *</label>
                <input required type="number" step="0.01" min="0" className={inputCls} placeholder="9.99" {...field('cost')} />
              </div>
              <div>
                <label className={labelCls}>Currency</label>
                <select className={selectCls} {...field('currency')}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Billing cycle</label>
                <select className={selectCls} {...field('billingCycle')}>
                  {CYCLES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Next renewal *</label>
                <input required type="date" className={inputCls} {...field('nextRenewalAt')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Status</label>
                <select className={selectCls} {...field('status')}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select className={selectCls} {...field('category')}>
                  <option value="">— None —</option>
                  {categories.map(c => (
                    <option key={c.id} value={`/api/categories/${c.id}`}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                rows={2}
                className={inputCls}
                placeholder="Optional notes…"
                {...field('notes')}
              />
            </div>

            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-gray-400 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
