# Architecture

## Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Database + Auth:** Supabase (Postgres, RLS, Storage, Edge Functions later)
- **Hosting:** Vercel

## Now vs Later
| Now | Later |
|-----|-------|
| Licence CRUD + status compute | Document uploads (Supabase Storage) |
| Renewal log entry | Email alerts (Edge Functions) |
| Shared dashboard + activity feed | Auth + per-user RLS |
| Seed demo data, no login | AI risk scoring + renewal drafts |

## Key Action Flow — "Log a Renewal"
1. Team member opens licence detail page
2. Fills Log Renewal form (action type, notes, date, new expiry if known)
3. Form POST → Supabase `renewal_logs` insert
4. App updates `licences.status` and `licences.expiry_date` if new expiry provided
5. Activity record written to `activities` table
6. Dashboard re-fetches; status badge and days-to-expiry reflect new state
7. Renewal history timeline on detail page shows new entry at top

## Layer Plan
1. **Data layer first** — tables, RLS, seed rows
2. **App logic** — CRUD forms, status computation, renewal workflow (no AI required)
3. **Smart features later** — risk scoring, AI renewal drafts, expiry alerts

## Core Without AI
Status, days-to-expiry, and the renewal workflow are fully rule-based. AI adds convenience (drafts, risk tags) but the app is fully operational without it.
