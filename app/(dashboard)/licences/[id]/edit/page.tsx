import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { computeStatus } from "@/lib/types"

export default async function EditLicencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: licence } = await supabase.from("licences").select("*").eq("id", id).single()
  if (!licence) notFound()
  const { data: authorities } = await supabase.from("authorities").select("id, name, abbreviation").order("name")
  const { data: outlets } = await supabase.from("outlets").select("id, name, outlet_code").order("name")

  async function updateLicence(formData: FormData) {
    "use server"
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")
    const expiryDate = formData.get("expiry_date") as string
    await supabase.from("licences").update({
      licence_name: formData.get("licence_name"),
      licence_number: formData.get("licence_number") || null,
      category: formData.get("category") || null,
      authority_id: formData.get("authority_id") || null,
      outlet_id: formData.get("outlet_id") || null,
      assigned_to: formData.get("assigned_to") || null,
      issue_date: formData.get("issue_date") || null,
      expiry_date: expiryDate,
      renewal_period_months: formData.get("renewal_period_months") ? Number(formData.get("renewal_period_months")) : null,
      renewal_cost: formData.get("renewal_cost") ? Number(formData.get("renewal_cost")) : null,
      notes: formData.get("notes") || null,
      status: computeStatus(expiryDate),
    }).eq("id", id)
    await supabase.from("activities").insert({
      actor: user.email || "Team", action: "updated licence details",
      object_type: "licence", object_id: id, object_label: formData.get("licence_name") as string,
    })
    redirect(`/licences/${id}`)
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8 text-sm">
        <Link href="/licences" className="text-gray-400 hover:text-gray-600">All Licences</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/licences/${id}`} className="text-gray-400 hover:text-gray-600">{licence.licence_name}</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium">Edit</span>
      </div>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Licence</h1>
        <form action={updateLicence} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Licence Name <span className="text-red-500">*</span></label>
              <input name="licence_name" required defaultValue={licence.licence_name} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Licence Number</label>
              <input name="licence_number" defaultValue={licence.licence_number ?? ""} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Category</label>
              <input name="category" defaultValue={licence.category ?? ""} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Authority</label>
              <select name="authority_id" defaultValue={licence.authority_id ?? ""} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— Select —</option>
                {(authorities ?? []).map((a: any) => <option key={a.id} value={a.id}>{a.abbreviation ? `${a.abbreviation} — ` : ""}{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Outlet</label>
              <select name="outlet_id" defaultValue={licence.outlet_id ?? ""} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— Select —</option>
                {(outlets ?? []).map((o: any) => <option key={o.id} value={o.id}>{o.outlet_code ? `${o.outlet_code} — ` : ""}{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Issue Date</label>
              <input type="date" name="issue_date" defaultValue={licence.issue_date ?? ""} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Expiry Date <span className="text-red-500">*</span></label>
              <input type="date" name="expiry_date" required defaultValue={licence.expiry_date} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Assigned To</label>
              <input name="assigned_to" defaultValue={licence.assigned_to ?? ""} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Renewal Period (months)</label>
              <input type="number" name="renewal_period_months" min="1" defaultValue={licence.renewal_period_months ?? ""} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Renewal Cost (SGD)</label>
              <input type="number" name="renewal_cost" min="0" step="0.01" defaultValue={licence.renewal_cost ?? ""} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Notes</label>
              <textarea name="notes" rows={3} defaultValue={licence.notes ?? ""} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">Save Changes</button>
            <Link href={`/licences/${id}`} className="px-5 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
