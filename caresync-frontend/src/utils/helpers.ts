import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined, fmt = 'MM/dd/yyyy'): string {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), fmt) } catch { return dateStr }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  return formatDate(dateStr, 'MM/dd/yyyy h:mm a')
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '—'
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const d = new Date(); d.setHours(h, m)
    return format(d, 'h:mm a')
  } catch { return timeStr }
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function truncate(str: string, max = 60): string {
  return str.length <= max ? str : `${str.slice(0, max)}…`
}
