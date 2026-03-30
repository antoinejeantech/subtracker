import {
  getToken, setToken, getRefreshToken, setRefreshToken, clearAllTokens,
} from '@/lib/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

type RequestOptions = {
  method?: string
  body?: unknown
  token?: string
  _retry?: boolean
}

function extractMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>
    if (typeof e['detail'] === 'string') return e['detail']
    if (typeof e['hydra:description'] === 'string') return e['hydra:description']
    if (typeof e['message'] === 'string') return e['message']
  }
  return fallback
}

async function attemptRefresh(): Promise<string> {
  const rToken = getRefreshToken()
  if (!rToken) throw new Error('No refresh token')

  const res = await fetch(`${API_BASE}/api/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: rToken }),
  })

  if (!res.ok) throw new Error('Refresh failed')

  const data = await res.json()
  setToken(data.token)
  if (data.refresh_token) setRefreshToken(data.refresh_token)
  return data.token as string
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, _retry = false } = options

  const isPatch = method === 'PATCH'
  const headers: HeadersInit = {
    'Content-Type': isPatch ? 'application/merge-patch+json' : 'application/json',
    Accept: 'application/json',
  }

  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // On 401, try to silently refresh the access token once
  if (res.status === 401 && !_retry && path !== '/api/token/refresh') {
    try {
      const newToken = await attemptRefresh()
      return request<T>(path, { ...options, token: newToken, _retry: true })
    } catch {
      clearAllTokens()
      if (typeof window !== 'undefined') window.location.href = '/login'
      throw new Error('Session expired. Please log in again.')
    }
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null)
    throw new Error(extractMessage(payload, res.statusText || 'API error'))
  }

  if (res.status === 204) return undefined as T
  const json = await res.json()
  return ('hydra:member' in json ? json['hydra:member'] : json) as T
}

// Auth
export async function login(
  email: string,
  password: string,
): Promise<{ token: string; refresh_token?: string }> {
  return request('/api/login', { method: 'POST', body: { username: email, password } })
}

export async function register(email: string, plainPassword: string, timezone = 'UTC') {
  return request('/api/users', { method: 'POST', body: { email, plainPassword, timezone } })
}

// Current user
export type UserProfile = { id: number; email: string; timezone: string }

export async function getMe(token: string): Promise<UserProfile> {
  return request<UserProfile>('/api/me', { token })
}

export async function updateMe(token: string, data: { email?: string; timezone?: string; plainPassword?: string }) {
  return request<UserProfile>('/api/me', { method: 'PATCH', token, body: data })
}

// Subscriptions
export type Subscription = {
  id: number
  name: string
  url?: string
  cost: string
  currency: string
  billingCycle: string
  nextRenewalAt: string
  status: string
  notes?: string
  createdAt: string
  category?: Category
}

export async function getSubscriptions(token: string): Promise<Subscription[]> {
  return request<Subscription[]>('/api/subscriptions', { token })
}

export async function createSubscription(token: string, data: Partial<Subscription>) {
  return request('/api/subscriptions', { method: 'POST', token, body: data })
}

export async function updateSubscription(token: string, id: number, data: Partial<Subscription>) {
  return request(`/api/subscriptions/${id}`, { method: 'PATCH', token, body: data })
}

export async function deleteSubscription(token: string, id: number) {
  return request(`/api/subscriptions/${id}`, { method: 'DELETE', token })
}

// Categories
export type Category = { id: number; name: string; color: string }

export async function getCategories(token: string): Promise<Category[]> {
  return request<Category[]>('/api/categories', { token })
}

export async function createCategory(token: string, data: { name: string; color: string }) {
  return request('/api/categories', { method: 'POST', token, body: data })
}

export async function updateCategory(token: string, id: number, data: Partial<Category>) {
  return request(`/api/categories/${id}`, { method: 'PATCH', token, body: data })
}

export async function deleteCategory(token: string, id: number) {
  return request(`/api/categories/${id}`, { method: 'DELETE', token })
}

// Import
export type RecurringCandidate = {
  name: string
  amount: number
  currency: string
  billingCycle: string
  confidence: 'low' | 'medium' | 'high'
  occurrences: number
  lastSeen: string
  nextRenewalAt: string
}

export type PreviewResult = {
  headers: string[]
  sample: string[][]
}

export type AnalyzeResult = {
  transactionCount: number
  candidates: RecurringCandidate[]
}

export async function previewCsv(token: string, file: File): Promise<PreviewResult> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/api/import/preview`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) {
    const payload = await res.json().catch(() => null)
    throw new Error(extractMessage(payload, 'Preview failed'))
  }
  return res.json()
}

export async function analyzeCsv(
  token: string,
  file: File,
  dateCol: string,
  descriptionCol: string,
  amountCol: string,
  currency: string,
): Promise<AnalyzeResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('date_col', dateCol)
  form.append('description_col', descriptionCol)
  form.append('amount_col', amountCol)
  form.append('currency', currency)
  const res = await fetch(`${API_BASE}/api/import/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) {
    const payload = await res.json().catch(() => null)
    throw new Error(extractMessage(payload, 'Analysis failed'))
  }
  return res.json()
}
