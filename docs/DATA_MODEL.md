# Data Model

## authorities
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| user_id | uuid nullable | owner-scoping at lock-down |
| name | text | e.g. Singapore Food Agency |
| abbreviation | text | e.g. SFA |
| country | text | default 'Singapore' |
| website | text | |
| created_at | timestamptz | |

## outlets
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| user_id | uuid nullable | |
| name | text | |
| address | text | |
| outlet_code | text | short reference e.g. OC-01 |
| created_at | timestamptz | |

## licences
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| user_id | uuid nullable | |
| licence_number | text | |
| licence_name | text | |
| category | text | e.g. Food Hygiene, Liquor |
| authority_id | uuid FK → authorities | |
| outlet_id | uuid FK → outlets | |
| assigned_to | text | name; FK to users at lock-down |
| issue_date | date | |
| expiry_date | date | |
| status | text | active / expiring_soon / expired / renewed |
| renewal_period_months | integer | **AI field** |
| renewal_period_months_source | text | e.g. 'ai_doc_parse' |
| renewal_period_months_confidence | numeric | 0–1 |
| renewal_period_months_review_status | text | default 'unreviewed' |
| risk_level | text | **AI field** critical/high/medium/low |
| risk_level_source | text | |
| risk_level_confidence | numeric | |
| risk_level_review_status | text | default 'unreviewed' |
| notes | text | |
| document_url | text | storage path, later |
| created_at | timestamptz | |

## renewal_logs
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| user_id | uuid nullable | |
| licence_id | uuid FK → licences | cascade delete |
| action_type | text | Submitted / Chased / Approved / Renewed / Escalated |
| actioned_by | text | free text until auth |
| action_date | date | |
| notes | text | |
| new_expiry_date | date | nullable |
| new_licence_number | text | nullable |
| created_at | timestamptz | |

## activities
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| user_id | uuid nullable | |
| actor | text | |
| action | text | human-readable e.g. 'logged renewal submission' |
| object_type | text | 'licence' / 'renewal_log' |
| object_id | uuid | |
| object_label | text | |
| meta | jsonb | extra detail |
| created_at | timestamptz | |

## audit_logs
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| user_id | uuid nullable | |
| actor | text | |
| action | text | |
| table_name | text | |
| record_id | uuid | |
| before_state | jsonb | |
| after_state | jsonb | |
| ip_address | text | |
| created_at | timestamptz | |

## RLS
All tables: v1 permissive (select + all open). Lock-down sprint replaces with `auth.uid() = user_id`.
