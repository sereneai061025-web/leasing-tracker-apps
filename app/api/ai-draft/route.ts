import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentRole } from "@/lib/role"

export async function POST(req: Request) {
  const { role } = await getCurrentRole()
  if (!role) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const { licenceId } = await req.json()
  const supabase = await createClient()
  const { data: licence } = await supabase
    .from("licences")
    .select("*, authorities(name,abbreviation,website), outlets(name,outlet_code,address)")
    .eq("id", licenceId)
    .single()
  if (!licence) return NextResponse.json({ error: "Licence not found" }, { status: 404 })

  const today = new Date().toISOString().split("T")[0]
  const expiry = new Date(licence.expiry_date)
  const days = Math.ceil((expiry.getTime() - Date.now()) / 86400000)
  const expiryStr = expiry.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
  const auth = (licence as any).authorities
  const outlet = (licence as any).outlets

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Return a template if no API key configured
    const template = `[Your Company Name]
[Address]
[City, Postal Code]
[Email] | [Phone]

Date: ${today}

${auth?.name ?? "Licensing Authority"}
[Authority Address]

Dear Sir / Madam,

RE: RENEWAL OF ${licence.licence_name.toUpperCase()} — ${licence.licence_number ?? "REF N/A"}

We write to request the renewal of our ${licence.licence_name} (Licence No. ${licence.licence_number ?? "N/A"}) for our establishment at ${outlet?.name ?? "our outlet"} (${outlet?.outlet_code ?? ""}).

The current licence is due to expire on ${expiryStr}${days < 0 ? " (EXPIRED)" : days <= 30 ? ` (${days} days remaining — urgent)` : ` (${days} days remaining)`}. We would like to renew this licence to ensure continued compliance with all applicable regulations.

We confirm that there have been no material changes to our operations, premises, or key personnel since the last renewal. All fees are enclosed / will be transferred upon receipt of your invoice.

Please advise if any additional documentation is required. We look forward to your timely response.

Yours faithfully,

${licence.assigned_to ?? "[Authorised Signatory]"}
[Designation]
${outlet?.name ?? "[Company Name]"}`
    return NextResponse.json({ draft: template })
  }

  const prompt = `You are a professional compliance officer at a Singapore food & beverage company. 
Write a formal renewal letter to the licensing authority for the following licence:

Licence: ${licence.licence_name}
Licence Number: ${licence.licence_number ?? "N/A"}
Category: ${licence.category ?? "N/A"}
Authority: ${auth?.name ?? "N/A"}
Outlet: ${outlet?.name ?? "N/A"} (${outlet?.outlet_code ?? ""}), ${outlet?.address ?? ""}
Expiry Date: ${expiryStr} (${days < 0 ? `EXPIRED ${Math.abs(days)} days ago` : `${days} days remaining`})
Assigned To: ${licence.assigned_to ?? "Compliance Team"}
Notes: ${licence.notes ?? "None"}

Write a concise, professional 3-4 paragraph renewal letter. Include placeholders like [Company Address] where needed. Do not add any preamble or explanation — output only the letter text.`

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    })
    const json = await resp.json()
    const draft = json.content?.[0]?.text ?? "Failed to generate draft."
    return NextResponse.json({ draft })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
