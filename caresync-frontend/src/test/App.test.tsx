import { describe, it, expect } from 'vitest'
import { REQUEST_STATUS_LABELS, CONTRACT_STATUS_LABELS } from '@/utils/constants'

describe('constants', () => {
  it('has all request status labels defined', () => {
    const statuses = [
      'draft', 'requested', 'vendor_responded', 'confirmed',
      'backup_needed', 'credentialing_pending', 'cancelled', 'completed',
    ]
    statuses.forEach((s) => {
      expect(REQUEST_STATUS_LABELS[s]).toBeDefined()
    })
  })

  it('has all contract status labels defined', () => {
    ['active', 'pending', 'expired', 'none'].forEach((s) => {
      expect(CONTRACT_STATUS_LABELS[s]).toBeDefined()
    })
  })
})
