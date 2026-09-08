import apiClient from './client'
import type { PaginatedResponse, User } from '@/types'

export interface CreateUserPayload {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  role: string
  department?: string
  phone?: string
}

export interface UpdateUserPayload {
  first_name?: string
  last_name?: string
  email?: string
  department?: string
  phone?: string
  is_active?: boolean
  role?: string
}

export const usersApi = {
  list: () => apiClient.get<PaginatedResponse<User>>('/users/'),
  get: (id: string) => apiClient.get<User>(`/users/${id}/`),
  create: (data: CreateUserPayload) => apiClient.post<User>('/users/', data),
  update: (id: string, data: UpdateUserPayload) =>
    apiClient.patch<User>(`/users/${id}/`, data),
  deactivate: (id: string) => apiClient.patch<User>(`/users/${id}/`, { is_active: false }),
  activate: (id: string) => apiClient.patch<User>(`/users/${id}/`, { is_active: true }),
}
