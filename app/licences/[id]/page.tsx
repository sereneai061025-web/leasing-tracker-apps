import { createClient } from "@/lib/supabase/server"
import { computeStatus, daysToExpiry, type RenewalLog } from "@/lib/types"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import DeleteLicenceButton from "./DeleteLicenceButton"

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    expiring_soon: "bg-amber-100 text-amber-800",
    expired: "bg-red-100 text-red-800",
    renewed: "bg-blue-100 text-blue-800",
  }
  const label: Record<string, string> = {
    active: "Active", expiring_soon: "Expiring Soon", expired: "Expired", renewed: "Renewed",
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${map[status] ?? "bg-gray-100 text-gray-800"}`}>
      {label[status] ?? status}
    </span>
  )
}

export default async function LicenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: licence } = await supabase
    .from("licences")
    .select("*, authorities(name, abbreviation, website), outlets(name, outlet_code, address)")
    .eq("id", id)
    .single()

  if (!licence) notFound()

  const { data: renewalLogs } = await supabase
    .from("renewal_logs")
    .select("*")
    .eq("licence_id", id)
    .order("action_date", { ascending: false })

  const status = computeStatus(licence.expiry_date)
  const days = daysToExpiry(licence.expiry_date)

  async function logRenewal(formData: FormData) {
    "use server"
    const supabase = await createClient()
    const newExpiry = formData.get("new_expiry_date") as string | null
    const actionType = formData.get("action_type") as string
    const actionedBy = formData.get("actioned_by") as string

    await supabase.from("renewal_logs").insert({
      licence_id: id,
      action_type: actionType,
      actioned_by: actionedBy || null,
      action_date: formData.get("action_date") || new Date().toISOString().split("T")[0],
      notes: formData.get("notes") || null,
      new_expiry_date: newExpiry || null,
      new_licence_number: formData.get("new_licence_number") || null,
    })

    // Update licence expiry and status if new expiry provided
    if (newExpiry) {
      const newStatus = computeStatus(newExpiry)
      await supabase.from("licences").update({
        expiry_date: newExpiry,
        status: newStatus,
      }).eq("id", id)
    }

    // Write activity
    await supabase.from("activities").insert({
      actor: actionedBy || "Team",
      action: `logged ${actionType.toLowerCase()} on licence`,
      object_type: "licence",
      object_id: id,
      object_label: licence.licence_name,
    })

    redirect(`/licences/${id}`)
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-semibold text-gray-900">{licence.licence_name}</h1>
            <StatusBadge status={status} />
          </div>
          <div className="flex gap-2">
            <Link href={`/licences/${id}/edit`} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Edit</Link>
            <DeleteLicenceButton licenceId={id} licenceName={licence.licence_name} />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-3 gap-6">
        {/* Left: Details + Renewal History */}
        <div className="col-span-2 space-y-6">
          {/* Licence Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Licence Details</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><dt className="text-gray-400">Number</dt><dd className="text-gray-900 font-medium">{licence.licence_number ?? "—"}</dd></div>
              <div><dt className="text-gray-400">Category</dt><dd className="text-gray-900">{licence.category ?? "—"}</dd></div>
              <div><dt className="text-gray-400">Authority</dt><dd className="text-gray-900">{(licence as any).authorities?.name ?? "—"}</dd></div>
              <div><dt className="text-gray-400">Outlet</dt><dd className="text-gray-900">{(licence as any).outlets?.outlet_code} — {(licence as any).outlets?.name ?? "—"}</dd></div>
              <div><dt className="text-gray-400">Issue Date</dt><dd className="text-gray-900">{licence.issue_date ? new Date(licence.issue_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</dd></div>
              <div>
                <dt className="text-gray-400">Expiry Date</dt>
                <dd className={`font-semibold ${days < 0 ? "text-red-600" : days <= 60 ? "text-amber-600" : "text-gray-900"}`}>
                  {new Date(licence.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  {" "}
                  <span className="font-normal text-xs">
                    ({days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`})
                  </span>
                </dd>
              </div>
              <div><dt className="text-gray-400">Assigned To</dt><dd className="text-gray-900">{licence.assigned_to ?? "—"}</dd></div>
              <div><dt className="text-gray-400">Renewal Period</dt><dd className="text-gray-900">{licence.renewal_period_months ? `${licence.renewal_period_months} months` : "—"}</dd></div>
              {licence.notes && (
                <div className="col-span-2"><dt className="text-gray-400">Notes</dt><dd className="text-gray-900 mt-0.5">{licence.notes}</dd></div>
              )}
            </dl>
          </div>

          {/* Renewal History */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Renewal History</h2>
            </div>
            {(renewalLogs ?? []).length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">No renewal actions logged yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {(renewalLogs as RenewalLog[]).map(log => (
                  <div key={log.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 mr-2">{log.action_type}</span>
                        <span className="text-sm text-gray-600">by <span className="font-medium">{log.actioned_by ?? "—"}</span></span>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(log.action_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                    {log.notes && <p className="mt-1.5 text-sm text-gray-600">{log.notes}</p>}
                    {log.new_expiry_date && (
                      <p className="mt-1 text-xs text-gray-400">New expiry: {new Date(log.new_expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Log Renewal Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Log Renewal Action</h2>
            <form action={logRenewal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Type <span className="text-red-500">*</span></label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Actioned By</label>
                <input name="actioned_by" defaultValue={licence.assigned_to ?? ""} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" name="action_date" defaultValue={today} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Reference numbers, follow-up actions…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Expiry Date <span className="text-xs text-gray-400">(if renewed)</span></label>
                <input type="date" name="new_expiry_date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Licence Number <span className="text-xs text-gray-400">(if changed)</span></label>
                <input name="new_licence_number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Optional" />
              </div>
              <button type="submit" className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                Log Action
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
