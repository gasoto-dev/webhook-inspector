# Webhook Inspector

Live webhook debugging tool. Generate a unique endpoint URL, point any service at it, and watch payloads appear in real time.

## Why this exists

Debugging webhooks in production is painful — you can't see what's actually being sent, headers get mangled, and reproducing issues means waiting for events to fire. Webhook Inspector gives you a live window into exactly what arrives, with no setup required.

## Features

- **Instant endpoint generation** — click once, get a unique URL
- **Real-time payload delivery** — SSE, no polling
- **Full inspection** — method, headers, body (JSON pretty-printed), source IP
- **Replay** — resend any payload to a configurable target URL
- **cURL export** — copy any request as a curl command
- **Demo mode** — send a Stripe-style test payload without a real service
- **24h TTL** — payloads expire automatically

## Local setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`, click **Create Endpoint**, copy the URL, and send a webhook at it:

```bash
curl -X POST http://localhost:3000/api/webhook/<your-id> \
  -H "Content-Type: application/json" \
  -d '{"event": "payment.succeeded", "amount": 4999}'
```

## Architecture

```
Browser → / (generate endpoint ID) → /inspect/<id>
                                           │
                              ┌────────────┴────────────┐
                              │                         │
                    GET /api/webhook/<id>/stream    POST /api/webhook/<id>
                    (SSE — push new payloads)       (store + publish to SSE)
                              │                         │
                              └────────────┬────────────┘
                                           │
                                    SQLite (webhooks.db)
                                    payloads table (TTL 24h)
```

### SSE subscriber registry

`lib/sse.ts` holds an in-process `Map<endpointId, Set<fn>>`. When a POST arrives, `publish()` fires all subscribers for that endpoint. The SSE stream handler calls `subscribe()` on connect and `unsub()` on disconnect.

### Payload lifecycle

1. POST arrives → `insertPayload()` to SQLite + `publish()` to SSE
2. Inspector page connects → SSE stream sends last 50 existing payloads + live updates
3. After 24h — `purgeExpired()` removes stale rows (called on demand; add a cron for production)

## Testing

```bash
npm test
```

24 tests: DB operations (7), SSE pub/sub (5), API routes (9), page smoke tests (5).
