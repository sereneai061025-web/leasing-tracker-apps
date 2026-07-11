"use client"
import { useState, useMemo } from "react"
import Link from "next/link"
import { daysToExpiry } from "@/lib/types"

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700", expiring_soon: "bg-amber-100 text-amber-700",
    expired: "bg-red-100 text-red-700", renewed: "bg-blue-100 text-blue-700",
  }
  const labels: Record<string, string> = { active: "Active", expiring_soon: "Expiring Soon", expired: "Expired", renewed: "Renewed" }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>{labels[status] ?? status}</span>
}

export default function LicencesClient({ licences }: { licences: any[] }) {
  const [search, setSearch] = useState("")
  const [filterAuthority, setFilterAuthority] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterOutlet, setFilterOutlet] = useState("all")
  const [filterOwner, setFilterOwner] = useState("all")

  const authorities = useMemo(() => Array.from(new Set(licences.map((l: any) => l.authorities?.abbreviation).filter(Boolean))).sort(), [licences])
  const outlets = useMemo(() => Array.from(new Set(licences.map((l: any) => l.outlets?.outlet_code).filter(Boolean))).sort(), [licences])
  const owners = useMemo(() => Array.from(new Set(licences.map((l: any) => l.assigned_to).filter(Boolean))).sort(), [licences])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return licences.filter((l: any) => {
      if (search && !l.licence_name?.toLowerCase().includes(q) && !l.licence_number?.toLowerCase().includes(q) && !l.category?.toLowerCase().includes(q)) return false
      if (filterAuthority !== "all" && l.authorities?.abbreviation !== filterAuthority) return false
      if (filterStatus !== "all" && l.status !== filterStatus) return false
      if (filterOutlet !== "all" && l.outlets?.outlet_code !== filterOutlet) return false
      if (filterOwner !== "all" && l.assigned_to !== filterOwner) return false
      return true
    })
  }, [licences, search, filterAuthority, filterStatus, filterOutlet, filterOwner])

  const hasFilters = search || filterAuthority !== "all" || filterStatus !== "all" || filterOutlet !== "all" || filterOwner !== "all"

  const selectCls = "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"

  return (
    <>
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
        <input
          type="search" placeholder="🔍  Search by name, number, or category…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex flex-wrap gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
          <select value={filterAuthority} onChange={e => setFilterAuthority(e.target.value)} className={selectCls}>
            <option value="all">All Authorities</option>
            {authorities.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterOutlet} onChange={e => setFilterOutlet(e.target.value)} className={selectCls}>
            <option value="all">All Outlets</option>
            {outlets.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {owners.length > 0 && (
            <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)} className={selectCls}>
              <option value="all">All Owners</option>
              {owners.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
          {hasFilters && (
            <button onClick={() => { setSearch(""); setFilterAuthority("all"); setFilterStatus("all"); setFilterOutlet("all"); setFilterOwner("all") }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline">
              Clear filters
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">{filtered.length} of {licences.length} licence{licences.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-400 text-lg mb-2">{hasFilters ? "No licences match your filters" : "No licences yet"}</p>
            {!hasFilters && <Link href="/licences/new" className="text-indigo-600 text-sm hover:underline">Add your first licence →</Link>}
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((l: any) => {
                const days = daysToExpiry(l.expiry_date)
                return (
                  <Link key={l.id} href={`/licences/${l.id}`} className="block px-4 py-4 hover:bg-gray-50 active:bg-gray-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{l.licence_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{l.licence_number}</p>
                      </div>
                      <StatusBadge status={l.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{l.authorities?.abbreviation ?? "—"}</span>
                      <span>·</span>
                      <span>{l.outlets?.outlet_code ?? "—"}</span>
                      <span>·</span>
                      <span className={days < 0 ? "text-red-600 font-medium" : days <= 60 ? "text-amber-600 font-medium" : ""}>
                        {days < 0 ? `${Math.abs(days)}d over` : `${days}d left`}
                      </span>
                      {l.renewal_cost && <span className="ml-auto">SGD {Number(l.renewal_cost).toLocaleString("en-SG", { minimumFractionDigits: 2 })}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Licence", "Number", "Authority", "Outlet", "Owner", "Status", "Expiry", "Days", "Cost", ""].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((l: any) => {
                    const days = daysToExpiry(l.expiry_date)
                    return (
                      <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5"><p className="font-medium text-gray-900">{l.licence_name}</p><p className="text-xs text-gray-400">{l.category ?? ""}</p></td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{l.licence_number ?? "—"}</td>
                        <td className="px-5 py-3.5 text-gray-600">{l.authorities?.abbreviation ?? "—"}</td>
                        <td className="px-5 py-3.5 text-gray-600">{l.outlets?.outlet_code ?? "—"}</td>
                        <td className="px-5 py-3.5 text-gray-600">{l.assigned_to ?? "—"}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={l.status} /></td>
                        <td className="px-5 py-3.5 text-gray-600 text-xs">{new Date(l.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                        <td className="px-5 py-3.5"><span className={`text-sm font-medium ${days < 0 ? "text-red-600" : days <= 60 ? "text-amber-600" : "text-gray-500"}`}>{days < 0 ? `${Math.abs(days)}d over` : `${days}d`}</span></td>
                        <td className="px-5 py-3.5 text-gray-600 text-xs">{l.renewal_cost ? `SGD ${Number(l.renewal_cost).toLocaleString("en-SG", { minimumFractionDigits: 2 })}` : "—"}</td>
                        <td className="px-5 py-3.5"><Link href={`/licences/${l.id}`} className="text-indigo-600 text-xs font-medium hover:underline">View →</Link></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  )
}
