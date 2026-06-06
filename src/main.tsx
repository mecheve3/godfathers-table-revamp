// Sentry must be the very first import so it can capture errors from line 1.
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN ?? "",
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_RELEASE,
  // Only send events in production — keeps dev/staging noise out of the dashboard
  enabled: import.meta.env.MODE === "production" && !!import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.1,
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    "Network request failed",
  ],
})

import { createRoot } from "react-dom/client"
import App from "./app/App.tsx"
import "./styles/index.css"
import { initAnalytics, track } from "./lib/analytics"

// ── Cloudflare Web Analytics beacon (injected only when token is set) ────────
const cfToken = import.meta.env.VITE_CF_ANALYTICS_TOKEN
if (cfToken) {
  const s = document.createElement("script")
  s.defer = true
  s.src = "https://static.cloudflareinsights.com/beacon.min.js"
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: cfToken }))
  document.head.appendChild(s)
}

// ── PostHog bootstrap (async, never blocks render) ───────────────────────────
const _appStartTime = performance.now()
initAnalytics().then(() => {
  track("game_opened", {
    ttfr_ms: Math.round(performance.now() - _appStartTime),
  })
})

createRoot(document.getElementById("root")!).render(<App />)
