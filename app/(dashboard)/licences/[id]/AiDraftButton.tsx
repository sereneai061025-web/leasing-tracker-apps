"use client"
import { useState } from "react"

export default function AiDraftButton({ licence }: { licence: any }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenceId: licence.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Generation failed")
      setDraft(data.draft)
      setOpen(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    if (draft) navigator.clipboard.writeText(draft)
  }

  return (
    <>
      <button
        onClick={generate} disabled={loading}
        className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-1"
      >
        {loading ? "✨ Drafting…" : "✨ AI Draft Letter"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      {open && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">✨ AI-Drafted Renewal Letter</h2>
              <div className="flex gap-2">
                <button onClick={copy} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors">Copy</button>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{draft}</pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
