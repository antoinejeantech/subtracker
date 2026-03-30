'use client'

import { useEffect, useState } from 'react'
import { getMe, updateMe, type UserProfile } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

const TIMEZONES = [
  'UTC',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
  'Europe/Rome', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Zurich',
  'Europe/Stockholm', 'Europe/Oslo', 'Europe/Copenhagen', 'Europe/Helsinki',
  'Europe/Warsaw', 'Europe/Prague', 'Europe/Vienna', 'Europe/Lisbon',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'America/Mexico_City',
  'America/Buenos_Aires', 'America/Bogota', 'America/Santiago',
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Hong_Kong',
  'Asia/Singapore', 'Asia/Bangkok', 'Asia/Dubai', 'Asia/Kolkata',
  'Asia/Karachi', 'Asia/Dhaka', 'Asia/Jakarta',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth',
  'Pacific/Auckland', 'Pacific/Honolulu',
  'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos',
]

const inputCls = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
const selectCls = 'w-full rounded-lg border border-white/10 bg-[#161b27] px-3 py-2 text-sm text-gray-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
const labelCls = 'mb-1 block text-sm font-medium text-gray-300'

export default function SettingsPage() {
  const { token } = useAuth(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile form
  const [email, setEmail] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Password form
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    getMe(token)
      .then(p => {
        setProfile(p)
        setEmail(p.email)
        setTimezone(p.timezone)
      })
      .catch(err => setProfileError(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setProfileSaving(true)
    setProfileError(null)
    setProfileSuccess(false)
    try {
      await updateMe(token, { email, timezone })
      setProfileSuccess(true)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Error')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    setPasswordSaving(true)
    setPasswordError(null)
    setPasswordSuccess(false)
    try {
      await updateMe(token, { plainPassword: newPassword })
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess(true)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Error')
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

  return (
    <div className="max-w-lg flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account</p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border border-white/10 bg-[#161b27] p-6">
        <h2 className="font-semibold text-white mb-5">Profile</h2>
        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Timezone</label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className={selectCls}
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          {profileError && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{profileError}</p>
          )}
          {profileSuccess && (
            <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">Profile updated</p>
          )}
          <button
            type="submit"
            disabled={profileSaving}
            className="rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
          >
            {profileSaving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="rounded-2xl border border-white/10 bg-[#161b27] p-6">
        <h2 className="font-semibold text-white mb-5">Change password</h2>
        <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>New password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className={inputCls}
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className={labelCls}>Confirm new password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={inputCls}
              placeholder="Repeat your new password"
            />
          </div>
          {passwordError && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">Password updated</p>
          )}
          <button
            type="submit"
            disabled={passwordSaving}
            className="rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
          >
            {passwordSaving ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-500/20 bg-[#161b27] p-6">
        <h2 className="font-semibold text-white mb-1">Account info</h2>
        <p className="text-xs text-gray-500 mb-1">User ID: <span className="text-gray-400">{profile?.id}</span></p>
        <p className="text-xs text-gray-500">Email: <span className="text-gray-400">{profile?.email}</span></p>
      </div>
    </div>
  )
}
