/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { endpointId } = await req.json() as { endpointId: string }
  if (!endpointId) return NextResponse.json({ error: "endpointId required" }, { status: 400 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  const demoPayload = {
    id: `evt_demo_${Date.now()}`,
    type: "payment_intent.succeeded",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `pi_demo_${Date.now()}`,
        amount: 4999,
        currency: "usd",
        status: "succeeded",
        customer: "cus_demo_abc123",
        metadata: { order_id: `ord_${Math.random().toString(36).slice(2, 9)}` },
      },
    },
    livemode: false,
    api_version: "2023-10-16",
  }

  const res = await fetch(`${baseUrl}/api/webhook/${endpointId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": "t=demo,v1=demo_signature",
      "User-Agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
    },
    body: JSON.stringify(demoPayload),
  })

  return NextResponse.json({ ok: res.ok, status: res.status })
}
