"use client"

import { use, useEffect, useRef, useState } from "react"
import type { Payload } from "@/lib/db"

function formatBody(body: string): string {
  try { return JSON.stringify(JSON.parse(body), null, 2) } catch { return body }
}

function CurlCommand({ payload, endpointId }: { payload: Payload; endpointId: string }) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const headers = JSON.parse(payload.headers || "{}")
  const headerFlags = Object.entries(headers as Record<string,string>)
    .filter(([k]) => !["host","content-length"].includes(k.toLowerCase()))
    .map(([k,v]) => `-H "${k}: ${v}"`)
    .join(" \\\n  ")
  const cmd = `curl -X ${payload.method} "${baseUrl}/api/webhook/${endpointId}" \\\n  ${headerFlags} \\\n  -d '${payload.body.replace(/'/g, "'\\''")}'`
  return <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap break-all bg-black/40 rounded-lg p-3 mt-2">{cmd}</pre>
}

export default function InspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: endpointId } = use(params)
  const [payloads, setPayloads] = useState<Payload[]>([])
  const [selected, setSelected] = useState<Payload | null>(null)
  const [copied, setCopied] = useState(false)
  const [replayUrl, setReplayUrl] = useState("")
  const [replayStatus, setReplayStatus] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"body" | "headers" | "curl">("body")
  const [demoSending, setDemoSending] = useState(false)
  const endpointUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhook/${endpointId}`
    : `/api/webhook/${endpointId}`
  const eventRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource(`/api/webhook/${endpointId}/stream`)
    eventRef.current = es
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data) as Payload
        setPayloads((prev) => {
          if (prev.find((p) => p.id === payload.id)) return prev
          return [payload, ...prev]
        })
      } catch { /* ignore */ }
    }
    return () => es.close()
  }, [endpointId])

  const copyUrl = () => {
    navigator.clipboard.writeText(endpointUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendDemo = async () => {
    setDemoSending(true)
    await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpointId }) })
    setDemoSending(false)
  }

  const replay = async () => {
    if (!selected || !replayUrl) return
    setReplayStatus("sending...")
    const res = await fetch("/api/replay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payloadId: selected.id, targetUrl: replayUrl }),
    })
    const { status } = await res.json()
    setReplayStatus(`→ ${status}`)
    setTimeout(() => setReplayStatus(null), 3000)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <a href="/" className="font-black text-base tracking-tight">
          webhook<span className="text-violet-400">inspector</span>
        </a>
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <span className="font-mono text-xs text-white/40 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 flex-1 truncate">
            {endpointUrl}
          </span>
          <button
            onClick={copyUrl}
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap"
          >
            {copied ? "✓ Copied" : "Copy URL"}
          </button>
        </div>
        <button
          onClick={sendDemo}
          disabled={demoSending}
          className="text-xs border border-white/20 hover:border-violet-400 text-white/60 hover:text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          data-testid="send-demo-btn"
        >
          {demoSending ? "Sending..." : "Send test payload"}
        </button>
      </nav>

      {/* Main split pane */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>
        {/* Left: payload list */}
        <div className="w-72 border-r border-white/10 flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Requests</span>
            <span className="text-xs text-white/30">{payloads.length}</span>
          </div>
          {payloads.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-4">
                <span className="text-xl">⟳</span>
              </div>
              <p className="text-white/30 text-sm">Waiting for requests...</p>
              <p className="text-white/20 text-xs mt-1">Send a POST to your endpoint URL</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto" data-testid="payload-list">
              {payloads.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelected(p); setActiveTab("body") }}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${selected?.id === p.id ? "bg-violet-500/10 border-l-2 border-l-violet-500" : ""}`}
                  data-testid="payload-item"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      p.method === "GET" ? "bg-green-500/20 text-green-400" :
                      p.method === "POST" ? "bg-blue-500/20 text-blue-400" :
                      "bg-orange-500/20 text-orange-400"
                    }`}>{p.method}</span>
                    <span className="text-xs text-white/40 truncate font-mono">{p.id.slice(0, 8)}</span>
                  </div>
                  <p className="text-xs text-white/30">
                    {new Date(p.created_at).toLocaleTimeString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: detail */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <div className="text-5xl mb-4 opacity-20">📋</div>
                <p className="text-white/30 text-sm">Select a request to inspect</p>
              </div>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center gap-4 flex-wrap">
                <span className={`text-sm font-bold px-2 py-1 rounded ${
                  selected.method === "GET" ? "bg-green-500/20 text-green-400" :
                  selected.method === "POST" ? "bg-blue-500/20 text-blue-400" :
                  "bg-orange-500/20 text-orange-400"
                }`}>{selected.method}</span>
                <span className="font-mono text-sm text-white/60 truncate">/api/webhook/{endpointId}</span>
                <span className="text-xs text-white/30 ml-auto">
                  {new Date(selected.created_at).toLocaleString()}
                  {selected.source_ip && ` · ${selected.source_ip}`}
                </span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-6 py-2 border-b border-white/10">
                {(["body", "headers", "curl"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors capitalize ${
                      activeTab === tab ? "bg-violet-500/20 text-violet-300" : "text-white/40 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "body" && (
                  <pre className="text-sm font-mono text-green-300 whitespace-pre-wrap break-all bg-black/30 rounded-xl p-4 border border-white/5" data-testid="payload-body">
                    {selected.body || "(empty body)"}
                  </pre>
                )}
                {activeTab === "headers" && (
                  <div className="rounded-xl border border-white/10 overflow-hidden" data-testid="payload-headers">
                    {Object.entries(JSON.parse(selected.headers || "{}") as Record<string, string>).map(([k, v]) => (
                      <div key={k} className="flex border-b border-white/5 last:border-0">
                        <div className="w-48 flex-shrink-0 px-4 py-2 text-xs font-mono text-violet-300 bg-white/3">{k}</div>
                        <div className="flex-1 px-4 py-2 text-xs font-mono text-white/60 break-all">{v}</div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "curl" && (
                  <CurlCommand payload={selected} endpointId={endpointId} />
                )}

                {/* Replay */}
                <div className="mt-6 border border-white/10 rounded-xl p-4 bg-white/3">
                  <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Replay</div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={replayUrl}
                      onChange={(e) => setReplayUrl(e.target.value)}
                      placeholder="https://your-server.com/webhook"
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500"
                    />
                    <button
                      onClick={replay}
                      disabled={!replayUrl}
                      className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-40"
                    >
                      Replay
                    </button>
                  </div>
                  {replayStatus && (
                    <p className="text-xs text-violet-300 mt-2 font-mono">{replayStatus}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
