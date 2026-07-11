"use client"
import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

export default function DocumentUpload({ licenceId, documentUrl }: { licenceId: string; documentUrl?: string | null }) {
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState<string | null>(documentUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop()
      const path = `${licenceId}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from("licence-docs").upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data: signed } = await supabase.storage.from("licence-docs").createSignedUrl(path, 60 * 60 * 24 * 365)
      // Save path to licences table
      await supabase.from("licences").update({ document_url: path }).eq("id", licenceId)
      setUrl(path)
    } catch (e: any) {
      setError(e.message ?? "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function getDownloadUrl() {
    if (!url) return null
    const supabase = createClient()
    const { data } = await supabase.storage.from("licence-docs").createSignedUrl(url, 3600)
    return data?.signedUrl ?? null
  }

  async function handleDownload() {
    const signedUrl = await getDownloadUrl()
    if (signedUrl) window.open(signedUrl, "_blank")
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
      <h2 className="font-semibold text-gray-900 mb-3">📎 Licence Document</h2>
      {url ? (
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 truncate">Document attached</p>
            <p className="text-xs text-gray-400 truncate">{url.split("/").pop()}</p>
          </div>
          <button onClick={handleDownload} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors">⬇ Download</button>
          <button onClick={() => inputRef.current?.click()} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">Replace</button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
        >
          <div className="text-3xl mb-2">📄</div>
          <p className="text-sm font-medium text-gray-600">Upload PDF, JPG, or PNG</p>
          <p className="text-xs text-gray-400 mt-1">Max 10 MB</p>
          {uploading && <p className="text-xs text-indigo-600 mt-2 animate-pulse">Uploading…</p>}
        </div>
      )}
      <input
        ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
      />
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  )
}
