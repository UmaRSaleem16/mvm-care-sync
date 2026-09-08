import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, ToggleLeft, ToggleRight, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

import { vendorsApi } from '@/api/vendors'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CONTRACT_STATUS_LABELS, CREDENTIALING_STATUS_LABELS } from '@/utils/constants'
import { useAuth } from '@/context/AuthContext'
import type { Vendor } from '@/types'
import { VendorFormModal } from './VendorFormModal'

export default function Vendors() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const isCoordinator = user?.role === 'admin' || user?.role === 'coordinator'
  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [toggling, setToggling] = useState<Vendor | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', { search, service_type: serviceFilter }],
    queryFn: () =>
      vendorsApi.list({ search, service_type: serviceFilter || undefined }).then((r) => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => vendorsApi.toggleActive(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['vendors'] })
      toast.success(res.data.message)
      setToggling(null)
    },
    onError: () => toast.error('Failed to update vendor status'),
  })

  const contractColor: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
    none: 'bg-slate-100 text-slate-600',
  }
  const credColor: Record<string, string> = {
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
    not_required: 'bg-slate-100 text-slate-600',
  }

  if (isLoading) return <PageLoader />

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="page-header">Vendor Database</h1>
          <p className="page-subheader">
            {data?.count ?? 0} vendor{data?.count !== 1 ? 's' : ''} total
          </p>
        </div>
        {isCoordinator && (
          <Button leftIcon={<Plus size={15} />} onClick={() => { setEditing(null); setShowForm(true) }}>
            Add Vendor
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="form-input pl-9"
            placeholder="Search vendors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input w-auto"
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
        >
          <option value="">All service types</option>
          {Array.from(new Set(data?.results.map((v) => v.service_type_name))).sort().map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {!data?.results.length ? (
        <EmptyState
          title="No vendors found"
          description={isCoordinator ? 'Add your first vendor to get started.' : 'No vendors have been configured yet.'}
          action={isCoordinator ? { label: 'Add Vendor', onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Vendor', 'Service Type', 'Contact', 'Contract', 'Credentialing', 'Status', ...(isCoordinator ? [''] : [])].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.results.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{vendor.name}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{vendor.service_type_name}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{vendor.contact_name}</p>
                      <p className="text-xs text-slate-400">{vendor.contact_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={CONTRACT_STATUS_LABELS[vendor.contract_status] ?? vendor.contract_status}
                        color={contractColor[vendor.contract_status]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={CREDENTIALING_STATUS_LABELS[vendor.credentialing_status] ?? vendor.credentialing_status}
                        color={credColor[vendor.credentialing_status]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={vendor.is_active ? 'Active' : 'Inactive'}
                        color={vendor.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}
                      />
                    </td>
                    {isCoordinator && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditing(vendor); setShowForm(true) }}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setToggling(vendor)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100"
                            title={vendor.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {vendor.is_active
                              ? <ToggleRight size={16} className="text-emerald-500" />
                              : <ToggleLeft size={16} className="text-slate-400" />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <VendorFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        vendor={editing}
      />

      {toggling && (
        <ConfirmDialog
          open={!!toggling}
          onClose={() => setToggling(null)}
          onConfirm={() => toggleMutation.mutate(toggling.id)}
          title={toggling.is_active ? 'Deactivate Vendor' : 'Activate Vendor'}
          message={`${toggling.is_active ? 'Deactivate' : 'Activate'} "${toggling.name}"?`}
          confirmLabel={toggling.is_active ? 'Deactivate' : 'Activate'}
          variant={toggling.is_active ? 'danger' : 'primary'}
          loading={toggleMutation.isPending}
        />
      )}
    </div>
  )
}
