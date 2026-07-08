import { createClient } from "@/lib/supabase/server"
import { computeStatus, daysToExpiry } from "@/lib/types"
import Link from "next/link"

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    expiring_soon: "bg-amber-100 text-amber-700",
    expired: "bg-red-100 text-red-700",
    renewed: "bg-blue-100 text-blue-700",
  }
  const labels: Record<string, string> = { active: "Active", expiring_soon: "Expiring Soon", expired: "Expired", renewed: "Renewed" }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>{labels[status] ?? status}</span>
}

export default async function AllLicencesPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from("licences")
    .select("*, authorities(name,abbreviation), outlets(name,outlet_code)")
    .order("expiry_date", { ascending: true })

  const licences = (raw ?? []).map((l: any) => ({ ...l, status: computeStatus(l.expiry_date) }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Licences</h1>
          <p className="text-gray-500 text-sm mt-1">{licences.length} licence{licences.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link href="/licences/new" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          + Add Licence
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {licences.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-400 text-lg mb-2">No licences yet</p>
            <Link href="/licences/new" className="text-indigo-600 text-sm hover:underline">Add your first licence →</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Licence", "Number", "Authority", "Outlet", "Assigned To", "Status", "Expiry", "Days", "Cost", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {licences.map((l: any) => {
                const days = daysToExpiry(l.expiry_date)
                return (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{l.licence_name}</p>
                      <p className="text-xs text-gray-400">{l.category ?? ""}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{l.licence_number ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{l.authorities?.abbreviation ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{l.outlets?.outlet_code ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{l.assigned_to ?? "—"}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={l.status} /></td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">{new Date(l.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-medium ${days < 0 ? "text-red-600" : days <= 7 ? "text-red-600" : days <= 60 ? "text-amber-600" : "text-gray-500"}`}>
                        {days < 0 ? `${Math.abs(days)}d over` : `${days}d`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">
                      {l.renewal_cost ? `SGD ${Number(l.renewal_cost).toLocaleString("en-SG", { minimumFractionDigits: 2 })}` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/licences/${l.id}`} className="text-indigo-600 text-xs font-medium hover:underline">View →</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
