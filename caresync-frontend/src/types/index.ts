// ── Shared API response types ──────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  total_pages: number
  current_page: number
  results: T[]
}

export interface ApiError {
  error: true
  status_code: number
  detail: Record<string, string[]> | string
}

// ── User ───────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'coordinator' | 'staff' | 'readonly'

export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: UserRole
  department: string
  phone: string
  is_active: boolean
  date_joined: string
  last_login: string | null
}

// ── Auth tokens ────────────────────────────────────────────────────────────

export interface TokenPair {
  access: string
  refresh: string
}

// ── Vendor ─────────────────────────────────────────────────────────────────

export type ContractStatus = 'active' | 'pending' | 'expired' | 'none'
export type CredentialingStatus = 'approved' | 'pending' | 'expired' | 'not_required'

export interface ServiceType {
  id: string
  name: string
  code: string
  description: string
}

export interface Vendor {
  id: string
  name: string
  service_type: string | ServiceType
  service_type_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  backup_contact_name: string
  backup_contact_email: string
  backup_contact_phone: string
  contract_status: ContractStatus
  credentialing_status: CredentialingStatus
  services_provided: string
  notes: string
  is_active: boolean
  is_bookable: boolean
  created_at: string
  updated_at: string
}

// ── Facility ───────────────────────────────────────────────────────────────

export interface Facility {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  full_address: string
  contact_person: string
  phone: string
  internal_coordinator: string
  default_arrival_rules: string
  parking_access_notes: string
  vendor_specific_instructions: string
  notes: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── Case Request ───────────────────────────────────────────────────────────

export type RequestStatus =
  | 'draft'
  | 'requested'
  | 'vendor_responded'
  | 'confirmed'
  | 'backup_needed'
  | 'credentialing_pending'
  | 'cancelled'
  | 'completed'

export interface CaseRequest {
  id: string
  request_date: string
  facility: Facility | string
  service_type: ServiceType | string
  vendor: Vendor | string | null
  // flat name fields returned by the list serializer
  facility_name?: string
  service_type_name?: string
  vendor_name?: string | null
  requester_name?: string
  status_display?: string
  // nested detail objects returned by the detail serializer
  facility_detail?: Facility
  service_type_detail?: ServiceType
  vendor_detail?: Vendor | null
  procedure_type: string
  arrival_time: string | null
  start_time: string | null
  end_time: string | null
  patient_identifier: string
  surgeon_provider: string
  notes: string
  requester: User | string
  status: RequestStatus
  confirmation_notes: string
  calendar_title?: string
  history?: RequestStatusHistory[]
  created_at: string
  updated_at: string
}

export interface RequestStatusHistory {
  id: string
  previous_status: RequestStatus | null
  new_status: RequestStatus
  changed_by_name: string
  notes: string
  created_at: string
}

// ── Notification ───────────────────────────────────────────────────────────

export type NotificationType = 'email' | 'teams' | 'internal'
export type NotificationStatus = 'sent' | 'simulated' | 'failed' | 'pending'

export interface NotificationLog {
  id: string
  request: string
  notification_type: NotificationType
  status: NotificationStatus
  recipient_email: string
  subject: string
  body: string
  error_message: string
  created_at: string
}

// ── Vendor Coverage Rule ───────────────────────────────────────────────────

export interface VendorCoverageRule {
  id: string
  vendor: Vendor
  facility: Facility
  service_type: ServiceType
  is_preferred: boolean
  notes: string
  is_active: boolean
}

// ── Calendar event (frontend-only shape for react-big-calendar) ────────────

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: RequestStatus
  resource: CaseRequest
}
