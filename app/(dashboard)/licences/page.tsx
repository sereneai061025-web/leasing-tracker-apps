import { createClient } from "@/lib/supabase/server"
import { computeStatus } from "@/lib/types"
import Link from "next/link"
import LicencesClient from "./LicencesClient"

export default async function AllLicencesPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from("licences")
    .select("*, authorities(name,abbreviation), outlets(name,outlet_code)")
    .order("expiry_date", { ascending: true })
  const licences = (raw ?? []).map((l: any) => ({ ...l, status: computeStatus(l.expiry_date) }))

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">All Licences</h1>
          <p className="text-gray-500 text-sm mt-1">{licences.length} licence{licences.length !== 1 ? "s" : ""} total</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/licences-csv" className="px-3 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">⬇ CSV</a>
          <Link href="/licences/new" className="px-3 py-2 md:px-4 md:py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">+ Add</Link>
        </div>
      </div>
      <LicencesClient licences={licences} />
    </div>
  )
}
