import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { facilitiesApi } from '@/api/facilities'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import type { Facility } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip_code: z.string().min(5, 'ZIP code is required'),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  internal_coordinator: z.string().optional(),
  default_arrival_rules: z.string().optional(),
  parking_access_notes: z.string().optional(),
  vendor_specific_instructions: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  facility: Facility | null
}

export function FacilityFormModal({ open, onClose, facility }: Props) {
  const qc = useQueryClient()
  const isEditing = !!facility

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { state: 'PA' },
  })

  useEffect(() => {
    if (facility) {
      reset({
        name: facility.name,
        address: facility.address,
        city: facility.city,
        state: facility.state,
        zip_code: facility.zip_code,
        contact_person: facility.contact_person ?? '',
        phone: facility.phone ?? '',
        internal_coordinator: facility.internal_coordinator ?? '',
        default_arrival_rules: facility.default_arrival_rules ?? '',
        parking_access_notes: facility.parking_access_notes ?? '',
        vendor_specific_instructions: facility.vendor_specific_instructions ?? '',
        notes: facility.notes ?? '',
      })
    } else {
      reset({ state: 'PA' })
    }
  }, [facility, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing
        ? facilitiesApi.update(facility!.id, data)
        : facilitiesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['facilities'] })
      toast.success(isEditing ? 'Facility updated.' : 'Facility created.')
      onClose()
    },
    onError: () => toast.error('Failed to save facility.'),
  })

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit Facility' : 'Add ASC Facility'} size="lg">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label">Facility Name *</label>
            <input className="form-input" {...register('name')} />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>

          <div className="col-span-2">
            <label className="form-label">Address *</label>
            <input className="form-input" {...register('address')} />
            {errors.address && <p className="form-error">{errors.address.message}</p>}
          </div>

          <div>
            <label className="form-label">City *</label>
            <input className="form-input" {...register('city')} />
            {errors.city && <p className="form-error">{errors.city.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">State *</label>
              <input className="form-input" {...register('state')} />
            </div>
            <div>
              <label className="form-label">ZIP *</label>
              <input className="form-input" {...register('zip_code')} />
            </div>
          </div>

          <div>
            <label className="form-label">Contact Person</label>
            <input className="form-input" {...register('contact_person')} />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-input" {...register('phone')} />
          </div>
          <div className="col-span-2">
            <label className="form-label">Internal Coordinator</label>
            <input className="form-input" {...register('internal_coordinator')} />
          </div>
          <div className="col-span-2">
            <label className="form-label">Default Arrival Rules</label>
            <textarea className="form-input min-h-16" {...register('default_arrival_rules')} />
          </div>
          <div>
            <label className="form-label">Parking / Access Notes</label>
            <textarea className="form-input min-h-16" {...register('parking_access_notes')} />
          </div>
          <div>
            <label className="form-label">Vendor-Specific Instructions</label>
            <textarea className="form-input min-h-16" {...register('vendor_specific_instructions')} />
          </div>
          <div className="col-span-2">
            <label className="form-label">Notes</label>
            <textarea className="form-input min-h-16" {...register('notes')} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEditing ? 'Save Changes' : 'Add Facility'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
