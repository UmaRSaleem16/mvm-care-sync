import { NavLink, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  PlusCircle,
  ClipboardList,
  Calendar,
  HelpCircle,
  LogOut,
  Stethoscope,
  UserCog,
  CircleUserRound,
} from 'lucide-react'
import { cn } from '@/utils/helpers'
import { getInitials } from '@/utils/helpers'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',       staffOnly: false },
  { to: '/vendors',      icon: Users,           label: 'Vendors',         staffOnly: false },
  { to: '/facilities',   icon: Building2,       label: 'ASC Facilities',  staffOnly: false },
  { to: '/requests/new', icon: PlusCircle,      label: 'New Request',     highlight: true, staffOnly: true },
  { to: '/requests',     icon: ClipboardList,   label: 'Request Tracker', staffOnly: false },
  { to: '/calendar',     icon: Calendar,        label: 'Calendar',        staffOnly: false },
  { to: '/help',         icon: HelpCircle,      label: 'Help & Docs',     staffOnly: false },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col bg-sidebar-bg border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <Stethoscope size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">MVMCareSync</p>
          <p className="text-[10px] text-slate-400 leading-tight">ASC Vendor Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.filter(item => !item.staffOnly || user?.role !== 'readonly').map(({ to, icon: Icon, label, highlight }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/requests'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600 text-white'
                  : highlight
                  ? 'bg-brand-900/50 text-brand-300 hover:bg-brand-900 hover:text-brand-200'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}

        {/* Admin-only: User Management */}
        {user?.role === 'admin' && (
          <>
            <div className="my-2 border-t border-sidebar-border/50" />
            <NavLink
              to="/users"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
                )
              }
            >
              <UserCog size={17} />
              User Management
            </NavLink>
          </>
        )}
      </nav>

      {/* User footer */}
      {user && (
        <div className="border-t border-sidebar-border px-4 py-4">
          <Link
            to="/profile"
            className="flex items-center gap-3 mb-3 rounded-lg px-1 py-1 hover:bg-sidebar-hover transition-colors group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white shrink-0">
              {getInitials(user.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white group-hover:text-white">
                {user.full_name}
              </p>
              <p className="truncate text-[10px] text-slate-400 capitalize flex items-center gap-1">
                <CircleUserRound size={9} />
                {user.role}
              </p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-400 hover:bg-sidebar-hover hover:text-white transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      )}
    </aside>
  )
}
