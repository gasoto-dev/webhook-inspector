import { NextRequest, NextResponse } from "next/server"
import { getPayload } from "@/lib/db"

export async function POST(req: NextRequest) {
  const { payloadId, targetUrl } = await req.json() as { payloadId: string; targetUrl: string }

  if (!payloadId || !targetUrl) {
    return NextResponse.json({ error: "payloadId and targetUrl required" }, { status: 400 })
  }

  const payload = getPayload(payloadId)
  if (!payload) {
    return NextResponse.json({ error: "Payload not found" }, { status: 404 })
  }

  let headers: Record<string, string> = {}
  try { headers = JSON.parse(payload.headers) } catch { /* ignore */ }

  // Remove headers that shouldn't be forwarded
  const filtered: Record<string, string> = {}
  for (const [k, v] of Object.entries(headers)) {
    if (!["host", "content-length", "transfer-encoding"].includes(k.toLowerCase())) {
      filtered[k] = v
    }
  }

  try {
    const res = await fetch(targetUrl, {
      method: payload.method,
      headers: filtered,
      body: payload.body || undefined,
    })
    return NextResponse.json({ ok: true, status: res.status })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
