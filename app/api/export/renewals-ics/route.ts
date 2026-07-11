import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function icsDate(dateStr: string) {
  return dateStr.replace(/-/g, "")
}

function icsEscape(s: string) {
  return s.replace(/[\\;,]/g, c => `\\${c}`).replace(/\n/g, "\\n")
}

export async function GET() {
  const supabase = await createClient()
  const { data: licences } = await supabase
    .from("licences")
    .select("*, authorities(abbreviation), outlets(outlet_code)")
    .order("expiry_date", { ascending: true })

  const events = (licences ?? []).map((l: any) => {
    const uid = `licence-${l.id}@licencetracker`
    const dtstart = icsDate(l.expiry_date)
    const summary = icsEscape(`Renew: ${l.licence_name} (${l.authorities?.abbreviation ?? ""})`)
    const desc = icsEscape(`Licence No: ${l.licence_number ?? "N/A"} | Outlet: ${l.outlets?.outlet_code ?? "N/A"} | Owner: ${l.assigned_to ?? "Unassigned"}`)
    const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtstart}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      "BEGIN:VALARM",
      "TRIGGER:-P7D",
      "ACTION:DISPLAY",
      `DESCRIPTION:7 days until expiry: ${l.licence_name}`,
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-P30D",
      "ACTION:DISPLAY",
      `DESCRIPTION:30 days until expiry: ${l.licence_name}`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n")
  })

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//F&B Licence Tracker//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:F&B Licence Renewals",
    "X-WR-TIMEZONE:Asia/Singapore",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n")

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="licence-renewals.ics"',
    },
  })
}
