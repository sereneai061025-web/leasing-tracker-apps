import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams

  async function login(formData: FormData) {
    "use server"
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    })
    if (error) redirect("/login?error=Invalid+email+or+password")
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">LC</div>
          <div>
            <p className="text-white font-semibold text-lg leading-tight">Licence Tracker</p>
            <p className="text-gray-400 text-xs">F&B Compliance</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your credentials to manage licences</p>
          {sp.error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {sp.error}
            </div>
          )}
          <form action={login} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Email</label>
              <input name="email" type="email" required autoComplete="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Password</label>
              <input name="password" type="password" required autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••" />
            </div>
            <button type="submit"
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors mt-2">
              Sign In
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-500 mt-6">
          Dashboard is publicly viewable — login required to add, edit or delete.
        </p>
      </div>
    </div>
  )
}
