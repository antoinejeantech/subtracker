'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Tooltip } from 'recharts'
import { useAuth } from '@/hooks/useAuth'
import { useDataStore } from '@/store/dataStore'

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function cycleLabel(cycle: string): string {
  return { monthly: '/mo', yearly: '/yr', weekly: '/wk', quarterly: '/qtr' }[cycle] ?? ''
}

export default function DashboardPage() {
  const { token } = useAuth(true)
  const { subs, subsLoading, loadAll } = useDataStore()
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    if (token) loadAll(token)
  }, [token])

  const active = subs.filter(s => s.status === 'active')
  const monthlyTotal = active.reduce((acc, s) => {
    const cost = parseFloat(s.cost)
    if (s.billingCycle === 'yearly') return acc + cost / 12
    if (s.billingCycle === 'quarterly') return acc + cost / 3
    if (s.billingCycle === 'weekly') return acc + cost * 4.33
    return acc + cost
  }, 0)

  const upcoming = active
    .filter(s => daysUntil(s.nextRenewalAt) <= 30)
    .sort((a, b) => new Date(a.nextRenewalAt).getTime() - new Date(b.nextRenewalAt).getTime())

  // Monthly cost per category (active subs only)
  const categoryMap = new Map<string, { name: string; color: string; value: number }>()
  for (const s of active) {
    const key = s.category?.name ?? 'Uncategorised'
    const color = s.category?.color ?? '#64748b'
    const cost = parseFloat(s.cost)
    const monthly =
      s.billingCycle === 'yearly' ? cost / 12
      : s.billingCycle === 'quarterly' ? cost / 3
      : s.billingCycle === 'weekly' ? cost * 4.33
      : cost
    const existing = categoryMap.get(key)
    if (existing) existing.value += monthly
    else categoryMap.set(key, { name: key, color, value: monthly })
  }
  const chartData = [...categoryMap.values()].sort((a, b) => b.value - a.value)

  const multiplier = period === 'yearly' ? 12 : 1
  const periodTotal = monthlyTotal * multiplier
  const periodSuffix = period === 'yearly' ? '/yr' : '/mo'
  const displayChartData = chartData.map(e => ({ ...e, fill: e.color, value: e.value * multiplier }))

  if (subsLoading && subs.length === 0) {
    return <p className="text-gray-500 text-sm">Loading…</p>
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Your subscription overview</p>
        </div>
        <div className="flex rounded-lg border border-white/10 text-xs overflow-hidden">
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1.5 transition-colors ${period === 'monthly' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-3 py-1.5 transition-colors ${period === 'yearly' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#161b27] p-5">
          <p className="text-sm text-gray-500">Active subscriptions</p>
          <p className="mt-1 text-2xl font-bold text-white">{active.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#161b27] p-5">
          <p className="text-sm text-gray-500">Est. {period} spend</p>
          <p className="mt-1 text-2xl font-bold text-white">€{periodTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#161b27] p-5">
          <p className="text-sm text-gray-500">Renewing in 30 days</p>
          <p className="mt-1 text-2xl font-bold text-white">{upcoming.length}</p>
        </div>
      </div>

      {/* Spend by category */}
      {chartData.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#161b27] p-6">
          <h2 className="mb-6 font-semibold text-white">
            {period === 'yearly' ? 'Yearly' : 'Monthly'} spend by category
          </h2>
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            <div className="w-full max-w-[220px] shrink-0">
                <PieChart width={220} height={220}>
                  <Pie
                    data={displayChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  />
                  <Tooltip
                    formatter={(value, name) => [`€${Number(value).toFixed(2)}${periodSuffix}`, name]}
                    contentStyle={{
                      background: '#0f1117',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.5rem',
                      color: '#e5e7eb',
                      fontSize: '0.75rem',
                    }}
                    itemStyle={{ color: '#e5e7eb' }}
                  />
                </PieChart>
            </div>
            <ul className="flex flex-1 flex-col gap-2.5 w-full">
              {displayChartData.map(entry => (
                <li key={entry.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="truncate text-sm text-gray-300">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-sm">
                    <span className="text-gray-400">€{entry.value.toFixed(2)}{periodSuffix}</span>
                    <span className="w-10 text-right text-gray-600 text-xs">
                      {((entry.value / periodTotal) * 100).toFixed(0)}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Upcoming renewals */}
      <div className="rounded-2xl border border-white/10 bg-[#161b27] p-6">
        <h2 className="mb-4 font-semibold text-white">Upcoming renewals</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing renewing in the next 30 days 🎉</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {upcoming.map(s => {
              const days = daysUntil(s.nextRenewalAt)
              return (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: s.category?.color ?? 'transparent' }}
                    />
                    <span className="text-sm font-medium text-gray-100">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{s.currency} {s.cost}{cycleLabel(s.billingCycle)}</span>
                    <span className={days <= 7 ? 'text-red-400 font-medium' : ''}>
                      {days === 0 ? 'Today' : `in ${days}d`}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* All subscriptions */}
      <div className="rounded-2xl border border-white/10 bg-[#161b27] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">All subscriptions</h2>
          <a
            href="/dashboard/subscriptions"
            className="text-sm text-indigo-400 hover:underline"
          >
            Manage →
          </a>
        </div>
        {subs.length === 0 ? (
          <p className="text-sm text-gray-500">
            No subscriptions yet.{' '}
            <a href="/dashboard/subscriptions" className="text-indigo-400 hover:underline">
              Add your first one
            </a>
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {subs.map(s => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.category?.color ?? 'transparent' }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-100">{s.name}</p>
                    {s.category && <p className="text-xs text-gray-500">{s.category.name}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{s.currency} {s.cost}{cycleLabel(s.billingCycle)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.status === 'active'
                        ? 'bg-green-500/15 text-green-400'
                        : s.status === 'paused'
                        ? 'bg-yellow-500/15 text-yellow-400'
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
