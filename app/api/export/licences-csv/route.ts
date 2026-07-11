import { createClient } from "@/lib/supabase/server"
import { getCurrentRole } from "@/lib/role"
import { computeStatus, daysToExpiry } from "@/lib/types"
import { NextResponse } from "next/server"

export async function GET() {
  const { role } = await getCurrentRole()
  if (!role) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const supabase = await createClient()
  const { data: raw } = await supabase
    .from("licences")
    .select("*, authorities(name,abbreviation), outlets(name,outlet_code)")
    .order("expiry_date", { ascending: true })

  const licences = (raw ?? []).map((l: any) => ({ ...l, status: computeStatus(l.expiry_date) }))

  const headers = ["Licence Name","Licence Number","Category","Authority","Outlet","Assigned To","Issue Date","Expiry Date","Status","Days","Renewal Period (months)","Renewal Cost (SGD)","Notes"]
  const rows = licences.map((l: any) => [
    l.licence_name, l.licence_number ?? "", l.category ?? "",
    l.authorities?.name ?? "", l.outlets?.outlet_code ?? "", l.assigned_to ?? "",
    l.issue_date ?? "", l.expiry_date,
    l.status, daysToExpiry(l.expiry_date),
    l.renewal_period_months ?? "", l.renewal_cost ?? "", l.notes ?? ""
  ])

  const csv = [headers, ...rows].map(row =>
    row.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")
  ).join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="licences-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}
