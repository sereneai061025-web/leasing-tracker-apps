# Test Plan

## v1 Success Scenario — End-to-End

### Setup
- App running with seed data (5 demo licences visible on dashboard without login)

### Steps
1. **Open dashboard (`/`)** → confirm 5 licences visible, status badges correct (Active/Expiring Soon/Expired), days-to-expiry calculated
2. **Click "Add Licence"** → fill: name="Pest Control Licence", authority=SFA, outlet=Orchard Central, expiry=30 days from today → submit
3. **Confirm new row appears** in dashboard with status "Expiring Soon" and correct days count
4. **Click the new licence** → detail page loads with empty renewal history
5. **Click "Log Renewal"** → fill: action_type=Submitted, actioned_by=Priya Nair, notes="Sent via SFA portal", new expiry=+12 months → submit
6. **Confirm** renewal log entry appears in history timeline; licence expiry date updated; status flips to Active
7. **Return to dashboard** → activity feed shows "Priya Nair logged renewal submission for Pest Control Licence"
8. **Edit the licence** (change assigned_to) → confirm change persists on reload
9. **Delete the licence** → confirm modal; licence removed from dashboard

## Empty State Tests
- Delete all licences → dashboard shows empty state message, not a blank table
- Open a licence with no renewal logs → history section shows "No actions logged yet"

## Error Cases
- Submit Add Licence form with missing expiry_date → inline validation error, no DB write
- Submit Log Renewal with missing action_type → inline error shown
- Supabase unreachable → error toast displayed, form not frozen

## Permission Check (post Sprint 4)
- Logged-out user attempts POST to `licences` → 403 from RLS, UI shows auth redirect
- Member role attempts delete → button hidden; direct API call returns 403
