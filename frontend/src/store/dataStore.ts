import { create } from 'zustand'
import {
  getSubscriptions, createSubscription, updateSubscription, deleteSubscription,
  getCategories, createCategory, updateCategory, deleteCategory,
  type Subscription, type Category,
} from '@/lib/api'

type DataState = {
  subs: Subscription[]
  categories: Category[]
  subsLoading: boolean
  catsLoading: boolean
  subsError: string | null
  catsError: string | null

  loadSubs: (token: string) => Promise<void>
  loadCats: (token: string) => Promise<void>
  loadAll: (token: string) => Promise<void>

  addSub: (token: string, data: Record<string, unknown>) => Promise<void>
  editSub: (token: string, id: number, data: Record<string, unknown>) => Promise<void>
  removeSub: (token: string, id: number) => Promise<void>

  addCat: (token: string, data: { name: string; color: string }) => Promise<void>
  editCat: (token: string, id: number, data: { name?: string; color?: string }) => Promise<void>
  removeCat: (token: string, id: number) => Promise<void>

  reset: () => void
}

export const useDataStore = create<DataState>((set, get) => ({
  subs: [],
  categories: [],
  subsLoading: false,
  catsLoading: false,
  subsError: null,
  catsError: null,

  async loadSubs(token) {
    set({ subsLoading: true, subsError: null })
    try {
      const subs = await getSubscriptions(token)
      set({ subs })
    } catch (err) {
      set({ subsError: err instanceof Error ? err.message : 'Failed to load subscriptions' })
    } finally {
      set({ subsLoading: false })
    }
  },

  async loadCats(token) {
    set({ catsLoading: true, catsError: null })
    try {
      const categories = await getCategories(token)
      set({ categories })
    } catch (err) {
      set({ catsError: err instanceof Error ? err.message : 'Failed to load categories' })
    } finally {
      set({ catsLoading: false })
    }
  },

  async loadAll(token) {
    await Promise.all([get().loadSubs(token), get().loadCats(token)])
  },

  async addSub(token, data) {
    await createSubscription(token, data)
    await get().loadSubs(token)
  },

  async editSub(token, id, data) {
    await updateSubscription(token, id, data)
    await get().loadSubs(token)
  },

  async removeSub(token, id) {
    await deleteSubscription(token, id)
    set(s => ({ subs: s.subs.filter(sub => sub.id !== id) }))
  },

  async addCat(token, data) {
    await createCategory(token, data)
    await get().loadCats(token)
  },

  async editCat(token, id, data) {
    await updateCategory(token, id, data)
    await get().loadCats(token)
  },

  async removeCat(token, id) {
    await deleteCategory(token, id)
    set(s => ({ categories: s.categories.filter(c => c.id !== id) }))
  },

  reset() {
    set({
      subs: [], categories: [],
      subsLoading: false, catsLoading: false,
      subsError: null, catsError: null,
    })
  },
}))
