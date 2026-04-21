# Godfather's Table

A browser-based multiplayer card game for 3–6 players. Built with React + Vite, deployed on Cloudflare Pages. Real-time multiplayer powered by Cloudflare Durable Objects.

## Stack

- **Frontend:** React 18, React Router 7, Tailwind CSS v4, Framer Motion
- **Multiplayer:** Cloudflare Workers + Durable Objects (WebSocket rooms)
- **Deployment:** Cloudflare Pages (frontend) + Cloudflare Workers (room server)

## Local Setup

### Prerequisites
- Node.js 18+
- npm 9+ (or pnpm)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if your worker runs on a different port.

### 3. Start the multiplayer worker (optional — single-player works without it)

```bash
cd worker
npm install
npm run dev      # starts on http://localhost:8787
```

### 4. Start the frontend

```bash
npm run dev      # starts on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build    # output goes to dist/
npm run preview  # serve the build locally
```

## Deployment (Cloudflare)

### Frontend — Cloudflare Pages

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable | `VITE_WORKER_URL` = your worker URL |

### Worker — Cloudflare Workers

```bash
cd worker
npm run deploy
```

The worker URL (e.g. `https://godfathers-table-room.<account>.workers.dev`) must be set as `VITE_WORKER_URL` in the Cloudflare Pages environment variables.

## Project Structure

```
src/
  app/
    components/     # Shared UI components
    context/        # React contexts (Language, User)
    features/
      auth/         # Feature flags
      game/         # Game logic, audio, SFX
      match/        # Match config context
      multiplayer/  # WebSocket client, room API
    pages/          # Route-level page components
  locales/          # i18n strings (en.json, es.json)
  styles/           # Global CSS
worker/
  src/
    index.ts        # Worker entry + HTTP routes
    room.ts         # Durable Object room logic
    types.ts        # Shared types (worker ↔ client)
```
