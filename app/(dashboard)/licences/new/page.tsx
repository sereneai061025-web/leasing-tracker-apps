import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function NewLicencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: authorities } = await supabase.from("authorities").select("id, name, abbreviation").order("name")
  const { data: outlets } = await supabase.from("outlets").select("id, name, outlet_code").order("name")

  async function createLicence(formData: FormData) {
    "use server"
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")
    const expiryDate = formData.get("expiry_date") as string
    const { data, error } = await supabase.from("licences").insert({
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
      status: "active",
    }).select().single()
    if (!error && data) {
      await supabase.from("activities").insert({
        actor: user.email || "Team", action: "added new licence",
        object_type: "licence", object_id: data.id, object_label: data.licence_name,
      })
    }
    redirect("/licences")
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8 text-sm">
        <Link href="/licences" className="text-gray-400 hover:text-gray-600">All Licences</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium">Add Licence</span>
      </div>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Licence</h1>
        <form action={createLicence} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Licence Name <span className="text-red-500">*</span></label>
              <input name="licence_name" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Food Shop Licence" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Licence Number</label>
              <input name="licence_number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Category</label>
              <input name="category" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Food Hygiene" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Authority</label>
              <select name="authority_id" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— Select —</option>
                {(authorities ?? []).map((a: any) => <option key={a.id} value={a.id}>{a.abbreviation ? `${a.abbreviation} — ` : ""}{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Outlet</label>
              <select name="outlet_id" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— Select —</option>
                {(outlets ?? []).map((o: any) => <option key={o.id} value={o.id}>{o.outlet_code ? `${o.outlet_code} — ` : ""}{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Issue Date</label>
              <input type="date" name="issue_date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Expiry Date <span className="text-red-500">*</span></label>
              <input type="date" name="expiry_date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Assigned To</label>
              <input name="assigned_to" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Priya Nair" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Renewal Period (months)</label>
              <input type="number" name="renewal_period_months" min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 12" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Renewal Cost (SGD)</label>
              <input type="number" name="renewal_cost" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 450.00" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Notes</label>
              <textarea name="notes" rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Any additional notes…" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">Save Licence</button>
            <Link href="/licences" className="px-5 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
