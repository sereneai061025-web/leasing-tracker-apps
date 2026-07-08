import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "F&B Licence Tracker",
  description: "Track F&B licence expiries, renewals, and compliance deadlines",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
