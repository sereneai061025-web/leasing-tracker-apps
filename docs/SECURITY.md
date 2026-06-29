# Security

## Secret Handling
- Supabase service role key never exposed to the frontend
- All client calls use the anon key with RLS as the guard
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public safe), `SUPABASE_SERVICE_ROLE_KEY` (server-only, Edge Functions only)

## Permission Model (end state, reached at Lock-Down sprint)
| Role | Licences | Renewal Logs | Audit Logs |
|------|----------|--------------|------------|
| Admin | full CRUD | full CRUD | read |
| Member | read + log renewal | insert own | none |
| Anonymous | none (post lock-down) | none | none |

**v1 (demo phase):** permissive RLS — all tables open for read and write without login. Lock-Down sprint replaces with `auth.uid() = user_id` owner policies and role checks.

## Approved-Tools Rule
Agents may only call named tools from the approved list in `AGENTIC_LAYER.md`. No raw SQL execution, no `send_any`, no `run_any`. Every tool call writes to `audit_logs`.

## Audit Principle
Every state-changing action (create, update, delete, status change) writes a row to `audit_logs` with before/after state. Audit logs are append-only; no delete policy is granted on that table.
