"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const nav = [
  { href: "/", label: "Overview", icon: "⊞" },
  { href: "/licences", label: "All Licences", icon: "📋" },
  { href: "/renewals", label: "Renewals", icon: "🔄" },
  { href: "/expired", label: "Expired", icon: "⚠️" },
  { href: "/financial", label: "Financial", icon: "💰" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
]

export default function Sidebar({ user }: { user: { email: string } | null }) {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0 bg-gray-900 min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">LC</div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Licence Tracker</p>
            <p className="text-gray-400 text-xs">F&B Compliance</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(item => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? "bg-indigo-600 text-white font-medium" : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-700 space-y-2">
        {user ? (
          <>
            <Link href="/licences/new"
              className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
              + Add Licence
            </Link>
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.email[0].toUpperCase()}
              </div>
              <p className="text-gray-400 text-xs truncate flex-1">{user.email}</p>
            </div>
            <form action="/auth/signout" method="POST">
              <button type="submit" className="w-full py-1.5 text-gray-500 hover:text-white hover:bg-gray-800 text-xs rounded-lg transition-colors">
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-gray-500 text-xs text-center px-2">Viewing as guest</p>
            <Link href="/login"
              className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
              🔒 Sign In
            </Link>
          </>
        )}
      </div>
    </aside>
  )
}
