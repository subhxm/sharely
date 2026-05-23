# Sharely

Sharely is a Cloudflare-first, no-account, browser-to-browser file transfer app. This repository contains the Phase 1 MVP foundation from `sharely-prd.md`: React UI, Worker room APIs, Durable Object WebSocket signalling, WebRTC DataChannel transfer, application-layer chunk encryption, and local-only transfer history.

## Quick Start

```bash
npm install
npm run dev
```

The scripts also work with `pnpm` if you prefer it.

Open `http://localhost:5173`, create a room in one tab, and join the displayed `/r/{roomCode}` link from another tab or browser.

## Scripts

- `pnpm dev` starts the local Cloudflare/Vite development server.
- `pnpm build` type-checks and builds the app.
- `pnpm test` runs unit tests.
- `pnpm test:e2e` runs the Playwright smoke tests.
- `pnpm deploy` builds and deploys with Wrangler.

## Cloudflare Bindings

The MVP expects these bindings in `wrangler.jsonc`:

- `SIGNAL_ROOM`: Durable Object for WebSocket signalling.
- `ROOM_INDEX`: KV namespace for ephemeral room-code lookup.
- `RELAY_BUCKET`: R2 bucket for encrypted relay fallback chunks.
- `ANALYTICS`: Workers Analytics Engine dataset for aggregate, privacy-preserving events.

Replace the placeholder KV ids before a real deployment:

```bash
wrangler kv namespace create ROOM_INDEX
wrangler kv namespace create ROOM_INDEX --preview
```

## Privacy Notes

- Direct file bytes move over WebRTC DataChannel, not through the Worker.
- Relay upload requires `X-Sharely-Encrypted` and is intended only for encrypted chunks.
- Transfer history stays in browser IndexedDB.
- Analytics events must never include file names, content, exact IPs, messages, or persistent user identifiers.
