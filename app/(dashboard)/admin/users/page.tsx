import { createClient } from "@/lib/supabase/server"
import { getCurrentRole, roleLabel, roleBadgeColor } from "@/lib/role"
import { redirect } from "next/navigation"

export default async function UsersPage() {
  const { role } = await getCurrentRole()
  if (role !== "admin") redirect("/")

  const supabase = await createClient()
  const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: true })

  async function createUser(formData: FormData) {
    "use server"
    const { role } = await getCurrentRole()
    if (role !== "admin") return
    const supabase = await createClient()
    await supabase.rpc("create_app_user", {
      p_email: formData.get("email") as string,
      p_password: formData.get("password") as string,
      p_full_name: formData.get("full_name") as string,
      p_role: formData.get("role") as string,
    })
    redirect("/admin/users")
  }

  async function updateRole(formData: FormData) {
    "use server"
    const { role } = await getCurrentRole()
    if (role !== "admin") return
    const supabase = await createClient()
    await supabase.from("profiles").update({ role: formData.get("role") }).eq("id", formData.get("id"))
    redirect("/admin/users")
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 text-sm mt-1">Admin only — create and manage user accounts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">All Users <span className="text-gray-400 font-normal text-sm">({(profiles ?? []).length})</span></h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(profiles ?? []).map((p: any) => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                    {(p.full_name ?? p.email)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{p.full_name ?? "—"}</p>
                    <p className="text-xs text-gray-400 truncate">{p.email}</p>
                  </div>
                </div>
                <form action={updateRole} className="flex items-center gap-2 shrink-0">
                  <input type="hidden" name="id" value={p.id} />
                  <select name="role" defaultValue={p.role}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="admin">Admin</option>
                    <option value="sub_admin">Sub-Admin</option>
                    <option value="user">User</option>
                  </select>
                  <button type="submit" className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                    Save
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        {/* Create user */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create New User</h2>
          <form action={createUser} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Full Name</label>
              <input name="full_name" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Priya Nair" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Email <span className="text-red-500">*</span></label>
              <input name="email" type="email" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="user@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Password <span className="text-red-500">*</span></label>
              <input name="password" type="password" required minLength={8} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Role <span className="text-red-500">*</span></label>
              <select name="role" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="user">User — view + log renewals</option>
                <option value="sub_admin">Sub-Admin — add/edit + log renewals</option>
                <option value="admin">Admin — full access</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              Create User
            </button>
          </form>
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Role Permissions</p>
            {[
              { role: "Admin", color: "bg-purple-100 text-purple-700", perms: "Full access · manage users · delete" },
              { role: "Sub-Admin", color: "bg-blue-100 text-blue-700", perms: "Add/edit licences · log renewals" },
              { role: "User", color: "bg-gray-100 text-gray-600", perms: "View + log renewals only" },
            ].map(r => (
              <div key={r.role} className="flex items-start gap-2">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium shrink-0 mt-0.5 ${r.color}`}>{r.role}</span>
                <p className="text-xs text-gray-500">{r.perms}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
