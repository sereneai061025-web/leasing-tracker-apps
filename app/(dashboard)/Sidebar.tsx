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

export default function Sidebar() {
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
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-indigo-600 text-white font-medium"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-4 border-t border-gray-700">
        <Link
          href="/licences/new"
          className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Licence
        </Link>
      </div>
    </aside>
  )
}
