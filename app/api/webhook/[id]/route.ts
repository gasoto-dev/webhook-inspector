/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { insertPayload } from "@/lib/db"
import { publish } from "@/lib/sse"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: endpointId } = await params

  const method = req.method
  const sourceIp = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null

  // Capture headers (exclude internal Next.js headers)
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    if (!key.startsWith("x-nextjs") && !key.startsWith("x-vercel")) {
      headers[key] = value
    }
  })

  let body = ""
  try {
    const raw = await req.text()
    // Pretty-print if JSON
    try { body = JSON.stringify(JSON.parse(raw), null, 2) } catch { body = raw }
  } catch { body = "" }

  const payload = insertPayload({
    id: randomUUID(),
    endpoint_id: endpointId,
    method,
    headers: JSON.stringify(headers),
    body,
    source_ip: sourceIp,
  })

  publish(endpointId, payload)

  return NextResponse.json({ ok: true, id: payload.id }, { status: 200 })
}

// Also handle GET/PUT/PATCH/DELETE so any HTTP method works as a webhook
export { POST as GET, POST as PUT, POST as PATCH, POST as DELETE }
