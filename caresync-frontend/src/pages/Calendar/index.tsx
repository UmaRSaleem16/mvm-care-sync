import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'

import { requestsApi } from '@/api/requests'
import { REQUEST_STATUS_LABELS } from '@/utils/constants'
import type { CaseRequest } from '@/types'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
})

const STATUS_BG: Record<string, string> = {
  draft:                 '#94a3b8',
  requested:             '#3b82f6',
  vendor_responded:      '#a855f7',
  confirmed:             '#22c55e',
  backup_needed:         '#f97316',
  credentialing_pending: '#eab308',
  cancelled:             '#ef4444',
  completed:             '#10b981',
}

interface CalEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: CaseRequest
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<string>(Views.MONTH)

  const rangeStart = startOfMonth(subMonths(currentDate, 1))
  const rangeEnd = endOfMonth(addMonths(currentDate, 1))

  const { data, isLoading } = useQuery({
    queryKey: ['requests-calendar', rangeStart.toISOString().slice(0, 10), rangeEnd.toISOString().slice(0, 10)],
    queryFn: () =>
      requestsApi
        .list({
          request_date_after: rangeStart.toISOString().slice(0, 10),
          request_date_before: rangeEnd.toISOString().slice(0, 10),
          page_size: 500,
        } as any)
        .then((r) => r.data),
  })

  const events: CalEvent[] = useMemo(() => {
    const requests = (data?.results ?? []) as CaseRequest[]
    return requests.map((req) => {
      const base = new Date(req.request_date + 'T00:00:00')
      const startTime = req.arrival_time
        ? new Date(`${req.request_date}T${req.arrival_time}`)
        : base
      const endTime = req.end_time
        ? new Date(`${req.request_date}T${req.end_time}`)
        : new Date(startTime.getTime() + 2 * 60 * 60 * 1000)

      const statusLabel = REQUEST_STATUS_LABELS[req.status] ?? req.status
      const serviceType = req.service_type_name ?? ''
      const facility = req.facility_name ?? ''
      const vendor = req.vendor_name ?? null

      const title = vendor
        ? `${statusLabel.toUpperCase()} – ${serviceType} – ${facility} | ${vendor}`
        : `${statusLabel.toUpperCase()} – ${serviceType} – ${facility}`

      return { id: req.id, title, start: startTime, end: endTime, resource: req }
    })
  }, [data])

  const eventStyleGetter = (event: CalEvent) => ({
    style: {
      backgroundColor: STATUS_BG[event.resource.status] ?? '#64748b',
      border: 'none',
      borderRadius: '4px',
      color: '#fff',
      fontSize: '11px',
      padding: '2px 6px',
    },
  })

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="page-header">Calendar View</h1>
          <p className="page-subheader">All coverage requests by date</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(REQUEST_STATUS_LABELS).map(([key, label]) => (
            <span
              key={key}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: STATUS_BG[key] }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex items-center gap-3">
        <button
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
          onClick={() => setCurrentDate((d) => subMonths(d, 1))}
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-slate-700 text-sm min-w-[140px] text-center">
          {format(currentDate, 'MMMM yyyy')}
        </span>
        <button
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
          onClick={() => setCurrentDate((d) => addMonths(d, 1))}
        >
          <ChevronRight size={18} />
        </button>
        <button
          className="ml-2 text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          onClick={() => setCurrentDate(new Date())}
        >
          Today
        </button>
        <div className="ml-auto flex gap-1">
          {[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-xs px-3 py-1.5 rounded-lg capitalize border ${
                view === v
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="card flex-1 overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-96 text-slate-400">Loading…</div>
        ) : (
          <BigCalendar
            localizer={localizer}
            events={events}
            view={view as any}
            onView={setView}
            date={currentDate}
            onNavigate={setCurrentDate}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(e) => navigate(`/requests/${e.id}`)}
            style={{ height: 620 }}
            toolbar={false}
            popup
          />
        )}
      </div>
    </div>
  )
}
