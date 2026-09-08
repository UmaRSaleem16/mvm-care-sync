import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Stethoscope, ArrowLeft, Mail } from 'lucide-react'

import { authApi } from '@/api/auth'
import { Button } from '@/components/common/Button'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
    } catch {
      // Always show success to avoid revealing which emails exist
      setSent(true)
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
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Mail size={22} className="text-emerald-600" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-slate-800">Check your email</h2>
              <p className="mb-6 text-sm text-slate-500">
                If an account with that email exists, we've sent a password reset link. Check your
                inbox (and spam folder).
              </p>
              <Link
                to="/login"
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-1 text-lg font-semibold text-slate-800">Reset your password</h2>
              <p className="mb-6 text-sm text-slate-500">
                Enter your account email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div>
                  <label className="form-label" htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="form-input"
                    placeholder="you@example.com"
                    {...register('email')}
                  />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>

                <Button type="submit" loading={loading} className="mt-2 w-full">
                  Send reset link
                </Button>
              </form>

              <div className="mt-5 flex justify-center">
                <Link
                  to="/login"
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
                >
                  <ArrowLeft size={13} /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Internal use only — MVM/NVM ASC Staff
        </p>
      </div>
    </div>
  )
}
