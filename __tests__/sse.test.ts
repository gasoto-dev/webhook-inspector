/**
 * @jest-environment node
 */
import { subscribe, publish } from "@/lib/sse"

describe("sse — pub/sub", () => {
  it("subscriber receives published data", () => {
    const received: string[] = []
    const unsub = subscribe("ep-1", (data) => received.push(data))
    publish("ep-1", { type: "test" })
    expect(received).toHaveLength(1)
    expect(JSON.parse(received[0])).toEqual({ type: "test" })
    unsub()
  })

  it("unsubscribed fn no longer receives data", () => {
    const received: string[] = []
    const unsub = subscribe("ep-2", (data) => received.push(data))
    unsub()
    publish("ep-2", { type: "test" })
    expect(received).toHaveLength(0)
  })

  it("multiple subscribers on same endpoint all receive", () => {
    const r1: string[] = []
    const r2: string[] = []
    const u1 = subscribe("ep-3", (d) => r1.push(d))
    const u2 = subscribe("ep-3", (d) => r2.push(d))
    publish("ep-3", { msg: "hello" })
    expect(r1).toHaveLength(1)
    expect(r2).toHaveLength(1)
    u1(); u2()
  })

  it("publish to non-existent endpoint is a no-op", () => {
    expect(() => publish("ep-none", { x: 1 })).not.toThrow()
  })

  it("isolated endpoints don't cross-contaminate", () => {
    const r1: string[] = []
    const r2: string[] = []
    const u1 = subscribe("ep-a", (d) => r1.push(d))
    const u2 = subscribe("ep-b", (d) => r2.push(d))
    publish("ep-a", { from: "a" })
    expect(r1).toHaveLength(1)
    expect(r2).toHaveLength(0)
    u1(); u2()
  })
})
