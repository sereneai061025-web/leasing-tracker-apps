"use client"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function DeleteLicenceButton({ licenceId, licenceName }: { licenceId: string; licenceName: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete "${licenceName}"? This cannot be undone.`)) return
    const supabase = createClient()
    await supabase.from("audit_logs").insert({
      actor: "Team",
      action: "deleted",
      table_name: "licences",
      record_id: licenceId,
    })
    await supabase.from("licences").delete().eq("id", licenceId)
    router.push("/")
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
    >
      Delete
    </button>
  )
}
