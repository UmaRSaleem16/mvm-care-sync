import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, ToggleLeft, ToggleRight, Pencil, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

import { facilitiesApi } from '@/api/facilities'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useAuth } from '@/context/AuthContext'
import type { Facility } from '@/types'
import { FacilityFormModal } from './FacilityFormModal'

export default function Facilities() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const isCoordinator = user?.role === 'admin' || user?.role === 'coordinator'
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Facility | null>(null)
  const [toggling, setToggling] = useState<Facility | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['facilities', { search }],
    queryFn: () => facilitiesApi.list({ search }).then((r) => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => facilitiesApi.toggleActive(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['facilities'] })
      toast.success(res.data.message)
      setToggling(null)
    },
    onError: () => toast.error('Failed to update facility status'),
  })

  if (isLoading) return <PageLoader />

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="page-header">ASC Facilities</h1>
          <p className="page-subheader">
            {data?.count ?? 0} facilit{data?.count !== 1 ? 'ies' : 'y'} total
          </p>
        </div>
        {isCoordinator && (
          <Button leftIcon={<Plus size={15} />} onClick={() => { setEditing(null); setShowForm(true) }}>
            Add Facility
          </Button>
        )}
      </div>

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="form-input pl-9"
            placeholder="Search facilities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {!data?.results.length ? (
        <EmptyState
          title="No facilities found"
          description={isCoordinator ? 'Add your first ASC facility.' : 'No facilities have been configured yet.'}
          action={isCoordinator ? { label: 'Add Facility', onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.results.map((facility) => (
            <div key={facility.id} className="card p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-800">{facility.name}</h3>
                <Badge
                  label={facility.is_active ? 'Active' : 'Inactive'}
                  color={facility.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}
                />
              </div>
              <div className="mb-4 flex items-start gap-2 text-sm text-slate-500">
                <MapPin size={13} className="mt-0.5 flex-shrink-0" />
                <span>{facility.full_address}</span>
              </div>
              {facility.contact_person && (
                <p className="mb-1 text-xs text-slate-500">
                  <span className="font-medium">Contact:</span> {facility.contact_person}
                  {facility.phone && ` · ${facility.phone}`}
                </p>
              )}
              {facility.internal_coordinator && (
                <p className="text-xs text-slate-500">
                  <span className="font-medium">Coordinator:</span> {facility.internal_coordinator}
                </p>
              )}
              {isCoordinator && (
                <div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => { setEditing(facility); setShowForm(true) }}
                    className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-brand-600"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => setToggling(facility)}
                    className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
                  >
                    {facility.is_active
                      ? <><ToggleRight size={14} className="text-emerald-500" /> Deactivate</>
                      : <><ToggleLeft size={14} /> Activate</>}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <FacilityFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        facility={editing}
      />

      {toggling && (
        <ConfirmDialog
          open={!!toggling}
          onClose={() => setToggling(null)}
          onConfirm={() => toggleMutation.mutate(toggling.id)}
          title={toggling.is_active ? 'Deactivate Facility' : 'Activate Facility'}
          message={`${toggling.is_active ? 'Deactivate' : 'Activate'} "${toggling.name}"?`}
          confirmLabel={toggling.is_active ? 'Deactivate' : 'Activate'}
          variant={toggling.is_active ? 'danger' : 'primary'}
          loading={toggleMutation.isPending}
        />
      )}
    </div>
  )
}
