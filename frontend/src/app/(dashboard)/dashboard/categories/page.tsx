'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useDataStore } from '@/store/dataStore'
import type { Category } from '@/lib/api'
import Modal from '@/components/Modal'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#64748b',
]

const PREDEFINED: { name: string; color: string }[] = [
  { name: 'Streaming',   color: '#ef4444' },
  { name: 'Music',       color: '#8b5cf6' },
  { name: 'Gaming',      color: '#6366f1' },
  { name: 'Cloud',       color: '#3b82f6' },
  { name: 'Software',    color: '#14b8a6' },
  { name: 'Newsletter',  color: '#eab308' },
  { name: 'Fitness',     color: '#22c55e' },
  { name: 'Finance',     color: '#f97316' },
  { name: 'News',        color: '#64748b' },
  { name: 'Education',   color: '#ec4899' },
]

type FormState = { name: string; color: string }
const DEFAULT_FORM: FormState = { name: '', color: '#6366f1' }

export default function CategoriesPage() {
  const { token } = useAuth(true)
  const { categories, catsLoading, catsError, loadCats, addCat, editCat, removeCat } = useDataStore()
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) loadCats(token)
  }, [token])

  function openCreate() {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setError(null)
    setModal('create')
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setForm({ name: cat.name, color: cat.color })
    setError(null)
    setModal('edit')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      if (modal === 'edit' && editing) {
        await editCat(token, editing.id, form)
      } else {
        await addCat(token, form)
      }
      setModal(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(cat: Category) {
    if (!token || !confirm(`Delete "${cat.name}"?`)) return
    try {
      await removeCat(token, cat.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    }
  }

  async function addPredefined(preset: { name: string; color: string }) {
    if (!token) return
    try {
      await addCat(token, preset)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    }
  }

  const existingNames = new Set(categories.map(c => c.name.toLowerCase()))
  const suggestions = PREDEFINED.filter(p => !existingNames.has(p.name.toLowerCase()))

  return (
    <>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Categories</h1>
            <p className="text-sm text-gray-500 mt-1">Organise your subscriptions</p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            + New category
          </button>
        </div>

        {catsLoading && categories.length === 0 ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : catsError ? (
          <p className="text-sm text-red-400">{catsError}</p>
        ) : categories.length === 0 ? (
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-white/10 bg-[#161b27] p-8">
              <p className="text-sm font-medium text-gray-300 mb-4">Quick add</p>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => addPredefined(preset)}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.color }} />
                    {preset.name}
                  </button>
                ))}
              </div>
              <p className="mt-5 text-xs text-gray-600">Or create a custom one with the button above</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {suggestions.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#161b27] px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">Quick add</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(preset => (
                    <button
                      key={preset.name}
                      onClick={() => addPredefined(preset)}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.color }} />
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <ul className="flex flex-col gap-2">
              {categories.map(cat => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-[#161b27] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-4 w-4 rounded-full border border-white/10"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-medium text-gray-100">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(cat)}
                      className="rounded-lg px-3 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="rounded-lg px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === 'edit' ? 'Edit category' : 'New category'}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Name</label>
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Streaming, SaaS, Fitness…"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Color</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="h-7 w-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: form.color === c ? 'white' : 'transparent',
                    }}
                  />
                ))}
              </div>
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
