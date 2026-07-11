import { createClient } from "@/lib/supabase/server"
import { getCurrentRole, canManageUsers } from "@/lib/role"
import { NextResponse } from "next/server"

export async function GET() {
  const { role } = await getCurrentRole()
  if (!canManageUsers(role)) return NextResponse.json({ error: "Admin only" }, { status: 403 })

  const supabase = await createClient()
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })

  const rows = logs ?? []
  const header = ["id", "actor", "action", "table_name", "record_id", "ip_address", "created_at"]
  const csv = [
    header.join(","),
    ...rows.map((r: any) =>
      header.map(k => {
        const v = r[k] ?? ""
        const s = typeof v === "object" ? JSON.stringify(v) : String(v)
        return `"${s.replace(/"/g, '""')}"`
      }).join(",")
    ),
  ].join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}
