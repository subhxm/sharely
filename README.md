# Sharely

Sharely is a free-tier-friendly, no-account, browser-to-browser file transfer and chat app. This repository contains the Phase 1 MVP foundation from `sharely-prd.md`: React UI, Worker room APIs, Durable Object WebSocket signalling, WebRTC DataChannel transfer, application-layer chunk encryption, P2P room chat, smart local transfer drafts, and local-only transfer history.

## Free-Tier Stack

Sharely is currently configured to deploy without paid Cloudflare add-ons:

- Cloudflare Worker for API routes and static asset serving.
- Worker static assets for the React app.
- Durable Object `SIGNAL_ROOM` for WebSocket signalling.
- KV namespace `ROOM_INDEX` for ephemeral room-code lookup.
- Browser WebRTC direct P2P for file bytes.
- Browser WebRTC direct P2P for room chat messages.
- Local smart drafts for transfer handoff notes.
- Browser IndexedDB for local-only transfer history.

Not used in this free deployment:

- R2
- Analytics Engine
- Cloudflare Realtime TURN
- Turnstile
- Workers AI
- D1

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, create a room in one tab, and join the displayed `/r/{roomCode}` link from another tab or browser.

## Scripts

- `npm run dev` starts the local Cloudflare/Vite development server.
- `npm run build` type-checks and builds the app.
- `npm test` runs unit tests.
- `npm run test:e2e` runs the Playwright smoke tests.
- `npm run deploy` builds and deploys with Wrangler.

## Cloudflare Bindings

The free MVP expects only these bindings in `wrangler.jsonc`:

- `SIGNAL_ROOM`: Durable Object for WebSocket signalling.
- `ROOM_INDEX`: KV namespace for ephemeral room-code lookup.
- `ASSETS`: Worker static assets binding for the React app.

Create the KV namespace once:

```bash
npx wrangler kv namespace create ROOM_INDEX
```

Copy the returned `id` into the `ROOM_INDEX` binding in `wrangler.jsonc`.

Durable Object migrations are already declared in `wrangler.jsonc`.

## GitHub Actions Deployment

The repository includes [`.github/workflows/cloudflare-worker.yml`](.github/workflows/cloudflare-worker.yml), which:

- Runs on pushes to `main` or `master`, pull requests, and manual workflow dispatch.
- Installs with `npm ci`, builds, and runs unit tests.
- Runs a Wrangler dry-run preview and writes a clean summary to the GitHub Actions run page.
- Deploys to Cloudflare on non-PR runs.
- Uploads preview and deployment logs as workflow artifacts.

### Required GitHub Secrets

Add these in GitHub under `Settings -> Secrets and variables -> Actions -> New repository secret`:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The API token needs permission to deploy Workers and access the KV namespace used by the Worker.

### Deployment Steps

1. Create the KV namespace if it does not already exist:

   ```bash
   npx wrangler kv namespace create ROOM_INDEX
   ```

2. Copy the returned KV namespace id into `wrangler.jsonc`:

   ```json
   "binding": "ROOM_INDEX",
   "id": "your-kv-namespace-id"
   ```

3. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub repository secrets.

4. Push to `main` or `master`, or run `Cloudflare Worker Deploy` manually from GitHub Actions.

5. Open the workflow run summary. The preview job shows build size and dry-run logs; the deploy job shows the deployment URL and final Wrangler log tail.

## Free-Tier Limitations

- No server relay fallback: peers must connect directly over WebRTC/STUN.
- Strict corporate NATs or locked-down networks may fail without TURN.
- No server-side analytics; use local browser logs and Cloudflare's built-in Worker logs.
- No bot challenge on room creation.
- Smart drafts are local metadata-based helpers, not cloud AI generation.

That tradeoff keeps the MVP deployable without enabling paid Cloudflare services.

## Privacy Notes

- Direct file bytes move over WebRTC DataChannel, not through the Worker.
- Chat messages move over the same encrypted WebRTC DataChannel, not through the Worker.
- The Worker only handles room creation, room lookup, and WebSocket signalling.
- Transfer history stays in browser IndexedDB.
- File names and file content are never stored by Sharely servers.
