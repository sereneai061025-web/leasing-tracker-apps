import { createClient } from "@/lib/supabase/server"
import { computeStatus, daysToExpiry } from "@/lib/types"
import Link from "next/link"

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from("licences")
    .select("*, authorities(name,abbreviation), outlets(name,outlet_code)")
    .order("expiry_date", { ascending: true })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in90 = new Date(today)
  in90.setDate(in90.getDate() + 90)

  const licences = (raw ?? []).map((l: any) => ({ ...l, status: computeStatus(l.expiry_date) }))

  // Bucket into time bands
  const overdue = licences.filter((l: any) => daysToExpiry(l.expiry_date) < 0)
  const next7 = licences.filter((l: any) => { const d = daysToExpiry(l.expiry_date); return d >= 0 && d <= 7 })
  const next30 = licences.filter((l: any) => { const d = daysToExpiry(l.expiry_date); return d > 7 && d <= 30 })
  const next90 = licences.filter((l: any) => { const d = daysToExpiry(l.expiry_date); return d > 30 && d <= 90 })
  const beyond = licences.filter((l: any) => daysToExpiry(l.expiry_date) > 90)

  function Band({ title, items, accent, icon }: { title: string; items: any[]; accent: string; icon: string }) {
    if (items.length === 0) return null
    return (
      <div className="mb-6">
        <div className={`flex items-center gap-2 mb-3 px-1`}>
          <span className="text-base">{icon}</span>
          <h2 className={`text-sm font-semibold ${accent}`}>{title}</h2>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${accent.includes("red") ? "bg-red-100 text-red-600" : accent.includes("amber") ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"}`}>
            {items.length}
          </span>
        </div>
        <div className="space-y-2">
          {items.map((l: any) => {
            const days = daysToExpiry(l.expiry_date)
            return (
              <Link
                key={l.id}
                href={`/licences/${l.id}`}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-5 py-4 hover:shadow-sm hover:border-indigo-200 transition-all group"
              >
                {/* Date block */}
                <div className={`w-14 text-center shrink-0 rounded-lg py-1.5 ${days < 0 ? "bg-red-100" : days <= 7 ? "bg-red-50" : days <= 30 ? "bg-amber-50" : "bg-gray-50"}`}>
                  <p className={`text-lg font-bold leading-none ${days < 0 ? "text-red-600" : days <= 7 ? "text-red-500" : days <= 30 ? "text-amber-600" : "text-gray-700"}`}>
                    {new Date(l.expiry_date).getDate()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(l.expiry_date).toLocaleDateString("en-GB", { month: "short" })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(l.expiry_date).getFullYear()}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{l.licence_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {l.licence_number} · {l.authorities?.abbreviation ?? "—"} · {l.outlets?.outlet_code ?? "—"}
                  </p>
                  <p className="text-xs text-gray-400">Assigned: {l.assigned_to ?? "—"}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className={`text-lg font-bold ${days < 0 ? "text-red-600" : days <= 7 ? "text-red-500" : days <= 30 ? "text-amber-600" : "text-gray-500"}`}>
                    {days < 0 ? `${Math.abs(days)}d` : `${days}d`}
                  </p>
                  <p className="text-xs text-gray-400">{days < 0 ? "overdue" : "remaining"}</p>
                  {l.renewal_cost && (
                    <p className="text-xs text-gray-400 mt-0.5">SGD {Number(l.renewal_cost).toLocaleString("en-SG", { minimumFractionDigits: 2 })}</p>
                  )}
                </div>

                <span className="text-gray-300 group-hover:text-indigo-400 ml-1">→</span>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Renewal Calendar</h1>
        <p className="text-gray-500 text-sm mt-1">90-day renewal timeline — click any licence to log an action</p>
      </div>

      {licences.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <p className="text-gray-400">No licences to display.</p>
        </div>
      ) : (
        <div className="max-w-3xl">
          <Band title="Overdue — Immediate Action Required" items={overdue} accent="text-red-600" icon="🚨" />
          <Band title="Expiring This Week (0–7 days)" items={next7} accent="text-red-500" icon="🔴" />
          <Band title="Expiring This Month (8–30 days)" items={next30} accent="text-amber-600" icon="🟡" />
          <Band title="Expiring in 31–90 Days" items={next90} accent="text-yellow-600" icon="🟢" />
          {beyond.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-400 mb-3 px-1">Beyond 90 days — {beyond.length} licence{beyond.length !== 1 ? "s" : ""}</p>
              <div className="space-y-2">
                {beyond.map((l: any) => (
                  <Link key={l.id} href={`/licences/${l.id}`} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-5 py-3 hover:border-indigo-200 transition-all text-sm">
                    <span className="font-medium text-gray-700">{l.licence_name}</span>
                    <span className="text-gray-400 text-xs">{new Date(l.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · {daysToExpiry(l.expiry_date)}d</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
