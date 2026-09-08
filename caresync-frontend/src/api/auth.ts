import apiClient from './client'
import type { TokenPair, User } from '@/types'

export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post<TokenPair>('/auth/token/', { username, password }),

  refreshToken: (refresh: string) =>
    apiClient.post<{ access: string }>('/auth/token/refresh/', { refresh }),

  getMe: () => apiClient.get<User>('/users/me/'),

  updateProfile: (data: Partial<Pick<User, 'first_name' | 'last_name' | 'email' | 'department' | 'phone'>>) =>
    apiClient.patch<User>('/users/me/', data),

  changePassword: (oldPassword: string, newPassword: string, confirmPassword: string) =>
    apiClient.post('/users/change_password/', {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),

  forgotPassword: (email: string) =>
    apiClient.post<{ detail: string }>('/auth/password-reset/', { email }),

  resetPassword: (uid: string, token: string, newPassword: string, confirmPassword: string) =>
    apiClient.post<{ detail: string }>('/auth/password-reset/confirm/', {
      uid,
      token,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
}
