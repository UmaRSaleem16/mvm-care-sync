import apiClient from './client'

export interface NotificationLogEntry {
  id: string
  request: string
  request_info: {
    id: string
    facility: string
    service_type: string
    request_date: string
    status: string
  }
  notification_type: 'email' | 'teams' | 'internal'
  status: 'sent' | 'simulated' | 'failed' | 'pending'
  recipient_email: string
  subject: string
  error_message: string
  sent_by_name: string | null
  created_at: string
}

export interface PaginatedNotifications {
  results: NotificationLogEntry[]
  count: number
  next: string | null
  previous: string | null
}

export const notificationsApi = {
  list: () => apiClient.get<PaginatedNotifications>('/notifications/'),
}
