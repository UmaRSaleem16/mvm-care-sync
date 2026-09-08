import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/common/Button'

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await login(data.username, data.password)
      navigate('/dashboard', { replace: true })
    } catch {
      toast.error('Invalid username or password')
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

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <h2 className="mb-6 text-lg font-semibold text-slate-800">Sign in to your account</h2>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className="form-input"
                {...register('username')}
              />
              {errors.username && <p className="form-error">{errors.username.message}</p>}
            </div>
            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="form-input"
                {...register('password')}
              />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>
            <Button type="submit" loading={loading} className="mt-2 w-full">
              Sign in
            </Button>

            <div className="mt-4 text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-slate-500 hover:text-brand-600"
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Internal use only — MVM/NVM ASC Staff
        </p>
      </div>
    </div>
  )
}
