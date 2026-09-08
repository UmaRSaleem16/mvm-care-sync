import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'

import { requestsApi } from '@/api/requests'
import { Button } from '@/components/common/Button'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/utils/constants'
import { Badge } from '@/components/common/Badge'
import { useAuth } from '@/context/AuthContext'

export default function Requests() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canCreate = user?.role !== 'readonly'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['requests', { search, status: statusFilter }],
    queryFn: () =>
      requestsApi
        .list({ search: search || undefined, status: statusFilter || undefined })
        .then((r) => r.data),
  })

  if (isLoading) return <PageLoader />

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="page-header">Request Tracker</h1>
          <p className="page-subheader">{data?.count ?? 0} total requests</p>
        </div>
        {canCreate && (
          <Button leftIcon={<Plus size={15} />} onClick={() => navigate('/requests/new')}>
            New Request
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="form-input pl-9"
            placeholder="Search patient ID, surgeon, procedure…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(REQUEST_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {!data?.results.length ? (
        <EmptyState
          title="No requests found"
          description={canCreate ? 'Create your first case request to get started.' : 'No requests have been submitted yet.'}
          action={canCreate ? { label: 'New Request', onClick: () => navigate('/requests/new') } : undefined}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[
                    'Date',
                    'Facility',
                    'Service',
                    'Vendor',
                    'Patient ID',
                    'Surgeon',
                    'Status',
                    '',
                  ].map((h) => (
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
                {data.results.map((req) => (
                  <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{req.request_date}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {req.facility_name ?? (typeof req.facility === 'object' ? (req.facility as { name: string }).name : req.facility)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {req.service_type_name ?? (typeof req.service_type === 'object' ? (req.service_type as { name: string }).name : req.service_type)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {req.vendor_name ?? (req.vendor && typeof req.vendor === 'object'
                        ? (req.vendor as { name: string }).name
                        : null) ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {req.patient_identifier}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{req.surgeon_provider || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={REQUEST_STATUS_LABELS[req.status] ?? req.status}
                        color={REQUEST_STATUS_COLORS[req.status] ?? 'bg-slate-100 text-slate-600'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/requests/${req.id}`}
                        className="text-xs font-medium text-brand-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
