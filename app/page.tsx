"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const createEndpoint = () => {
    setLoading(true)
    // Generate a random endpoint ID client-side (crypto.randomUUID in browser)
    const id = crypto.randomUUID().split("-")[0] + crypto.randomUUID().split("-")[0]
    router.push(`/inspect/${id}`)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="font-black text-lg tracking-tight">
          webhook<span className="text-violet-400">inspector</span>
        </span>
        <span className="text-xs text-white/40 font-mono">v1.0 · demo</span>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
            Real-time webhook debugging
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 leading-tight">
            Inspect webhooks<br />
            <span className="text-violet-400">as they land.</span>
          </h1>
          <p className="text-white/50 text-lg max-w-md mx-auto">
            Generate a unique endpoint URL, point any service at it, and watch payloads appear in real time.
            No account needed.
          </p>
        </div>

        <button
          onClick={createEndpoint}
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors disabled:opacity-50 shadow-lg shadow-violet-500/20"
          data-testid="create-endpoint-btn"
        >
          {loading ? "Creating..." : "Create Endpoint →"}
        </button>

        <p className="text-white/30 text-sm mt-4">
          Endpoints expire after 24 hours of inactivity
        </p>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl w-full mt-16 text-left">
          {[
            { icon: "⚡", title: "Real-time", desc: "Payloads appear instantly via SSE — no polling" },
            { icon: "🔍", title: "Full detail", desc: "Headers, body, method, source IP all captured" },
            { icon: "↩️", title: "Replay", desc: "Resend any payload to a configurable target URL" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="font-semibold text-sm mb-1">{title}</div>
              <div className="text-white/40 text-xs leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
