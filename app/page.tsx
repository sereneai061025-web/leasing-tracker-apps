import { createClient } from "@/lib/supabase/server"
import { computeStatus, daysToExpiry, type Licence, type Activity } from "@/lib/types"
import Link from "next/link"

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    expiring_soon: "bg-amber-100 text-amber-800",
    expired: "bg-red-100 text-red-800",
    renewed: "bg-blue-100 text-blue-800",
  }
  const label: Record<string, string> = {
    active: "Active",
    expiring_soon: "Expiring Soon",
    expired: "Expired",
    renewed: "Renewed",
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-800"}`}>
      {label[status] ?? status}
    </span>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: licencesRaw } = await supabase
    .from("licences")
    .select("*, authorities(name, abbreviation), outlets(name, outlet_code)")
    .order("expiry_date", { ascending: true })

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  const licences: Licence[] = (licencesRaw ?? []).map((l: any) => ({
    ...l,
    status: computeStatus(l.expiry_date),
  }))

  const total = licences.length
  const active = licences.filter(l => l.status === "active").length
  const expiringSoon = licences.filter(l => l.status === "expiring_soon").length
  const expired = licences.filter(l => l.status === "expired").length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">F&B Licence Tracker</h1>
            <p className="text-sm text-gray-500">Shared compliance dashboard</p>
          </div>
          <Link
            href="/licences/new"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Add Licence
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: total, color: "bg-white" },
            { label: "Active", value: active, color: "bg-green-50", textColor: "text-green-700" },
            { label: "Expiring Soon", value: expiringSoon, color: "bg-amber-50", textColor: "text-amber-700" },
            { label: "Expired", value: expired, color: "bg-red-50", textColor: "text-red-700" },
          ].map(card => (
            <div key={card.label} className={`${card.color} rounded-xl border border-gray-200 p-4`}>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className={`text-3xl font-bold mt-1 ${card.textColor ?? "text-gray-900"}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-8">
          {/* Licence Table */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">All Licences</h2>
              </div>
              {licences.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <p className="text-lg">No licences yet.</p>
                  <Link href="/licences/new" className="mt-2 inline-block text-indigo-600 hover:underline text-sm">Add your first licence →</Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Licence</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Authority</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Outlet</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {licences.map(licence => {
                        const days = daysToExpiry(licence.expiry_date)
                        return (
                          <tr key={licence.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{licence.licence_name}</div>
                              <div className="text-xs text-gray-400">{licence.licence_number}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {(licence as any).authorities?.abbreviation ?? "—"}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {(licence as any).outlets?.outlet_code ?? "—"}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={licence.status} />
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {new Date(licence.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                            <td className="px-6 py-4">
                              <span className={
                                days < 0 ? "text-red-600 font-medium" :
                                days <= 7 ? "text-red-600 font-bold" :
                                days <= 60 ? "text-amber-600 font-medium" : "text-gray-600"
                              }>
                                {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{licence.assigned_to ?? "—"}</td>
                            <td className="px-6 py-4">
                              <Link href={`/licences/${licence.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">
                                View →
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="w-72 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Activity Feed</h2>
              </div>
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {(activities ?? []).length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-400">No activity yet.</p>
                ) : (
                  (activities as Activity[]).map(a => (
                    <div key={a.id} className="px-4 py-3">
                      <p className="text-xs text-gray-800">
                        <span className="font-medium">{a.actor ?? "System"}</span>{" "}
                        {a.action}
                      </p>
                      {a.object_label && (
                        <p className="text-xs text-gray-400 mt-0.5">{a.object_label}</p>
                      )}
                      <p className="text-xs text-gray-300 mt-1">
                        {new Date(a.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
