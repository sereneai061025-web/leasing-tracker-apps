import { createClient } from "@/lib/supabase/server"

export type Role = "admin" | "sub_admin" | "user" | null

export async function getCurrentRole(): Promise<{ role: Role; email: string | null; userId: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { role: null, email: null, userId: null }

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()

  return {
    role: (profile?.role as Role) ?? "user",
    email: user.email ?? null,
    userId: user.id,
  }
}

export function canAdd(role: Role) { return role === "admin" || role === "sub_admin" }
export function canEdit(role: Role) { return role === "admin" || role === "sub_admin" }
export function canDelete(role: Role) { return role === "admin" }
export function canManageUsers(role: Role) { return role === "admin" }
export function canLogRenewal(role: Role) { return role !== null }

export function roleLabel(role: string) {
  return { admin: "Admin", sub_admin: "Sub-Admin", user: "User" }[role] ?? role
}
export function roleBadgeColor(role: string) {
  return { admin: "bg-purple-100 text-purple-700", sub_admin: "bg-blue-100 text-blue-700", user: "bg-gray-100 text-gray-600" }[role] ?? "bg-gray-100 text-gray-600"
}
