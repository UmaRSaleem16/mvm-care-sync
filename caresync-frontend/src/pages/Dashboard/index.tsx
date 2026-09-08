import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  PlusCircle,
  Users,
  Building2,
  Calendar,
  Bell,
  Mail,
  MessageSquare,
} from 'lucide-react'

import { StatCard } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { StatusBadge } from '@/components/common/Badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAuth } from '@/context/AuthContext'
import { requestsApi } from '@/api/requests'
import { notificationsApi, type NotificationLogEntry } from '@/api/notifications'
import { formatDate } from '@/utils/helpers'
import type { RequestStatus } from '@/types'

const quickLinks = [
  {
    to: '/requests/new',
    icon: PlusCircle,
    label: 'New Case Request',
    desc: 'Submit a new vendor coverage request',
    color: 'bg-brand-600 hover:bg-brand-700 text-white',
  },
  {
    to: '/vendors',
    icon: Users,
    label: 'Vendor Database',
    desc: 'View and manage vendors',
    color: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
  },
  {
    to: '/facilities',
    icon: Building2,
    label: 'ASC Facilities',
    desc: 'View and manage ASC locations',
    color: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
  },
  {
    to: '/calendar',
    icon: Calendar,
    label: 'Calendar View',
    desc: 'See all requests on the calendar',
    color: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isCoordinator = user?.role === 'admin' || user?.role === 'coordinator'

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => requestsApi.getDashboardStats().then((r) => r.data),
    refetchInterval: 60_000,
  })

  const { data: notifData } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: () => notificationsApi.list().then((r: { data: { results: NotificationLogEntry[] } }) => r.data),
    refetchInterval: 30_000,
    enabled: isCoordinator,
  })
  const recentNotifs = notifData?.results?.slice(0, 8) ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-header">
          Welcome back, {user?.first_name || user?.username}
        </h1>
        <p className="page-subheader">
          ASC Vendor Management Portal — live request summary below.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open Requests"
          value={isLoading ? '…' : (stats?.open_requests ?? 0)}
          icon={<ClipboardList size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Confirmed Today"
          value={isLoading ? '…' : (stats?.confirmed_today ?? 0)}
          icon={<CheckCircle size={20} />}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          label="Pending Response"
          value={isLoading ? '…' : (stats?.pending_response ?? 0)}
          icon={<Clock size={20} />}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Backup Needed"
          value={isLoading ? '…' : (stats?.backup_needed ?? 0)}
          icon={<AlertCircle size={20} />}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Quick links */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Quick Actions
      </h2>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map(({ to, icon: Icon, label, desc, color }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`flex flex-col items-start gap-3 rounded-xl p-5 text-left shadow-sm transition-all ${color}`}
          >
            <Icon size={22} />
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs opacity-70 mt-0.5">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom grid: recent requests + (coordinator only) notifications */}
      <div className={`grid grid-cols-1 gap-4 ${isCoordinator ? 'xl:grid-cols-3' : ''}`}>

      {/* Recent requests */}
      <div className={`card ${isCoordinator ? 'xl:col-span-2' : ''}`}>
        <div className="card-header">
          <h2 className="text-sm font-semibold text-slate-700">Recent Requests</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/requests')}>
            View all
          </Button>
        </div>

        {isLoading ? (
          <div className="card-body py-10 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : !stats?.recent_requests?.length ? (
          <div className="card-body py-12 text-center">
            <ClipboardList size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No requests yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Requests will appear here once submitted.
            </p>
            <Button className="mt-4" size="sm" onClick={() => navigate('/requests/new')}>
              Create first request
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Date', 'ASC', 'Service', 'Vendor', 'Status', 'Requester'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recent_requests.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/requests/${req.id}`)}
                  >
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(req.request_date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {req.facility_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{req.service_type_name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {req.vendor_name ?? <span className="text-slate-400 italic">TBD</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status as RequestStatus} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{req.requester_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notifications panel — coordinator+admin only */}
      {isCoordinator && <div className="card flex flex-col">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">Recent Notifications</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {recentNotifs.length === 0 ? (
            <div className="py-10 text-center">
              <Bell size={24} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs text-slate-400">No notifications yet</p>
            </div>
          ) : (
            recentNotifs.map((n: NotificationLogEntry) => (
              <div
                key={n.id}
                className="px-4 py-3 hover:bg-slate-50 cursor-pointer"
                onClick={() => navigate(`/requests/${n.request_info.id}`)}
              >
                <div className="flex items-start gap-2">
                  {n.notification_type === 'email' ? (
                    <Mail size={13} className="mt-0.5 shrink-0 text-blue-500" />
                  ) : n.notification_type === 'teams' ? (
                    <MessageSquare size={13} className="mt-0.5 shrink-0 text-purple-500" />
                  ) : (
                    <Bell size={13} className="mt-0.5 shrink-0 text-amber-500" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{n.subject}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {n.request_info.facility} · {n.request_info.service_type}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          n.status === 'sent'
                            ? 'bg-green-50 text-green-700'
                            : n.status === 'failed'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {n.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>}

      </div>
    </div>
  )
}
