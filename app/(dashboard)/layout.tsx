import { createClient } from "@/lib/supabase/server"
import Sidebar from "./Sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user ? { email: user.email ?? "" } : null} />
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  )
}
