import { createClient } from "@/lib/supabase/server"
import { computeStatus, daysToExpiry, type RenewalLog } from "@/lib/types"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import DeleteLicenceButton from "./DeleteLicenceButton"

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700", expiring_soon: "bg-amber-100 text-amber-700",
    expired: "bg-red-100 text-red-700", renewed: "bg-blue-100 text-blue-700",
  }
  const label: Record<string, string> = { active: "Active", expiring_soon: "Expiring Soon", expired: "Expired", renewed: "Renewed" }
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${map[status] ?? "bg-gray-100 text-gray-800"}`}>{label[status] ?? status}</span>
}

export default async function LicenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: licence }, { data: { user } }] = await Promise.all([
    supabase.from("licences").select("*, authorities(name,abbreviation,website), outlets(name,outlet_code,address)").eq("id", id).single(),
    supabase.auth.getUser(),
  ])
  if (!licence) notFound()
  const { data: renewalLogs } = await supabase.from("renewal_logs").select("*").eq("licence_id", id).order("action_date", { ascending: false })
  const status = computeStatus(licence.expiry_date)
  const days = daysToExpiry(licence.expiry_date)
  const isLoggedIn = !!user

  async function logRenewal(formData: FormData) {
    "use server"
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")
    const newExpiry = formData.get("new_expiry_date") as string | null
    const actionType = formData.get("action_type") as string
    const actionedBy = formData.get("actioned_by") as string
    await supabase.from("renewal_logs").insert({
      licence_id: id, action_type: actionType, actioned_by: actionedBy || null,
      action_date: (formData.get("action_date") as string) || new Date().toISOString().split("T")[0],
      notes: formData.get("notes") || null, new_expiry_date: newExpiry || null,
      new_licence_number: formData.get("new_licence_number") || null,
    })
    if (newExpiry) {
      await supabase.from("licences").update({ expiry_date: newExpiry, status: computeStatus(newExpiry) }).eq("id", id)
    }
    await supabase.from("activities").insert({
      actor: actionedBy || user.email || "Team", action: `logged ${actionType.toLowerCase()} on licence`,
      object_type: "licence", object_id: id, object_label: licence.licence_name,
    })
    redirect(`/licences/${id}`)
  }

  const today = new Date().toISOString().split("T")[0]
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/licences" className="text-gray-400 hover:text-gray-600">All Licences</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 font-medium">{licence.licence_name}</span>
          <StatusBadge status={status} />
        </div>
        {isLoggedIn && (
          <div className="flex gap-2">
            <Link href={`/licences/${id}/edit`} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Edit</Link>
            <DeleteLicenceButton licenceId={id} licenceName={licence.licence_name} />
          </div>
        )}
      </div>

      {(status === "expiring_soon" || status === "expired") && (
        <div className={`rounded-xl border px-5 py-3 mb-6 flex items-center gap-3 ${status === "expired" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
          <span className="text-xl">{status === "expired" ? "🚨" : "⏳"}</span>
          <p className={`text-sm font-medium ${status === "expired" ? "text-red-700" : "text-amber-700"}`}>
            {status === "expired" ? `Expired ${Math.abs(days)} days ago — renew immediately.` : `Expires in ${days} days — log a renewal action.`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Licence Details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div><dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Number</dt><dd className="font-medium text-gray-900">{licence.licence_number ?? "—"}</dd></div>
              <div><dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Category</dt><dd className="text-gray-900">{licence.category ?? "—"}</dd></div>
              <div><dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Authority</dt><dd className="text-gray-900">{(licence as any).authorities?.name ?? "—"}</dd></div>
              <div><dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Outlet</dt><dd className="text-gray-900">{(licence as any).outlets?.outlet_code} — {(licence as any).outlets?.name ?? "—"}</dd></div>
              <div><dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Issue Date</dt><dd className="text-gray-900">{licence.issue_date ? new Date(licence.issue_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</dd></div>
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Expiry Date</dt>
                <dd className={`font-semibold ${days < 0 ? "text-red-600" : days <= 60 ? "text-amber-600" : "text-gray-900"}`}>
                  {new Date(licence.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  <span className="font-normal text-xs text-gray-400 ml-2">({days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`})</span>
                </dd>
              </div>
              <div><dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Assigned To</dt><dd className="text-gray-900">{licence.assigned_to ?? "—"}</dd></div>
              <div><dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Renewal Period</dt><dd className="text-gray-900">{licence.renewal_period_months ? `${licence.renewal_period_months} months` : "—"}</dd></div>
              <div><dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Renewal Cost</dt><dd className="font-semibold text-gray-900">{licence.renewal_cost ? `SGD ${Number(licence.renewal_cost).toLocaleString("en-SG", { minimumFractionDigits: 2 })}` : "—"}</dd></div>
              {licence.notes && <div className="col-span-2"><dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Notes</dt><dd className="text-gray-700">{licence.notes}</dd></div>}
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Renewal History</h2></div>
            {(renewalLogs ?? []).length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-gray-400">No renewal actions logged yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {(renewalLogs as RenewalLog[]).map(log => (
                  <div key={log.id} className="px-6 py-4 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0 mt-0.5">
                      {(log.actioned_by ?? "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">{log.action_type}</span>
                        <span className="text-sm text-gray-600">by <span className="font-medium">{log.actioned_by ?? "—"}</span></span>
                        <span className="text-xs text-gray-300 ml-auto">{new Date(log.action_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      </div>
                      {log.notes && <p className="text-sm text-gray-600">{log.notes}</p>}
                      {log.new_expiry_date && <p className="text-xs text-emerald-600 mt-1">✓ New expiry: {new Date(log.new_expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {isLoggedIn ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-6">
              <h2 className="font-semibold text-gray-900 mb-4">Log Renewal Action</h2>
              <form action={logRenewal} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Action Type <span className="text-red-500">*</span></label>
                  <select name="action_type" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">— Select —</option>
                    <option>Renewal Submitted</option>
                    <option>Chased Authority</option>
                    <option>Approved</option>
                    <option>Renewed</option>
                    <option>Escalated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Actioned By</label>
                  <input name="actioned_by" defaultValue={licence.assigned_to ?? ""} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Date</label>
                  <input type="date" name="action_date" defaultValue={today} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Notes</label>
                  <textarea name="notes" rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Reference numbers, follow-up…" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">New Expiry Date <span className="text-gray-400">(if renewed)</span></label>
                  <input type="date" name="new_expiry_date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">New Licence Number</label>
                  <input name="new_licence_number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Optional" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">Log Action</button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center sticky top-6">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-semibold text-gray-900 mb-2">Sign in to take action</h3>
              <p className="text-sm text-gray-500 mb-5">Login required to log renewals, edit or delete licences.</p>
              <Link href="/login" className="block w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">Sign In</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
