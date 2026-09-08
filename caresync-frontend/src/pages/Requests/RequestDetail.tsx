import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, CheckCircle, XCircle, AlertTriangle, Flag, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { requestsApi } from '@/api/requests'
import { useAuth } from '@/context/AuthContext'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/utils/constants'
import type { RequestStatus } from '@/types'

type ActiveModal = 'confirm' | 'cancel' | 'backup' | 'delete' | null

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: me } = useAuth()

  const [modal, setModal] = useState<ActiveModal>(null)
  const [confirmNotes, setConfirmNotes] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [backupReason, setBackupReason] = useState('')
  const [assigningVendor, setAssigningVendor] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState('')

  const { data: req, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: () => requestsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  })

  // Extract IDs before early returns so hook order is stable
  // The detail serializer returns nested objects as facility_detail / service_type_detail
  const facilityId = req?.facility_detail?.id ?? ''
  const serviceTypeId = req?.service_type_detail?.id ?? ''

  const { data: matchData } = useQuery({
    queryKey: ['vendor-matches', facilityId, serviceTypeId],
    queryFn: () => requestsApi.matchVendors(facilityId, serviceTypeId).then((r) => r.data),
    enabled: assigningVendor && !!facilityId && !!serviceTypeId,
  })
  const vendorList = matchData?.matches ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['request', id] })

  const submitMutation = useMutation({
    mutationFn: () => requestsApi.submit(id!),
    onSuccess: () => { toast.success('Request submitted.'); invalidate() },
    onError: () => toast.error('Failed to submit request.'),
  })

  const confirmMutation = useMutation({
    mutationFn: () => requestsApi.confirm(id!, confirmNotes),
    onSuccess: () => {
      toast.success('Request confirmed.')
      setModal(null)
      setConfirmNotes('')
      invalidate()
    },
    onError: () => toast.error('Could not confirm — check the request status.'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => requestsApi.cancel(id!, cancelReason),
    onSuccess: () => {
      toast.success('Request cancelled.')
      setModal(null)
      setCancelReason('')
      invalidate()
    },
    onError: () => toast.error('Could not cancel this request.'),
  })

  const backupMutation = useMutation({
    mutationFn: () => requestsApi.backupNeeded(id!, backupReason),
    onSuccess: () => {
      toast.success('Flagged as backup needed.')
      setModal(null)
      setBackupReason('')
      invalidate()
    },
    onError: () => toast.error('Failed to update status.'),
  })

  const completeMutation = useMutation({
    mutationFn: () => requestsApi.complete(id!),
    onSuccess: () => { toast.success('Marked as complete.'); invalidate() },
    onError: () => toast.error('Could not mark complete.'),
  })

  const assignVendorMutation = useMutation({
    mutationFn: (vendorId: string | null) => requestsApi.assignVendor(id!, vendorId),
    onSuccess: () => {
      toast.success('Vendor updated.')
      setAssigningVendor(false)
      setSelectedVendorId('')
      invalidate()
    },
    onError: () => toast.error('Failed to assign vendor.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => requestsApi.delete(id!),
    onSuccess: () => {
      toast.success('Request deleted.')
      navigate('/requests')
    },
    onError: () => toast.error('Could not delete request.'),
  })

  if (isLoading) return <PageLoader />
  if (!req) return <p className="text-slate-500 p-6">Request not found.</p>

  const facility = req.facility_detail
  const serviceType = req.service_type_detail
  const vendor = req.vendor_detail ?? null
  const requesterName = req.requester_name ?? '—'

  const isCoordinator = me?.role === 'admin' || me?.role === 'coordinator'
  const isReadonly = me?.role === 'readonly'
  const s = req.status as RequestStatus
  const closed = s === 'cancelled' || s === 'completed'

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/requests"
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
      >
        <ChevronLeft size={14} /> Back to Requests
      </Link>

      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="page-header">
            {serviceType?.name} — {facility?.name}
          </h1>
          <p className="page-subheader">{req.request_date}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Badge
            label={REQUEST_STATUS_LABELS[req.status] ?? req.status}
            color={REQUEST_STATUS_COLORS[req.status] ?? 'bg-slate-100 text-slate-600'}
          />
        </div>
      </div>

      {/* Action bar */}
      {!isReadonly && !closed && (
        <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          {s === 'draft' && (
            <>
              <Button
                size="sm"
                leftIcon={<CheckCircle size={14} />}
                loading={submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                Submit Request
              </Button>
              {isCoordinator && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Trash2 size={14} />}
                  onClick={() => setModal('delete')}
                  className="text-red-600 hover:border-red-300 hover:bg-red-50"
                >
                  Delete Draft
                </Button>
              )}
            </>
          )}

          {isCoordinator && (s === 'requested' || s === 'vendor_responded' || s === 'backup_needed' || s === 'credentialing_pending') && (
            <Button
              size="sm"
              leftIcon={<CheckCircle size={14} />}
              onClick={() => setModal('confirm')}
            >
              Confirm
            </Button>
          )}

          {(s === 'requested' || s === 'vendor_responded') && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Flag size={14} />}
              onClick={() => setModal('backup')}
              className="text-amber-600 hover:border-amber-300 hover:bg-amber-50"
            >
              Needs Backup
            </Button>
          )}

          {isCoordinator && s === 'confirmed' && (
            <Button
              size="sm"
              leftIcon={<CheckCircle size={14} />}
              loading={completeMutation.isPending}
              onClick={() => completeMutation.mutate()}
            >
              Mark Complete
            </Button>
          )}

          {isCoordinator && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<XCircle size={14} />}
              onClick={() => setModal('cancel')}
              className="text-red-600 hover:border-red-300 hover:bg-red-50"
            >
              Cancel
            </Button>
          )}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Case Details
          </h2>
          <Row label="Procedure" value={req.procedure_type || '—'} />
          <Row label="Arrival Time" value={req.arrival_time ?? '—'} />
          <Row label="Start Time" value={req.start_time ?? '—'} />
          <Row label="End Time" value={req.end_time ?? '—'} />
          <Row label="Surgeon / Provider" value={req.surgeon_provider || '—'} />
          <Row
            label="Patient ID"
            value={<span className="font-mono text-xs">{req.patient_identifier}</span>}
          />
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Assignment
          </h2>
          <Row label="Facility" value={facility?.name ?? '—'} />
          <Row label="Service Type" value={serviceType?.name ?? '—'} />
          <Row
            label="Vendor"
            value={
              assigningVendor ? (
                <div className="flex items-center gap-1.5">
                  <select
                    className="form-input py-1 text-xs"
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    autoFocus
                  >
                    <option value="">— unassign —</option>
                    {vendorList.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.is_preferred ? '★ ' : ''}{v.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                    onClick={() => assignVendorMutation.mutate(selectedVendorId || null)}
                    disabled={assignVendorMutation.isPending}
                  >
                    Save
                  </button>
                  <button
                    className="text-xs text-slate-400 hover:text-slate-600"
                    onClick={() => { setAssigningVendor(false); setSelectedVendorId('') }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  {vendor ? (
                    <span className="font-medium text-emerald-700">{vendor.name}</span>
                  ) : (
                    <span className="text-amber-600">Not assigned</span>
                  )}
                  {isCoordinator && !closed && (
                    <button
                      className="text-xs text-slate-400 hover:text-brand-600 underline"
                      onClick={() => {
                        setSelectedVendorId(vendor?.id ?? '')
                        setAssigningVendor(true)
                      }}
                    >
                      {vendor ? 'change' : 'assign'}
                    </button>
                  )}
                </span>
              )
            }
          />
          <Row label="Requester" value={requesterName} />

          {req.confirmation_notes && (
            <Row
              label="Confirmation Notes"
              value={<span className="text-slate-600">{req.confirmation_notes}</span>}
            />
          )}
        </div>
      </div>

      {req.notes && (
        <div className="card mt-4 p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
            Notes
          </h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{req.notes}</p>
        </div>
      )}

      {/* Status history */}
      {req.history && req.history.length > 0 && (
        <div className="card mt-4 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
            Status History
          </h2>
          <ol className="space-y-2">
            {req.history.map((h) => (
              <li key={h.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <div>
                  <span className="font-medium text-slate-700">
                    {REQUEST_STATUS_LABELS[h.new_status as keyof typeof REQUEST_STATUS_LABELS] ?? h.new_status}
                  </span>
                  {h.notes && <span className="ml-2 text-slate-400">— {h.notes}</span>}
                  <div className="text-xs text-slate-400 mt-0.5">
                    {h.changed_by_name ?? 'Unknown'} · {new Date(h.created_at).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Confirm modal */}
      {modal === 'confirm' && (
        <Overlay onClose={() => setModal(null)}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-emerald-600" />
            <h3 className="text-base font-semibold text-slate-800">Confirm Request</h3>
          </div>
          <p className="text-sm text-slate-500 mb-3">
            Add any confirmation notes (vendor name, arrival details, instructions).
          </p>
          <textarea
            className="form-input min-h-24 text-sm"
            placeholder="e.g. Confirmed with Acme Surgical — arriving at 6:45am, check in with front desk"
            value={confirmNotes}
            onChange={(e) => setConfirmNotes(e.target.value)}
            autoFocus
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={confirmMutation.isPending}
              onClick={() => confirmMutation.mutate()}
            >
              Confirm Request
            </Button>
          </div>
        </Overlay>
      )}

      {/* Cancel modal */}
      {modal === 'cancel' && (
        <Overlay onClose={() => setModal(null)}>
          <div className="flex items-center gap-2 mb-4">
            <XCircle size={18} className="text-red-500" />
            <h3 className="text-base font-semibold text-slate-800">Cancel Request</h3>
          </div>
          <p className="text-sm text-slate-500 mb-3">
            Provide a reason for cancellation. This will be recorded in the status history.
          </p>
          <textarea
            className="form-input min-h-20 text-sm"
            placeholder="e.g. Case postponed by surgeon, facility no longer needs coverage"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            autoFocus
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setModal(null)}>
              Go Back
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Cancel Request
            </Button>
          </div>
        </Overlay>
      )}

      {/* Backup modal */}
      {modal === 'backup' && (
        <Overlay onClose={() => setModal(null)}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="text-base font-semibold text-slate-800">Flag as Backup Needed</h3>
          </div>
          <p className="text-sm text-slate-500 mb-3">
            This will clear the current vendor and flag the request for reassignment.
            Add a note about why backup is needed.
          </p>
          <textarea
            className="form-input min-h-20 text-sm"
            placeholder="e.g. Primary vendor unavailable, credentialing issue, schedule conflict"
            value={backupReason}
            onChange={(e) => setBackupReason(e.target.value)}
            autoFocus
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              loading={backupMutation.isPending}
              onClick={() => backupMutation.mutate()}
            >
              Flag Backup Needed
            </Button>
          </div>
        </Overlay>
      )}

      {/* Delete confirm */}
      {modal === 'delete' && (
        <ConfirmDialog
          open
          title="Delete Draft"
          message="This draft will be permanently deleted. Are you sure?"
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => deleteMutation.mutate()}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-400 shrink-0">{label}</span>
      <span className="text-sm text-slate-700 text-right">{value}</span>
    </div>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {children}
      </div>
    </div>
  )
}
