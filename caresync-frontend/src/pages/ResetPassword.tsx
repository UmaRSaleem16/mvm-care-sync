import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Stethoscope, CheckCircle, XCircle } from 'lucide-react'

import { authApi } from '@/api/auth'
import { Button } from '@/components/common/Button'

const schema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type FormData = z.infer<typeof schema>

export default function ResetPassword() {
  const { uid, token } = useParams<{ uid: string; token: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    if (!uid || !token) return
    setLoading(true)
    setApiError('')
    try {
      await authApi.resetPassword(uid, token, data.new_password, data.confirm_password)
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Reset link is invalid or has expired.'
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
            <Stethoscope size={28} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">MVMCareSync</h1>
            <p className="text-sm text-slate-400">ASC Vendor Management Portal</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle size={22} className="text-emerald-600" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-slate-800">Password reset!</h2>
              <p className="mb-2 text-sm text-slate-500">
                Your password has been updated. Redirecting to sign in…
              </p>
              <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                Go to sign in now
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-1 text-lg font-semibold text-slate-800">Set new password</h2>
              <p className="mb-6 text-sm text-slate-500">
                Choose a strong password. You'll use it to sign in.
              </p>

              {apiError && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                  <XCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">{apiError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div>
                  <label className="form-label" htmlFor="new_password">New password</label>
                  <input
                    id="new_password"
                    type="password"
                    autoComplete="new-password"
                    className="form-input"
                    {...register('new_password')}
                  />
                  {errors.new_password && (
                    <p className="form-error">{errors.new_password.message}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Min 8 chars · one uppercase · one number
                  </p>
                </div>

                <div>
                  <label className="form-label" htmlFor="confirm_password">Confirm password</label>
                  <input
                    id="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    className="form-input"
                    {...register('confirm_password')}
                  />
                  {errors.confirm_password && (
                    <p className="form-error">{errors.confirm_password.message}</p>
                  )}
                </div>

                <Button type="submit" loading={loading} className="mt-2 w-full">
                  Reset password
                </Button>
              </form>

              <div className="mt-5 flex justify-center">
                <Link
                  to="/login"
                  className="text-sm text-slate-500 hover:text-brand-600"
                >
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
