/**
 * @jest-environment node
 */
import { insertPayload, getPayloads, getPayload, purgeExpired } from "@/lib/db"

// Use in-memory DB for tests
process.env.DB_PATH = ":memory:"

describe("db — payload operations", () => {
  const base = {
    id: "test-id-1",
    endpoint_id: "ep-abc",
    method: "POST",
    headers: JSON.stringify({ "content-type": "application/json" }),
    body: '{"event":"test"}',
    source_ip: "1.2.3.4",
  }

  it("inserts and retrieves a payload", () => {
    const p = insertPayload(base)
    expect(p.id).toBe("test-id-1")
    expect(p.endpoint_id).toBe("ep-abc")
    expect(p.created_at).toBeGreaterThan(0)
  })

  it("getPayloads returns payloads for endpoint", () => {
    const results = getPayloads("ep-abc")
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].endpoint_id).toBe("ep-abc")
  })

  it("getPayloads excludes other endpoints", () => {
    const results = getPayloads("ep-other")
    expect(results.length).toBe(0)
  })

  it("getPayload retrieves by id", () => {
    const p = getPayload("test-id-1")
    expect(p?.method).toBe("POST")
    expect(p?.body).toBe('{"event":"test"}')
  })

  it("getPayload returns undefined for missing id", () => {
    expect(getPayload("does-not-exist")).toBeUndefined()
  })

  it("purgeExpired removes nothing when all are fresh", () => {
    const removed = purgeExpired()
    expect(removed).toBe(0)
  })

  it("inserts multiple payloads for same endpoint", () => {
    insertPayload({ ...base, id: "test-id-2" })
    insertPayload({ ...base, id: "test-id-3" })
    const results = getPayloads("ep-abc")
    expect(results.length).toBeGreaterThanOrEqual(3)
  })
})
