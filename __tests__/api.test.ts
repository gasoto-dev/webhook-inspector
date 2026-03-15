/**
 * @jest-environment node
 */
// Mock DB and SSE so no disk ops in API tests
jest.mock("@/lib/db", () => ({
  insertPayload: jest.fn((p) => ({ ...p, created_at: 1234567890 })),
  getPayload: jest.fn((id: string) => id === "found-id"
    ? { id: "found-id", endpoint_id: "ep", method: "POST", headers: '{"content-type":"application/json"}', body: '{"x":1}', source_ip: null, created_at: 1234567890 }
    : undefined),
  getPayloads: jest.fn(() => []),
}))
jest.mock("@/lib/sse", () => ({ publish: jest.fn(), subscribe: jest.fn(() => () => {}) }))

import { POST as webhookPost } from "@/app/api/webhook/[id]/route"
import { POST as replayPost } from "@/app/api/replay/route"
import { POST as demoPost } from "@/app/api/demo/route"
import { NextRequest } from "next/server"

function makeReq(body: unknown, url = "http://localhost/api/test"): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/webhook/[id]", () => {
  it("returns 200 with ok and id", async () => {
    const req = new NextRequest("http://localhost/api/webhook/ep1", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"event":"test"}',
    })
    const res = await webhookPost(req, { params: Promise.resolve({ id: "ep1" }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.id).toBeDefined()
  })

  it("handles empty body", async () => {
    const req = new NextRequest("http://localhost/api/webhook/ep2", {
      method: "POST",
      headers: {},
      body: "",
    })
    const res = await webhookPost(req, { params: Promise.resolve({ id: "ep2" }) })
    expect(res.status).toBe(200)
  })
})

describe("POST /api/replay", () => {
  it("returns 400 when missing params", async () => {
    const res = await replayPost(makeReq({}))
    expect(res.status).toBe(400)
  })

  it("returns 404 when payload not found", async () => {
    const res = await replayPost(makeReq({ payloadId: "missing", targetUrl: "http://example.com" }))
    expect(res.status).toBe(404)
  })

  it("returns 200 when payload found and target responds", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as jest.Mock
    const res = await replayPost(makeReq({ payloadId: "found-id", targetUrl: "http://example.com/hook" }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})

describe("POST /api/demo", () => {
  it("returns 400 when endpointId missing", async () => {
    const res = await demoPost(makeReq({}))
    expect(res.status).toBe(400)
  })

  it("fires demo payload when endpointId provided", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as jest.Mock
    const res = await demoPost(makeReq({ endpointId: "ep-demo" }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})
