import { cn } from '@/utils/helpers'
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from '@/utils/constants'
import type { RequestStatus } from '@/types'

interface BadgeProps {
  status: RequestStatus
  className?: string
}

export function StatusBadge({ status, className }: BadgeProps) {
  return (
    <span className={cn('badge', REQUEST_STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-700', className)}>
      {REQUEST_STATUS_LABELS[status] ?? status}
    </span>
  )
}

interface GenericBadgeProps {
  label: string
  color?: string
  className?: string
}

export function Badge({ label, color = 'bg-slate-100 text-slate-700', className }: GenericBadgeProps) {
  return <span className={cn('badge', color, className)}>{label}</span>
}
