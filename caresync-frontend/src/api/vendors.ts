import apiClient from './client'
import type { PaginatedResponse, ServiceType, Vendor } from '@/types'

export const vendorsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Vendor>>('/vendors/', { params }),

  get: (id: string) => apiClient.get<Vendor>(`/vendors/${id}/`),

  create: (data: Partial<Vendor>) => apiClient.post<Vendor>('/vendors/', data),

  update: (id: string, data: Partial<Vendor>) =>
    apiClient.put<Vendor>(`/vendors/${id}/`, data),

  patch: (id: string, data: Partial<Vendor>) =>
    apiClient.patch<Vendor>(`/vendors/${id}/`, data),

  toggleActive: (id: string) =>
    apiClient.post<{ is_active: boolean; message: string }>(
      `/vendors/${id}/toggle_active/`,
    ),

  listServiceTypes: () =>
    apiClient.get<ServiceType[]>('/vendors/service-types/'),
}
