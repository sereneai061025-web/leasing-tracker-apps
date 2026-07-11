import { createClient } from "@/lib/supabase/server"
import { computeStatus, daysToExpiry } from "@/lib/types"
import Link from "next/link"

export default async function ExpiredPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from("licences")
    .select("*, authorities(name,abbreviation), outlets(name,outlet_code)")
    .order("expiry_date", { ascending: false })

  const licences = (raw ?? [])
    .map((l: any) => ({ ...l, status: computeStatus(l.expiry_date) }))
    .filter((l: any) => l.status === "expired")

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Expired Licences</h1>
        <p className="text-gray-500 text-sm mt-1">{licences.length} licence{licences.length !== 1 ? "s" : ""} require immediate action</p>
      </div>

      {licences.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-500 font-medium">No expired licences</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-red-50 border-b border-red-100">
                {["Licence", "Authority", "Outlet", "Expired On", "Days Overdue", "Assigned To", "Cost", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-red-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {licences.map((l: any) => {
                const days = Math.abs(daysToExpiry(l.expiry_date))
                return (
                  <tr key={l.id} className="hover:bg-red-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{l.licence_name}</p>
                      <p className="text-xs text-gray-400">{l.licence_number}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{l.authorities?.abbreviation ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600">{l.outlets?.outlet_code ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">{new Date(l.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-5 py-3.5"><span className="text-red-600 font-bold">{days}d</span></td>
                    <td className="px-5 py-3.5 text-gray-600">{l.assigned_to ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">{l.renewal_cost ? `SGD ${Number(l.renewal_cost).toLocaleString("en-SG", { minimumFractionDigits: 2 })}` : "—"}</td>
                    <td className="px-5 py-3.5">
                      <Link href={`/licences/${l.id}`} className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors">
                        Renew →
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
  )
}
