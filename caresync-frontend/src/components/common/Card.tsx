import { cn } from '@/utils/helpers'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return <div className={cn('card', className)}>{children}</div>
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn('card-header', className)}>{children}</div>
}

export function CardBody({ className, children }: CardProps) {
  return <div className={cn('card-body', className)}>{children}</div>
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color?: string
  trend?: string
}

export function StatCard({ label, value, icon, color = 'bg-brand-50 text-brand-600', trend }: StatCardProps) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={cn('rounded-lg p-2.5', color)}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
        {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
      </div>
    </div>
  )
}
