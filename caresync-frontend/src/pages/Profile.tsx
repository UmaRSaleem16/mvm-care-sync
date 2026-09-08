import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User, KeyRound, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

import { authApi } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/common/Button'

// ── Profile info schema ────────────────────────────────────────────────────
const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  department: z.string().optional(),
  phone: z.string().optional(),
})

// ── Change password schema ─────────────────────────────────────────────────
const passwordSchema = z
  .object({
    old_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function Profile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [pwSuccess, setPwSuccess] = useState(false)

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      email: user?.email ?? '',
      department: user?.department ?? '',
      phone: user?.phone ?? '',
    },
  })

  const profileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => authApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated.')
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: () => toast.error('Failed to update profile.'),
  })

  // Password form
  const passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordFormData) =>
      authApi.changePassword(data.old_password, data.new_password, data.confirm_password),
    onSuccess: () => {
      toast.success('Password changed.')
      passwordForm.reset()
      setPwSuccess(true)
      setTimeout(() => setPwSuccess(false), 4000)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to change password. Check your current password.'
      passwordForm.setError('old_password', { message: msg })
    },
  })

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    coordinator: 'ASC Coordinator',
    staff: 'Staff',
    readonly: 'Read-Only',
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="page-header">My Profile</h1>
        <p className="page-subheader">Update your account details and password.</p>
      </div>

      {/* ── Profile Info ─────────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100">
            <User size={17} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Account Information</h2>
            <p className="text-xs text-slate-400">
              Role: <span className="font-medium text-slate-600">{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</span>
              {' · '}Username: <span className="font-medium text-slate-600">{user?.username}</span>
            </p>
          </div>
        </div>

        <form
          onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))}
          noValidate
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name</label>
              <input className="form-input" {...profileForm.register('first_name')} />
              {profileForm.formState.errors.first_name && (
                <p className="form-error">{profileForm.formState.errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input className="form-input" {...profileForm.register('last_name')} />
              {profileForm.formState.errors.last_name && (
                <p className="form-error">{profileForm.formState.errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" {...profileForm.register('email')} />
            {profileForm.formState.errors.email && (
              <p className="form-error">{profileForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Department</label>
              <input
                className="form-input"
                placeholder="e.g. Scheduling"
                {...profileForm.register('department')}
              />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input
                className="form-input"
                placeholder="e.g. 555-123-4567"
                {...profileForm.register('phone')}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={profileMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* ── Change Password ───────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
            <KeyRound size={17} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Change Password</h2>
            <p className="text-xs text-slate-400">
              Use a strong password with at least 8 characters.
            </p>
          </div>
        </div>

        {pwSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <CheckCircle size={15} className="shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-700">Password changed successfully.</p>
          </div>
        )}

        <form
          onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))}
          noValidate
          className="space-y-4"
        >
          <div>
            <label className="form-label">Current Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="form-input"
              {...passwordForm.register('old_password')}
            />
            {passwordForm.formState.errors.old_password && (
              <p className="form-error">{passwordForm.formState.errors.old_password.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">New Password</label>
            <input
              type="password"
              autoComplete="new-password"
              className="form-input"
              {...passwordForm.register('new_password')}
            />
            {passwordForm.formState.errors.new_password && (
              <p className="form-error">{passwordForm.formState.errors.new_password.message}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Min 8 chars · one uppercase letter · one number
            </p>
          </div>

          <div>
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              autoComplete="new-password"
              className="form-input"
              {...passwordForm.register('confirm_password')}
            />
            {passwordForm.formState.errors.confirm_password && (
              <p className="form-error">
                {passwordForm.formState.errors.confirm_password.message}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={passwordMutation.isPending}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
