import { Bell } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function Topbar() {
  const { user } = useAuth()

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div />
      <div className="flex items-center gap-3">
        <button
          className="relative rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell size={18} />
        </button>
        {user && (
          <div className="text-sm text-slate-600">
            <span className="text-slate-400">Welcome, </span>
            <span className="font-medium">{user.first_name || user.username}</span>
          </div>
        )}
      </div>
    </header>
  )
}
