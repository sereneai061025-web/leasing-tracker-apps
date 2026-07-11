import { createClient } from "@/lib/supabase/server"
import { getCurrentRole } from "@/lib/role"
import { computeStatus, daysToExpiry } from "@/lib/types"
import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { role } = await getCurrentRole()
  if (!role) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const supabase = await createClient()
  const { data: licence } = await supabase
    .from("licences")
    .select("*, authorities(name,abbreviation,website), outlets(name,outlet_code,address)")
    .eq("id", id).single()

  if (!licence) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: logs } = await supabase.from("renewal_logs").select("*").eq("licence_id", id).order("action_date", { ascending: false })
  const status = computeStatus(licence.expiry_date)
  const days = daysToExpiry(licence.expiry_date)
  const statusColor = status === "active" ? "#059669" : status === "expiring_soon" ? "#d97706" : "#dc2626"
  const statusLabel = { active: "Active", expiring_soon: "Expiring Soon", expired: "Expired", renewed: "Renewed" }[status] ?? status

  const logsHtml = (logs ?? []).length === 0
    ? `<p style="color:#9ca3af;font-size:14px;">No renewal actions logged.</p>`
    : (logs ?? []).map((l: any) => `
      <div style="border-left:3px solid #6366f1;padding:10px 14px;margin-bottom:10px;background:#f8f7ff;border-radius:0 8px 8px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="background:#e0e7ff;color:#4f46e5;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">${l.action_type}</span>
          <span style="color:#9ca3af;font-size:12px;">${new Date(l.action_date).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</span>
        </div>
        <p style="margin:6px 0 0;font-size:13px;color:#374151;">by <strong>${l.actioned_by ?? "—"}</strong>${l.notes ? ` — ${l.notes}` : ""}</p>
        ${l.new_expiry_date ? `<p style="margin:4px 0 0;font-size:12px;color:#059669;">✓ New expiry: ${new Date(l.new_expiry_date).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</p>` : ""}
      </div>`).join("")

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${licence.licence_name}</title>
<style>
  @media print { body { -webkit-print-color-adjust: exact; } .no-print { display:none; } }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 32px; color: #111827; background: #fff; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:2px solid #e5e7eb; }
  .logo { display:flex; align-items:center; gap:10px; }
  .logo-icon { width:36px; height:36px; background:#6366f1; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:13px; }
  h1 { font-size:22px; font-weight:700; margin:0 0 6px; }
  .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:13px; font-weight:600; color:white; background:${statusColor}; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px 32px; margin:24px 0; }
  .field dt { font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:#9ca3af; margin-bottom:3px; }
  .field dd { font-size:14px; color:#111827; font-weight:500; margin:0; }
  .section-title { font-size:14px; font-weight:600; color:#374151; margin:24px 0 12px; padding-bottom:6px; border-bottom:1px solid #e5e7eb; }
  .expiry-highlight { font-weight:700; color:${statusColor}; }
  .print-btn { position:fixed; bottom:24px; right:24px; background:#6366f1; color:white; border:none; padding:12px 24px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 4px 12px rgba(99,102,241,0.4); }
  .generated { font-size:11px; color:#9ca3af; margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; }
</style></head>
<body>
  <div class="header">
    <div>
      <div class="logo" style="margin-bottom:12px;">
        <div class="logo-icon">LC</div>
        <span style="font-size:13px;color:#6b7280;">F&B Licence Tracker</span>
      </div>
      <h1>${licence.licence_name}</h1>
      <span class="badge">${statusLabel}</span>
      ${days < 0 ? `<span style="margin-left:8px;font-size:13px;color:#dc2626;font-weight:600;">${Math.abs(days)} days overdue</span>` : days <= 60 ? `<span style="margin-left:8px;font-size:13px;color:#d97706;font-weight:600;">${days} days left</span>` : `<span style="margin-left:8px;font-size:13px;color:#6b7280;">${days} days left</span>`}
    </div>
    <div style="text-align:right;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">Licence Number</p>
      <p style="font-size:16px;font-weight:700;margin:4px 0;">${licence.licence_number ?? "—"}</p>
    </div>
  </div>

  <div class="grid">
    <div class="field"><dt>Authority</dt><dd>${(licence as any).authorities?.name ?? "—"}</dd></div>
    <div class="field"><dt>Category</dt><dd>${licence.category ?? "—"}</dd></div>
    <div class="field"><dt>Outlet</dt><dd>${(licence as any).outlets?.outlet_code ?? ""} — ${(licence as any).outlets?.name ?? "—"}</dd></div>
    <div class="field"><dt>Assigned To</dt><dd>${licence.assigned_to ?? "—"}</dd></div>
    <div class="field"><dt>Issue Date</dt><dd>${licence.issue_date ? new Date(licence.issue_date).toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"}) : "—"}</dd></div>
    <div class="field"><dt>Expiry Date</dt><dd class="expiry-highlight">${new Date(licence.expiry_date).toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"})}</dd></div>
    <div class="field"><dt>Renewal Period</dt><dd>${licence.renewal_period_months ? `${licence.renewal_period_months} months` : "—"}</dd></div>
    <div class="field"><dt>Renewal Cost</dt><dd>${licence.renewal_cost ? `SGD ${Number(licence.renewal_cost).toLocaleString("en-SG",{minimumFractionDigits:2})}` : "—"}</dd></div>
  </div>
  ${licence.notes ? `<div style="background:#f9fafb;border-radius:8px;padding:12px 16px;margin:12px 0;"><p style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;margin:0 0 4px;">Notes</p><p style="font-size:14px;color:#374151;margin:0;">${licence.notes}</p></div>` : ""}

  <p class="section-title">Renewal History (${(logs ?? []).length} entries)</p>
  ${logsHtml}

  <p class="generated">Generated ${new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})} · F&B Licence Tracker</p>

  <button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save PDF</button>
</body></html>`

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } })
}
