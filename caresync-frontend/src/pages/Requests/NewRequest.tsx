import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Check, AlertCircle, Users, Star } from 'lucide-react'
import toast from 'react-hot-toast'

import { requestsApi } from '@/api/requests'
import { facilitiesApi } from '@/api/facilities'
import { vendorsApi } from '@/api/vendors'
import { Button } from '@/components/common/Button'

// ── Schema ─────────────────────────────────────────────────────────────────

const schema = z
  .object({
    // Step 1 — Case basics
    request_date: z.string().min(1, 'Request date is required'),
    facility: z.string().min(1, 'Facility is required'),
    service_type: z.string().min(1, 'Service type is required'),

    // Step 2 — Timing
    procedure_type: z.string().optional(),
    arrival_time: z.string().optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),

    // Step 3 — Patient + staff
    patient_identifier: z
      .string()
      .min(2, 'Patient identifier must be at least 2 characters (use initials or case ID)')
      .max(50, 'Patient identifier too long — use initials or a short case ID only')
      .refine(
        (v) => !/^\s*(mr\.?|mrs\.?|ms\.?)?[a-z]+\s+[a-z]+\s*$/i.test(v),
        { message: 'Do not enter full patient names — use initials (e.g. J.D.) or a case ID.' },
      ),
    surgeon_provider: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.start_time && d.end_time && d.start_time >= d.end_time) return false
      return true
    },
    { message: 'End time must be after start time.', path: ['end_time'] },
  )

type FormData = z.infer<typeof schema>

// ── Step config ────────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Case Basics', description: 'Date, facility and service' },
  { title: 'Case Timing', description: 'Procedure and schedule' },
  { title: 'Patient & Staff', description: 'PHI-safe identifiers only' },
]

const STEP_FIELDS: (keyof FormData)[][] = [
  ['request_date', 'facility', 'service_type'],
  ['procedure_type', 'arrival_time', 'start_time', 'end_time'],
  ['patient_identifier', 'surgeon_provider', 'notes'],
]

// ── Component ─────────────────────────────────────────────────────────────

export default function NewRequest() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitAsDraft, setSubmitAsDraft] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      request_date: new Date().toISOString().split('T')[0],
    },
  })

  const selectedFacility = watch('facility')
  const selectedServiceType = watch('service_type')

  const { data: facilitiesData } = useQuery({
    queryKey: ['facilities-active'],
    queryFn: () => facilitiesApi.list({ is_active: true }).then((r) => r.data),
  })
  const facilities = facilitiesData?.results ?? []

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => vendorsApi.listServiceTypes().then((r) => r.data),
  })

  const { data: matchData } = useQuery({
    queryKey: ['vendor-match', selectedFacility, selectedServiceType],
    queryFn: () =>
      requestsApi.matchVendors(selectedFacility, selectedServiceType).then((r) => r.data),
    enabled: !!(selectedFacility && selectedServiceType),
  })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        request_date: data.request_date,
        facility: data.facility,
        service_type: data.service_type,
        procedure_type: data.procedure_type || undefined,
        arrival_time: data.arrival_time || null,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        patient_identifier: data.patient_identifier,
        surgeon_provider: data.surgeon_provider || undefined,
        notes: data.notes || undefined,
      }
      const res = await requestsApi.create(payload)
      if (!submitAsDraft) {
        await requestsApi.submit(res.data.id)
      }
      return res.data
    },
    onSuccess: (data) => {
      toast.success(
        submitAsDraft ? 'Draft saved.' : 'Request submitted — vendors will be notified.',
      )
      navigate(`/requests/${data.id}`)
    },
    onError: () => toast.error('Failed to save request. Check all required fields.'),
  })

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step])
    if (valid) setStep((s) => s + 1)
  }

  function goBack() {
    setStep((s) => s - 1)
  }

  const isLastStep = step === STEPS.length - 1

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/requests')}
          className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
        >
          <ChevronLeft size={14} /> Back to Requests
        </button>
        <h1 className="page-header">New Case Request</h1>
        <p className="page-subheader">
          Step {step + 1} of {STEPS.length} — {STEPS[step].description}
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  i < step
                    ? 'bg-brand-600 text-white'
                    : i === step
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={`mt-1 text-xs ${i === step ? 'font-medium text-brand-600' : 'text-slate-400'}`}
              >
                {s.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 mb-5 h-0.5 flex-1 transition-colors ${i < step ? 'bg-brand-600' : 'bg-slate-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate>
        <div className="card p-6">

          {/* ── Step 1: Case Basics ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="form-label">Request Date *</label>
                <input className="form-input" type="date" {...register('request_date')} />
                {errors.request_date && (
                  <p className="form-error">{errors.request_date.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">ASC / Facility *</label>
                <select className="form-input" {...register('facility')}>
                  <option value="">Select facility…</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                {errors.facility && <p className="form-error">{errors.facility.message}</p>}
              </div>

              <div>
                <label className="form-label">Service Needed *</label>
                <select className="form-input" {...register('service_type')}>
                  <option value="">Select service type…</option>
                  {serviceTypes.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
                {errors.service_type && (
                  <p className="form-error">{errors.service_type.message}</p>
                )}
              </div>

              {/* Vendor match result */}
              {matchData && selectedFacility && selectedServiceType && (
                <div
                  className={`rounded-lg border px-4 py-3 ${
                    matchData.count === 0
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-emerald-200 bg-emerald-50'
                  }`}
                >
                  {matchData.count === 0 && (
                    <div className="flex gap-2 text-orange-800">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">No available vendors found</p>
                        <p className="text-xs mt-0.5">
                          No bookable vendors are configured for this ASC + service combination.
                          You can still save a draft and assign a vendor later.
                        </p>
                      </div>
                    </div>
                  )}
                  {matchData.count === 1 && (
                    <div className="flex gap-2 text-emerald-800">
                      <Check size={16} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">
                          Auto-selected: {matchData.auto_selected?.name}
                        </p>
                        <p className="text-xs mt-0.5">
                          Only one bookable vendor available — will be assigned automatically.
                        </p>
                      </div>
                    </div>
                  )}
                  {matchData.count > 1 && (
                    <div>
                      <div className="flex gap-2 text-emerald-800 mb-2">
                        <Users size={16} className="mt-0.5 shrink-0" />
                        <p className="text-sm font-medium">
                          {matchData.count} vendors available
                          {matchData.has_preferred ? ' — preferred marked with ★' : ''}
                        </p>
                      </div>
                      <ul className="space-y-1">
                        {matchData.matches.map((v) => (
                          <li key={v.id} className="flex items-center gap-1.5 text-xs text-emerald-700">
                            {v.is_preferred ? (
                              <Star size={11} className="text-amber-500 fill-amber-500" />
                            ) : (
                              <span className="w-[11px]" />
                            )}
                            {v.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Case Timing ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="form-label">Procedure / Case Type</label>
                <input
                  className="form-input"
                  placeholder="e.g. Total knee arthroplasty"
                  {...register('procedure_type')}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Requested Arrival Time</label>
                  <input className="form-input" type="time" {...register('arrival_time')} />
                </div>
                <div>
                  <label className="form-label">Est. Case Start</label>
                  <input className="form-input" type="time" {...register('start_time')} />
                </div>
                <div>
                  <label className="form-label">Est. Case End</label>
                  <input className="form-input" type="time" {...register('end_time')} />
                  {errors.end_time && (
                    <p className="form-error">{errors.end_time.message}</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <p className="font-medium">All times are approximate</p>
                <p className="text-xs mt-0.5">
                  Vendors are notified of arrival expectations. Exact scheduling is coordinated
                  directly.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: Patient & Staff ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="flex gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">PHI Protection Required</p>
                    <p className="mt-0.5 text-xs text-blue-700">
                      Enter patient initials only (e.g. <strong>J.D.</strong>) or an internal case
                      ID. Do not enter full names, dates of birth, or medical record numbers.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Patient Identifier *</label>
                <input
                  className="form-input"
                  placeholder="e.g. J.D. or CASE-2024-001"
                  maxLength={50}
                  {...register('patient_identifier')}
                />
                {errors.patient_identifier ? (
                  <p className="form-error">{errors.patient_identifier.message}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">
                    Initials or case ID only — max 50 characters
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Surgeon / Provider</label>
                <input
                  className="form-input"
                  placeholder="e.g. Dr. Smith"
                  {...register('surgeon_provider')}
                />
              </div>

              <div>
                <label className="form-label">Special Notes</label>
                <textarea
                  className="form-input min-h-24"
                  placeholder="Any special equipment, access requirements, or instructions for the vendor…"
                  {...register('notes')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {step > 0 && (
              <Button type="button" variant="outline" leftIcon={<ChevronLeft size={14} />} onClick={goBack}>
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            {isLastStep ? (
              <>
                <Button
                  type="submit"
                  variant="secondary"
                  loading={mutation.isPending && submitAsDraft}
                  onClick={() => setSubmitAsDraft(true)}
                >
                  Save as Draft
                </Button>
                <Button
                  type="submit"
                  loading={mutation.isPending && !submitAsDraft}
                  onClick={() => setSubmitAsDraft(false)}
                  rightIcon={<Check size={14} />}
                >
                  Submit Request
                </Button>
              </>
            ) : (
              <Button type="button" rightIcon={<ChevronRight size={14} />} onClick={goNext}>
                Next
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
