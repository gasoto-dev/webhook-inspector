// SSE subscriber registry (in-process, per-endpoint)
const subscribers = new Map<string, Set<(data: string) => void>>()

export function subscribe(endpointId: string, fn: (data: string) => void): () => void {
  if (!subscribers.has(endpointId)) subscribers.set(endpointId, new Set())
  subscribers.get(endpointId)!.add(fn)
  return () => {
    subscribers.get(endpointId)?.delete(fn)
    if (subscribers.get(endpointId)?.size === 0) subscribers.delete(endpointId)
  }
}

export function publish(endpointId: string, data: unknown): void {
  const subs = subscribers.get(endpointId)
  if (!subs) return
  const str = JSON.stringify(data)
  for (const fn of subs) fn(str)
}
