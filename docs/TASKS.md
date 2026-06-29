# Tasks & Sprints

## Sprint 1 — DB + Licence Registry (Core Engine)
**Goal:** The licence table works end-to-end; team can add, view, edit, and delete licences against the live DB.

- [ ] Apply migration SQL to Supabase (authorities, outlets, licences, renewal_logs, activities, audit_logs)
- [ ] Seed 5 demo licence rows across statuses
- [ ] Build `/` dashboard page: licence table with status badges, days-to-expiry column, sorted by risk
- [ ] Add Licence form → inserts to `licences` table
- [ ] Edit Licence form → updates `licences` row
- [ ] Delete Licence → confirms + deletes, writes audit_log
- [ ] Compute status client-side: active / expiring_soon (≤60d) / expired
- [ ] Empty state (no licences), loading skeleton, error toast

**Definition of Done:** A new licence added via the form appears in the table with the correct status badge and days-to-expiry. Seed rows visible on first load without login.

---

## Sprint 2 — Renewal Log + Dashboard ✅ v1 functional milestone
**Goal:** Team can log renewal actions; dashboard reflects live state.

- [ ] Licence detail page `/licences/[id]`
- [ ] Log Renewal form on detail page → inserts to `renewal_logs`, updates licence status/expiry if new expiry provided
- [ ] Renewal history timeline on detail page (newest first)
- [ ] Dashboard summary cards: Total / Active / Expiring Soon / Expired counts
- [ ] Activity feed panel: latest 20 entries from `activities` table
- [ ] Write activity row on every CRUD and renewal-log action
- [ ] Confirm full scenario: add licence → log renewal → dashboard updates

**Definition of Done:** Priya logs a renewal on a licence; the dashboard status badge changes and her entry appears in the activity feed — all persisted to DB, visible to any teammate without login.

---

## Sprint 3 — Alerts & Filters
**Goal:** Team gets warned before licences expire; can slice the view.

- [ ] Filter bar: by authority, outlet, status, assigned_to
- [ ] Expiry urgency bands: amber ≤60d, red ≤7d, visual indicators
- [ ] Assigned_to field on licence form
- [ ] Email alert scaffold: Supabase Edge Function checks expiry daily, sends email at 60/30/7 days
- [ ] Document upload: attach PDF to licence (Supabase Storage)

**Definition of Done:** Filter by status returns correct subset; urgency colours visible on dashboard; test email sends for a licence set to expire in 5 days.

---

## Sprint 4 — Lock It Down (Auth + RLS)
**Goal:** Data is owner-scoped; only authenticated users can write.

- [ ] Supabase Auth: sign-up, login, logout UI
- [ ] Link `user_id` on insert for licences, renewal_logs, activities
- [ ] Replace v1 permissive RLS with owner-scoped policies
- [ ] Role model: Admin vs Member (DB-level + UI gating)
- [ ] Seed demo login account (demo@company.com) for reviewers
- [ ] Redirect unauthenticated users to /login after lock-down

**Definition of Done:** Logged-out user cannot write any data. Two test accounts see shared data (same team) but cannot modify each other's private records.

---

## Sprint 5 — Intelligence Layer
**Goal:** AI assists with risk scoring and renewal drafts; all AI fields reviewable.

- [ ] Rule-based risk_level auto-set on licence save (no AI needed)
- [ ] LLM suggests renewal_period_months from licence category; stored with confidence + review_status
- [ ] Review queue UI: list AI-generated fields pending human approval
- [ ] Draft renewal reminder tool: returns copy, human approves before any send
- [ ] Audit log export to CSV

**Definition of Done:** AI-suggested renewal period shows with confidence score; reviewer can approve or override; approved value persists with review_status = 'approved'.

---

## Gantt (sprint → feature)
```
Sprint 1  |  DB schema · Licence CRUD · Status compute · Seed data
Sprint 2  |  Renewal log · Detail page · Dashboard cards · Activity feed  ← v1 functional
Sprint 3  |  Filters · Urgency bands · Email alerts · Doc upload
Sprint 4  |  Auth · RLS lock-down · Roles
Sprint 5  |  Risk scoring · AI suggestions · Review queue · Audit export
```
