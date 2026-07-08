import { createClient } from "@/lib/supabase/server"
import { computeStatus, daysToExpiry, type Activity } from "@/lib/types"
import Link from "next/link"

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    expiring_soon: "bg-amber-100 text-amber-700",
    expired: "bg-red-100 text-red-700",
    renewed: "bg-blue-100 text-blue-700",
  }
  const labels: Record<string, string> = {
    active: "Active", expiring_soon: "Expiring Soon", expired: "Expired", renewed: "Renewed",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[status] ?? status}
    </span>
  )
}

export default async function OverviewPage() {
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from("licences")
    .select("*, authorities(name,abbreviation), outlets(name,outlet_code)")
    .order("expiry_date", { ascending: true })

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(15)

  const licences = (raw ?? []).map((l: any) => ({ ...l, status: computeStatus(l.expiry_date) }))
  const total = licences.length
  const active = licences.filter((l: any) => l.status === "active").length
  const expiringSoon = licences.filter((l: any) => l.status === "expiring_soon").length
  const expired = licences.filter((l: any) => l.status === "expired").length
  const urgent = licences.filter((l: any) => daysToExpiry(l.expiry_date) <= 7 && daysToExpiry(l.expiry_date) >= 0)
  const upcomingRenewals = licences.filter((l: any) => l.status === "expiring_soon").slice(0, 5)

  const totalCost = licences.reduce((sum: number, l: any) => sum + (l.renewal_cost ?? 0), 0)
  const upcomingCost = licences
    .filter((l: any) => l.status === "expiring_soon" || l.status === "expired")
    .reduce((sum: number, l: any) => sum + (l.renewal_cost ?? 0), 0)

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Urgent Alert */}
      {urgent.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-red-500 text-lg mt-0.5">🚨</span>
          <div>
            <p className="text-red-700 font-semibold text-sm">{urgent.length} licence{urgent.length > 1 ? "s" : ""} expiring within 7 days</p>
            <p className="text-red-500 text-xs mt-0.5">{urgent.map((l: any) => l.licence_name).join(", ")}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Licences", value: total, sub: "across all outlets", color: "border-gray-200", icon: "📋" },
          { label: "Active", value: active, sub: "in good standing", color: "border-emerald-200 bg-emerald-50", icon: "✅", textColor: "text-emerald-700" },
          { label: "Expiring Soon", value: expiringSoon, sub: "within 60 days", color: "border-amber-200 bg-amber-50", icon: "⏳", textColor: "text-amber-700" },
          { label: "Expired", value: expired, sub: "require action", color: "border-red-200 bg-red-50", icon: "❌", textColor: "text-red-700" },
        ].map(card => (
          <div key={card.label} className={`bg-white rounded-xl border ${card.color} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${card.textColor ?? "text-gray-900"}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Financial snapshot + Upcoming renewals */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming Renewals</h2>
            <Link href="/renewals" className="text-xs text-indigo-600 hover:underline">View all →</Link>
          </div>
          {upcomingRenewals.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No licences expiring within 60 days.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {upcomingRenewals.map((l: any) => {
                const days = daysToExpiry(l.expiry_date)
                return (
                  <div key={l.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-8 rounded-full ${days <= 7 ? "bg-red-500" : days <= 30 ? "bg-amber-500" : "bg-yellow-400"}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{l.licence_name}</p>
                        <p className="text-xs text-gray-400">{l.authorities?.abbreviation ?? "—"} · {l.outlets?.outlet_code ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${days <= 7 ? "text-red-600" : "text-amber-600"}`}>{days}d left</p>
                        <p className="text-xs text-gray-400">{new Date(l.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                      </div>
                      <Link href={`/licences/${l.id}`} className="text-xs text-indigo-600 font-medium hover:underline">Act →</Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Portfolio Cost</p>
            <p className="text-2xl font-bold text-gray-900">SGD {totalCost.toLocaleString("en-SG", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-gray-400 mt-1">across {total} licences</p>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">Renewal Cost Due</p>
            <p className="text-2xl font-bold text-amber-700">SGD {upcomingCost.toLocaleString("en-SG", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-amber-500 mt-1">expiring / expired licences</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <Link href="/calendar" className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Next Renewal</p>
                {upcomingRenewals[0] ? (
                  <>
                    <p className="text-sm font-semibold text-gray-900">{upcomingRenewals[0].licence_name}</p>
                    <p className="text-xs text-amber-600 mt-0.5">{daysToExpiry(upcomingRenewals[0].expiry_date)} days</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">None upcoming</p>
                )}
              </div>
              <span className="text-2xl">📅</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
        </div>
        {(activities ?? []).length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-400">No activity yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {(activities as Activity[]).map(a => (
              <div key={a.id} className="px-6 py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold mt-0.5 shrink-0">
                    {(a.actor ?? "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{a.actor ?? "System"}</span> {a.action}
                    </p>
                    {a.object_label && <p className="text-xs text-gray-400 mt-0.5">{a.object_label}</p>}
                  </div>
                </div>
                <p className="text-xs text-gray-300 shrink-0 mt-1">
                  {new Date(a.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
