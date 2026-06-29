# Agentic Layer

## Risk Levels & Actions

### Low — Auto-execute
- Compute and update `licences.status` on every load (rule-based)
- Tag `risk_level` based on days-to-expiry rules
- Write activity log entry on any CRUD action

### Medium — Light approval (user confirms)
- Suggest renewal_period_months from licence category
- Update licence status to `renewed` when a renewal log is submitted with a new expiry date
- Send in-app alert when a licence crosses the 60-day expiry threshold

### High — Always approval before action
- Draft renewal reminder email to authority (AI-generated copy, human reviews before send)
- Bulk-update assigned_to across an outlet's licences

### Critical — Human-only
- Delete a licence record
- Export audit log (compliance-sensitive)
- Any action that sends an external message to an authority

## Named Tools (approved list)
- `insert_renewal_log` — adds a renewal_logs row and updates licence status
- `update_licence_status` — changes status field with audit entry
- `draft_renewal_reminder` — returns draft text, does NOT send
- `write_activity` — appends to activities table
- `write_audit_log` — appends to audit_logs table

## Audit Log Fields
`actor | action | table_name | record_id | before_state | after_state | created_at`

## v1 vs Later
- **v1:** Only low-risk auto-actions (status compute, activity logging)
- **Next:** Medium approval actions (status transitions, in-app alerts)
- **Later:** AI draft tools + high-risk approval flows
