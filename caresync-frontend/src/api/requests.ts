import apiClient from './client'
import type { CaseRequest, PaginatedResponse } from '@/types'

export interface DashboardStats {
  open_requests: number
  confirmed_today: number
  pending_response: number
  backup_needed: number
  total_requests: number
  draft: number
  cancelled: number
  completed: number
  recent_requests: RecentRequest[]
}

export interface RecentRequest {
  id: string
  request_date: string
  facility_name: string
  service_type_name: string
  vendor_name: string | null
  status: string
  status_display: string
  requester_name: string
  patient_identifier: string
  surgeon_provider: string
  created_at: string
  updated_at: string
}

export interface CreateCaseRequestPayload {
  request_date: string
  facility: string
  service_type: string
  vendor?: string | null
  procedure_type?: string
  arrival_time?: string | null
  start_time?: string | null
  end_time?: string | null
  patient_identifier: string
  surgeon_provider?: string
  notes?: string
}

export interface CaseRequestFilters {
  status?: string
  facility?: string
  service_type?: string
  request_date?: string
  search?: string
  page?: number
}

export interface VendorMatchResult {
  matches: Array<{
    id: string
    name: string
    service_type_name: string
    contact_name: string
    contact_email: string
    contract_status: string
    credentialing_status: string
    is_active: boolean
    is_bookable: boolean
    is_preferred: boolean
  }>
  auto_selected: VendorMatchResult['matches'][0] | null
  count: number
  has_preferred: boolean
}

export const requestsApi = {
  getDashboardStats: () =>
    apiClient.get<DashboardStats>('/requests/dashboard-stats/'),

  matchVendors: (facilityId: string, serviceTypeId: string) =>
    apiClient.get<VendorMatchResult>('/requests/match-vendors/', {
      params: { facility: facilityId, service_type: serviceTypeId },
    }),

  list: (params?: CaseRequestFilters) =>
    apiClient.get<PaginatedResponse<CaseRequest>>('/requests/', { params }),

  get: (id: string) => apiClient.get<CaseRequest>(`/requests/${id}/`),

  create: (data: CreateCaseRequestPayload) =>
    apiClient.post<CaseRequest>('/requests/', data),

  update: (id: string, data: Partial<CreateCaseRequestPayload>) =>
    apiClient.patch<CaseRequest>(`/requests/${id}/`, data),

  delete: (id: string) => apiClient.delete(`/requests/${id}/`),

  submit: (id: string) =>
    apiClient.post<CaseRequest>(`/requests/${id}/submit/`),

  confirm: (id: string, confirmationNotes: string) =>
    apiClient.post<CaseRequest>(`/requests/${id}/confirm/`, { confirmation_notes: confirmationNotes }),

  cancel: (id: string, reason: string) =>
    apiClient.post<CaseRequest>(`/requests/${id}/cancel/`, { reason }),

  backupNeeded: (id: string, reason?: string) =>
    apiClient.post<CaseRequest>(`/requests/${id}/backup_needed/`, { reason: reason ?? '' }),

  complete: (id: string) =>
    apiClient.post<CaseRequest>(`/requests/${id}/complete/`),

  assignVendor: (id: string, vendorId: string | null) =>
    apiClient.patch<CaseRequest>(`/requests/${id}/assign_vendor/`, { vendor: vendorId }),
}
