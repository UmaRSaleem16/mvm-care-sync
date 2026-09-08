import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { vendorsApi } from '@/api/vendors'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import type { Vendor } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  service_type: z.string().min(1, 'Service type is required'),
  contact_name: z.string().min(2, 'Contact name is required'),
  contact_email: z.string().email('Valid email required'),
  contact_phone: z.string().optional(),
  backup_contact_name: z.string().optional(),
  backup_contact_email: z.string().email().optional().or(z.literal('')),
  backup_contact_phone: z.string().optional(),
  contract_status: z.enum(['active', 'pending', 'expired', 'none']),
  credentialing_status: z.enum(['approved', 'pending', 'expired', 'not_required']),
  services_provided: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  vendor: Vendor | null
}

export function VendorFormModal({ open, onClose, vendor }: Props) {
  const qc = useQueryClient()
  const isEditing = !!vendor

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => vendorsApi.listServiceTypes().then((r) => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      contract_status: 'none',
      credentialing_status: 'pending',
    },
  })

  useEffect(() => {
    if (vendor) {
      reset({
        name: vendor.name,
        service_type: typeof vendor.service_type === 'object'
          ? (vendor.service_type as { id: string }).id
          : vendor.service_type,
        contact_name: vendor.contact_name,
        contact_email: vendor.contact_email,
        contact_phone: vendor.contact_phone ?? '',
        backup_contact_name: vendor.backup_contact_name ?? '',
        backup_contact_email: vendor.backup_contact_email ?? '',
        backup_contact_phone: vendor.backup_contact_phone ?? '',
        contract_status: vendor.contract_status,
        credentialing_status: vendor.credentialing_status,
        services_provided: vendor.services_provided ?? '',
        notes: vendor.notes ?? '',
      })
    } else {
      reset({
        contract_status: 'none',
        credentialing_status: 'pending',
      })
    }
  }, [vendor, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing
        ? vendorsApi.update(vendor!.id, data as Parameters<typeof vendorsApi.update>[1])
        : vendorsApi.create(data as Parameters<typeof vendorsApi.create>[0]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] })
      toast.success(isEditing ? 'Vendor updated.' : 'Vendor created.')
      onClose()
    },
    onError: () => toast.error('Failed to save vendor. Check all required fields.'),
  })

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit Vendor' : 'Add Vendor'} size="lg">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label">Vendor Name *</label>
            <input className="form-input" {...register('name')} />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>

          <div className="col-span-2">
            <label className="form-label">Service Type *</label>
            <select className="form-input" {...register('service_type')}>
              <option value="">Select…</option>
              {serviceTypes.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
            {errors.service_type && <p className="form-error">{errors.service_type.message}</p>}
          </div>

          <div>
            <label className="form-label">Contact Name *</label>
            <input className="form-input" {...register('contact_name')} />
            {errors.contact_name && <p className="form-error">{errors.contact_name.message}</p>}
          </div>
          <div>
            <label className="form-label">Contact Email *</label>
            <input className="form-input" type="email" {...register('contact_email')} />
            {errors.contact_email && <p className="form-error">{errors.contact_email.message}</p>}
          </div>
          <div>
            <label className="form-label">Contact Phone</label>
            <input className="form-input" {...register('contact_phone')} />
          </div>

          <div>
            <label className="form-label">Contract Status *</label>
            <select className="form-input" {...register('contract_status')}>
              <option value="none">None</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="form-label">Credentialing Status *</label>
            <select className="form-input" {...register('credentialing_status')}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="expired">Expired</option>
              <option value="not_required">Not Required</option>
            </select>
          </div>

          <div>
            <label className="form-label">Backup Contact Name</label>
            <input className="form-input" {...register('backup_contact_name')} />
          </div>
          <div>
            <label className="form-label">Backup Contact Email</label>
            <input className="form-input" type="email" {...register('backup_contact_email')} />
          </div>

          <div className="col-span-2">
            <label className="form-label">Services Provided</label>
            <input className="form-input" {...register('services_provided')} />
          </div>

          <div className="col-span-2">
            <label className="form-label">Notes</label>
            <textarea className="form-input min-h-20" {...register('notes')} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEditing ? 'Save Changes' : 'Add Vendor'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
