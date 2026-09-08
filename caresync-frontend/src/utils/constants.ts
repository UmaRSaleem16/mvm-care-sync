export const APP_NAME = import.meta.env.VITE_APP_NAME || 'MVMCareSync'

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  draft:                'Draft',
  requested:            'Requested',
  vendor_responded:     'Vendor Responded',
  confirmed:            'Confirmed',
  backup_needed:        'Backup Needed',
  credentialing_pending:'Credentialing Pending',
  cancelled:            'Cancelled',
  completed:            'Completed',
}

export const REQUEST_STATUS_COLORS: Record<string, string> = {
  draft:                'bg-slate-100 text-slate-700',
  requested:            'bg-blue-100 text-blue-700',
  vendor_responded:     'bg-purple-100 text-purple-700',
  confirmed:            'bg-green-100 text-green-700',
  backup_needed:        'bg-orange-100 text-orange-700',
  credentialing_pending:'bg-yellow-100 text-yellow-700',
  cancelled:            'bg-red-100 text-red-700',
  completed:            'bg-emerald-100 text-emerald-700',
}

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  active:  'Active',
  pending: 'Pending',
  expired: 'Expired',
  none:    'None',
}

export const CREDENTIALING_STATUS_LABELS: Record<string, string> = {
  approved:     'Approved',
  pending:      'Pending',
  expired:      'Expired',
  not_required: 'Not Required',
}

export const USER_ROLE_LABELS: Record<string, string> = {
  admin:       'Administrator',
  coordinator: 'ASC Coordinator',
  staff:       'ASC Staff',
  readonly:    'Read Only',
}
