# PRD — F&B Licence Tracker

## Problem
F&B compliance teams track licence expiries, renewals, and authority deadlines across spreadsheets and chat. Records go stale, renewals get missed, and no one has a single live view.

## Target User
Finance / compliance team members at an F&B operator — 2–10 people sharing responsibility for multiple licences across multiple outlets.

## Core Objects
- **Licence** — the central record: number, name, category, authority, outlet, expiry date, status, assigned owner
- **Authority** — the issuing body (SFA, MOM, STB, etc.)
- **Outlet** — the physical location the licence belongs to
- **Renewal Log** — every action taken on a licence (submitted, chased, approved, renewed)
- **Activity Feed** — team-wide stream of all changes

## MVP (v1) Must-Haves
- [ ] Add / edit / delete a licence record
- [ ] View all licences in a shared dashboard with status badges and days-to-expiry
- [ ] Status auto-computed: Active / Expiring Soon (≤60 days) / Expired
- [ ] Log a renewal action (action type, notes, actioned by, date) on any licence
- [ ] Renewal history visible on each licence's detail page
- [ ] Activity feed showing latest team actions
- [ ] Seed demo data — viewable without login

## Non-Goals (v1)
- User authentication and per-user data isolation
- Document uploads
- Email/push notifications
- Calendar integrations
- AI drafting or auto-tagging

## Success Scenario
Priya opens the dashboard, sees "Food Shop Licence — OC-01" flagged Expiring Soon, clicks in, logs "Renewal Submitted" with a reference number, and the dashboard instantly reflects the updated status and shows her entry in the activity feed — all without a spreadsheet.
