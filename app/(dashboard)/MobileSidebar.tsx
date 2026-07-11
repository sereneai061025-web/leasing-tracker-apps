"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const nav = [
  { href: "/", label: "Overview", icon: "⊞" },
  { href: "/licences", label: "All Licences", icon: "📋" },
  { href: "/renewals", label: "Renewals", icon: "🔄" },
  { href: "/expired", label: "Expired", icon: "⚠️" },
  { href: "/financial", label: "Financial", icon: "💰" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/admin/users", label: "User Mgmt", icon: "👥" },
]
const roleColors: Record<string, string> = { admin: "bg-purple-500", sub_admin: "bg-blue-500", user: "bg-gray-500" }
const roleLabels: Record<string, string> = { admin: "Admin", sub_admin: "Sub-Admin", user: "User" }

export default function MobileSidebar({ user }: { user: { email: string; role: string } | null }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = "" } }, [open])
  const visibleNav = user?.role === "admin" ? nav : nav.filter(n => n.href !== "/admin/users")

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">LC</div>
          <p className="text-white text-sm font-semibold">Licence Tracker</p>
        </div>
        <button onClick={() => setOpen(true)} className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </header>
      {open && <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />}
      <div className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-gray-900 flex flex-col transform transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 py-5 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">LC</div>
            <div><p className="text-white text-sm font-semibold">Licence Tracker</p><p className="text-gray-400 text-xs">F&B Compliance</p></div>
          </div>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map(item => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${active ? "bg-indigo-600 text-white font-medium" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
                <span className="text-base">{item.icon}</span>{item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-700 space-y-2">
          {user ? (
            <>
              <Link href="/licences/new" className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">+ Add Licence</Link>
              <div className="flex items-center gap-2 px-2 py-1">
                <div className={`w-7 h-7 rounded-full ${roleColors[user.role] ?? "bg-gray-500"} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {user.email[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-gray-300 text-xs truncate">{user.email}</p>
                  <p className="text-gray-500 text-xs">{roleLabels[user.role] ?? user.role}</p>
                </div>
              </div>
              <form action="/auth/signout" method="POST">
                <button type="submit" className="w-full py-2 text-gray-500 hover:text-white hover:bg-gray-800 text-xs rounded-lg transition-colors">Sign Out</button>
              </form>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-xs text-center">Viewing as guest</p>
              <Link href="/login" className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">🔒 Sign In</Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}
