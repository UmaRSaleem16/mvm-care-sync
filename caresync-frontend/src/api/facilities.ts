import apiClient from './client'
import type { Facility, PaginatedResponse } from '@/types'

export const facilitiesApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Facility>>('/facilities/', { params }),

  get: (id: string) => apiClient.get<Facility>(`/facilities/${id}/`),

  create: (data: Partial<Facility>) => apiClient.post<Facility>('/facilities/', data),

  update: (id: string, data: Partial<Facility>) =>
    apiClient.put<Facility>(`/facilities/${id}/`, data),

  patch: (id: string, data: Partial<Facility>) =>
    apiClient.patch<Facility>(`/facilities/${id}/`, data),

  toggleActive: (id: string) =>
    apiClient.post<{ is_active: boolean; message: string }>(
      `/facilities/${id}/toggle_active/`,
    ),
}
