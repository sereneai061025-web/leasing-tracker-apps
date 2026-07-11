import { createClient } from "@/lib/supabase/server"
import Sidebar from "./Sidebar"
import MobileSidebar from "./MobileSidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userProp = user ? { email: user.email ?? "" } : null
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <Sidebar user={userProp} />
      {/* Mobile hamburger + drawer */}
      <MobileSidebar user={userProp} />
      {/* Main content — add top padding on mobile for fixed header */}
      <main className="flex-1 min-w-0 overflow-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
