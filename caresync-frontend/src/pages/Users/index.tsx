import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Pencil, UserX, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

import { usersApi } from '@/api/users'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import UserFormModal from './UserFormModal'
import type { User } from '@/types'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  coordinator: 'Coordinator',
  staff: 'Staff',
  readonly: 'Read-Only',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-slate-800 text-white',
  coordinator: 'bg-blue-100 text-blue-700',
  staff: 'bg-emerald-100 text-emerald-700',
  readonly: 'bg-amber-100 text-amber-700',
}

export default function Users() {
  const { user: me } = useAuth()
  const queryClient = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<User | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data),
  })

  const users = data?.results ?? []

  const toggleActiveMutation = useMutation({
    mutationFn: (user: User) =>
      user.is_active ? usersApi.deactivate(user.id) : usersApi.activate(user.id),
    onSuccess: (_, user) => {
      toast.success(user.is_active ? 'User deactivated.' : 'User activated.')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmTarget(null)
    },
    onError: () => toast.error('Failed to update user status.'),
  })

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (user: User) => {
    setEditing(user)
    setModalOpen(true)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="page-header">User Management</h1>
          <p className="page-subheader">
            Create and manage portal users. Only admins can access this page.
          </p>
        </div>
        <Button leftIcon={<UserPlus size={15} />} onClick={openCreate}>
          Add User
        </Button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
            Loading users…
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Add the first user to get started."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-500">Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Username</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Role</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Department</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Last Login</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
                        {(u.first_name[0] || '?').toUpperCase()}
                        {(u.last_name[0] || '').toUpperCase()}
                      </div>
                      {u.full_name || u.username}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.username}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={ROLE_LABELS[u.role] ?? u.role}
                      color={ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-700'}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.department || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          u.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {u.last_login
                      ? new Date(u.last_login).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(u)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        title="Edit user"
                      >
                        <Pencil size={14} />
                      </button>
                      {u.id !== me?.id && (
                        <button
                          onClick={() => setConfirmTarget(u)}
                          className={`rounded p-1.5 transition-colors ${
                            u.is_active
                              ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                              : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                          title={u.is_active ? 'Deactivate user' : 'Activate user'}
                        >
                          {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editing}
      />

      {confirmTarget && (
        <ConfirmDialog
          open={!!confirmTarget}
          title={confirmTarget.is_active ? 'Deactivate User' : 'Activate User'}
          message={
            confirmTarget.is_active
              ? `Deactivate ${confirmTarget.full_name || confirmTarget.username}? They will lose portal access immediately.`
              : `Reactivate ${confirmTarget.full_name || confirmTarget.username}? They will regain portal access.`
          }
          confirmLabel={confirmTarget.is_active ? 'Deactivate' : 'Activate'}
          variant={confirmTarget.is_active ? 'danger' : 'primary'}
          onConfirm={() => toggleActiveMutation.mutate(confirmTarget)}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}
