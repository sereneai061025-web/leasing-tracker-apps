import { createClient } from "@/lib/supabase/server"
import { computeStatus, daysToExpiry } from "@/lib/types"
import Link from "next/link"

export default async function RenewalsPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from("licences")
    .select("*, authorities(name,abbreviation), outlets(name,outlet_code)")
    .order("expiry_date", { ascending: true })

  const licences = (raw ?? [])
    .map((l: any) => ({ ...l, status: computeStatus(l.expiry_date) }))
    .filter((l: any) => l.status === "expiring_soon")

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Renewals</h1>
        <p className="text-gray-500 text-sm mt-1">{licences.length} licence{licences.length !== 1 ? "s" : ""} expiring within 60 days</p>
      </div>

      {licences.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-gray-500 font-medium">No licences expiring in the next 60 days</p>
        </div>
      ) : (
        <div className="space-y-3">
          {licences.map((l: any) => {
            const days = daysToExpiry(l.expiry_date)
            const urgency = days <= 7 ? "border-red-300 bg-red-50" : days <= 30 ? "border-amber-300 bg-amber-50" : "border-yellow-200 bg-yellow-50"
            const bar = days <= 7 ? "bg-red-500" : days <= 30 ? "bg-amber-500" : "bg-yellow-400"
            const text = days <= 7 ? "text-red-700" : days <= 30 ? "text-amber-700" : "text-yellow-700"
            return (
              <div key={l.id} className={`rounded-xl border ${urgency} p-5 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${bar}`} />
                  <div>
                    <p className="font-semibold text-gray-900">{l.licence_name}</p>
                    <p className="text-sm text-gray-500">{l.licence_number} · {l.authorities?.abbreviation ?? "—"} · {l.outlets?.outlet_code ?? "—"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Assigned to {l.assigned_to ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className={`text-xl md:text-2xl font-bold ${text}`}>{days}d</p>
                    <p className="text-xs text-gray-400">{new Date(l.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    {l.renewal_cost && <p className="text-xs text-gray-500 mt-0.5">SGD {Number(l.renewal_cost).toLocaleString("en-SG", { minimumFractionDigits: 2 })}</p>}
                  </div>
                  <Link href={`/licences/${l.id}`} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    Act Now →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
