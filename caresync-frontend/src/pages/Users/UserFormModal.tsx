import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { usersApi } from '@/api/users'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import type { User } from '@/types'

const createSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Enter a valid email'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'coordinator', 'staff', 'readonly']),
  department: z.string().optional(),
  phone: z.string().optional(),
})

const editSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  role: z.enum(['admin', 'coordinator', 'staff', 'readonly']),
  department: z.string().optional(),
  phone: z.string().optional(),
})

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>

interface Props {
  open: boolean
  onClose: () => void
  user?: User | null
}

const ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'coordinator', label: 'ASC Coordinator' },
  { value: 'staff', label: 'Staff' },
  { value: 'readonly', label: 'Read-Only' },
]

export default function UserFormModal({ open, onClose, user }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!user

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as never,
  })

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
      })
    } else {
      reset({ role: 'staff' })
    }
  }, [user, reset])

  const mutation = useMutation({
    mutationFn: (data: CreateFormData | EditFormData) =>
      isEdit
        ? usersApi.update(user!.id, data as EditFormData)
        : usersApi.create(data as CreateFormData),
    onSuccess: () => {
      toast.success(isEdit ? 'User updated.' : 'User created.')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: () => toast.error('Failed to save user. Check all fields.'),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit — ${user?.full_name}` : 'Add New User'}
      size="md"
    >
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        noValidate
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">First Name *</label>
            <input className="form-input" {...register('first_name')} />
            {errors.first_name && <p className="form-error">{errors.first_name.message}</p>}
          </div>
          <div>
            <label className="form-label">Last Name *</label>
            <input className="form-input" {...register('last_name')} />
            {errors.last_name && <p className="form-error">{errors.last_name.message}</p>}
          </div>
        </div>

        {!isEdit && (
          <div>
            <label className="form-label">Username *</label>
            <input
              className="form-input"
              autoComplete="off"
              placeholder="Used to sign in"
              {...register('username')}
            />
            {(errors as { username?: { message?: string } }).username && (
              <p className="form-error">
                {(errors as { username?: { message?: string } }).username?.message}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="form-label">Email Address *</label>
          <input type="email" className="form-input" {...register('email')} />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        {!isEdit && (
          <div>
            <label className="form-label">Temporary Password *</label>
            <input
              type="password"
              autoComplete="new-password"
              className="form-input"
              placeholder="Min 8 characters"
              {...register('password' as keyof CreateFormData)}
            />
            {(errors as { password?: { message?: string } }).password && (
              <p className="form-error">
                {(errors as { password?: { message?: string } }).password?.message}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              User should change this on first login via Profile → Change Password.
            </p>
          </div>
        )}

        <div>
          <label className="form-label">Role *</label>
          <select className="form-input" {...register('role')}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {errors.role && <p className="form-error">{errors.role.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Department</label>
            <input className="form-input" placeholder="e.g. Scheduling" {...register('department')} />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-input" placeholder="555-123-4567" {...register('phone')} />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
