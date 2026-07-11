import { createClient } from "@/lib/supabase/server"
import { computeStatus } from "@/lib/types"

export default async function FinancialPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from("licences")
    .select("*, authorities(name,abbreviation), outlets(name,outlet_code)")

  const licences = (raw ?? []).map((l: any) => ({ ...l, status: computeStatus(l.expiry_date) }))

  const totalCost = licences.reduce((s: number, l: any) => s + (l.renewal_cost ?? 0), 0)
  const activeCost = licences.filter((l: any) => l.status === "active").reduce((s: number, l: any) => s + (l.renewal_cost ?? 0), 0)
  const urgentCost = licences.filter((l: any) => l.status !== "active").reduce((s: number, l: any) => s + (l.renewal_cost ?? 0), 0)

  // Group by authority
  const byAuthority: Record<string, { name: string; cost: number; count: number }> = {}
  licences.forEach((l: any) => {
    const key = l.authorities?.abbreviation ?? "Unknown"
    if (!byAuthority[key]) byAuthority[key] = { name: l.authorities?.name ?? "Unknown", cost: 0, count: 0 }
    byAuthority[key].cost += l.renewal_cost ?? 0
    byAuthority[key].count += 1
  })

  // Group by category
  const byCategory: Record<string, { cost: number; count: number }> = {}
  licences.forEach((l: any) => {
    const key = l.category ?? "Uncategorised"
    if (!byCategory[key]) byCategory[key] = { cost: 0, count: 0 }
    byCategory[key].cost += l.renewal_cost ?? 0
    byCategory[key].count += 1
  })

  const authEntries = Object.entries(byAuthority).sort((a, b) => b[1].cost - a[1].cost)
  const catEntries = Object.entries(byCategory).sort((a, b) => b[1].cost - a[1].cost)
  const maxAuthCost = Math.max(...authEntries.map(([, v]) => v.cost), 1)
  const maxCatCost = Math.max(...catEntries.map(([, v]) => v.cost), 1)

  const fmt = (n: number) => `SGD ${n.toLocaleString("en-SG", { minimumFractionDigits: 2 })}`

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Financial Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Renewal cost analysis across all licences</p>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Total Portfolio Cost</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{fmt(totalCost)}</p>
          <p className="text-xs text-gray-400 mt-1">{licences.length} licences</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-2">Active Licences</p>
          <p className="text-2xl md:text-3xl font-bold text-emerald-700">{fmt(activeCost)}</p>
          <p className="text-xs text-emerald-500 mt-1">currently valid</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">Renewal Action Required</p>
          <p className="text-2xl md:text-3xl font-bold text-amber-700">{fmt(urgentCost)}</p>
          <p className="text-xs text-amber-500 mt-1">expiring or expired</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Authority */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Cost by Authority</h2>
          <div className="space-y-4">
            {authEntries.map(([abbr, { name, cost, count }]) => (
              <div key={abbr}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{abbr}</span>
                    <span className="text-xs text-gray-400 ml-2">{name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{fmt(cost)}</span>
                    <span className="text-xs text-gray-400 ml-2">({count})</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${(cost / maxAuthCost) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Category */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Cost by Category</h2>
          <div className="space-y-4">
            {catEntries.map(([cat, { cost, count }]) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-900">{cat}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{fmt(cost)}</span>
                    <span className="text-xs text-gray-400 ml-2">({count})</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(cost / maxCatCost) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-licence breakdown */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Licence Cost Breakdown</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Licence", "Authority", "Category", "Outlet", "Status", "Renewal Cost"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {licences.sort((a: any, b: any) => (b.renewal_cost ?? 0) - (a.renewal_cost ?? 0)).map((l: any) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{l.licence_name}</td>
                  <td className="px-5 py-3 text-gray-500">{l.authorities?.abbreviation ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-500">{l.category ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-500">{l.outlets?.outlet_code ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      l.status === "active" ? "bg-emerald-100 text-emerald-700" :
                      l.status === "expiring_soon" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    }`}>{l.status === "expiring_soon" ? "Expiring Soon" : l.status.charAt(0).toUpperCase() + l.status.slice(1)}</span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-900">
                    {l.renewal_cost ? fmt(Number(l.renewal_cost)) : <span className="text-gray-300 font-normal">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-gray-700">Total</td>
                <td className="px-5 py-3 text-sm font-bold text-gray-900">{fmt(totalCost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
