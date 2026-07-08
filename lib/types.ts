export type Status = 'active' | 'expiring_soon' | 'expired' | 'renewed'

export interface Authority {
  id: string
  name: string
  abbreviation: string | null
  country: string | null
  website: string | null
  created_at: string
}

export interface Outlet {
  id: string
  name: string
  address: string | null
  outlet_code: string | null
  created_at: string
}

export interface Licence {
  id: string
  licence_number: string | null
  licence_name: string
  category: string | null
  authority_id: string | null
  outlet_id: string | null
  assigned_to: string | null
  issue_date: string | null
  expiry_date: string
  status: Status
  renewal_period_months: number | null
  notes: string | null
  created_at: string
  authorities?: Authority | null
  outlets?: Outlet | null
}

export interface RenewalLog {
  id: string
  licence_id: string
  action_type: string
  actioned_by: string | null
  action_date: string
  notes: string | null
  new_expiry_date: string | null
  new_licence_number: string | null
  created_at: string
}

export interface Activity {
  id: string
  actor: string | null
  action: string
  object_type: string | null
  object_id: string | null
  object_label: string | null
  created_at: string
}

export function computeStatus(expiryDate: string): Status {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 60) return 'expiring_soon'
  return 'active'
}

export function daysToExpiry(expiryDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
