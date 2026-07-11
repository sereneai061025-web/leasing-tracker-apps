import { getCurrentRole } from "@/lib/role"
import Sidebar from "./Sidebar"
import MobileSidebar from "./MobileSidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, email } = await getCurrentRole()
  const userProp = email ? { email, role: role ?? "user" } : null
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={userProp} />
      <MobileSidebar user={userProp} />
      <main className="flex-1 min-w-0 overflow-auto pt-14 md:pt-0">{children}</main>
    </div>
  )
}
