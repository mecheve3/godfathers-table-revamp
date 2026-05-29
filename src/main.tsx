import { createRoot } from "react-dom/client"
import App from "./app/App.tsx"
import "./styles/index.css"
import { initAnalytics, track } from "./lib/analytics"
import { initMonitoring } from "./lib/monitoring"

// ── Cloudflare Web Analytics beacon (injected only when token is set) ────────
const cfToken = import.meta.env.VITE_CF_ANALYTICS_TOKEN
if (cfToken) {
  const s = document.createElement("script")
  s.defer = true
  s.src = "https://static.cloudflareinsights.com/beacon.min.js"
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: cfToken }))
  document.head.appendChild(s)
}

// ── PostHog + Sentry bootstrap (async, never blocks render) ─────────────────
const _appStartTime = performance.now()
Promise.all([initAnalytics(), initMonitoring()]).then(() => {
  track("game_opened", {
    ttfr_ms: Math.round(performance.now() - _appStartTime),
  })
})

createRoot(document.getElementById("root")!).render(<App />)
