import { NextRequest } from "next/server"
import { subscribe } from "@/lib/sse"
import { getPayloads } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: endpointId } = await params

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send existing payloads on connect (last 50)
      const existing = getPayloads(endpointId).slice(0, 50).reverse()
      for (const p of existing) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(p)}\n\n`))
      }

      // Subscribe to new payloads
      const unsub = subscribe(endpointId, (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch {
          unsub()
        }
      })

      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          clearInterval(heartbeat)
          unsub()
        }
      }, 30000)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
