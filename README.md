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

- `npm run dev` starts the local Cloudflare/Vite development server.
- `npm run build` type-checks and builds the app.
- `npm test` runs unit tests.
- `npm run test:e2e` runs the Playwright smoke tests.
- `npm run deploy` builds and deploys with Wrangler.

## Cloudflare Bindings

The MVP expects these bindings in `wrangler.jsonc`:

- `SIGNAL_ROOM`: Durable Object for WebSocket signalling.
- `ROOM_INDEX`: KV namespace for ephemeral room-code lookup.
- Optional `RELAY_BUCKET`: R2 bucket for encrypted relay fallback chunks.
- Optional `ANALYTICS`: Workers Analytics Engine dataset for aggregate, privacy-preserving events.

Create the KV namespace before a real deployment:

```bash
wrangler kv namespace create ROOM_INDEX
```

Copy the returned `id` into the `ROOM_INDEX` binding in `wrangler.jsonc`.

R2 relay fallback is optional for the first deployment. If your Cloudflare account has R2 enabled, create the relay bucket:

```bash
wrangler r2 bucket create sharely-relay
```

Then add this binding to `wrangler.jsonc`:

```json
"r2_buckets": [
  {
    "binding": "RELAY_BUCKET",
    "bucket_name": "sharely-relay"
  }
]
```

If R2 is not enabled, leave the binding out. Direct P2P transfer still works; `/api/relay/*` returns a clear `501` until R2 is configured.

Analytics Engine is optional for the first deployment. If your Cloudflare account has Analytics Engine enabled, add this binding to `wrangler.jsonc`:

```json
"analytics_engine_datasets": [
  {
    "binding": "ANALYTICS",
    "dataset": "sharely_events"
  }
]
```

If Analytics Engine is not enabled, leave the binding out. The Worker skips event writes automatically.

## GitHub Actions Deployment

The repository includes [`.github/workflows/cloudflare-worker.yml`](.github/workflows/cloudflare-worker.yml), which:

- Runs on pushes to `main` or `master`, pull requests, and manual workflow dispatch.
- Installs with `npm ci`, builds, and runs unit tests.
- Runs a Wrangler dry-run preview and writes a clean summary to the GitHub Actions run page.
- Deploys to Cloudflare on non-PR runs.
- Uploads preview and deployment logs as workflow artifacts.

### Required GitHub Secrets

Add these in GitHub under `Settings -> Secrets and variables -> Actions -> New repository secret`:

- `CLOUDFLARE_API_TOKEN`: Cloudflare API token for deployment.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID.

Use an API token rather than the legacy global API key. The token should include permissions for Workers Scripts, Workers Routes if you add routes later, Workers KV Storage, R2, and Account Analytics.

### Deployment Steps

1. Create Cloudflare resources:

   ```bash
   npx wrangler kv namespace create ROOM_INDEX
   ```

2. Copy the returned KV namespace id into `wrangler.jsonc`:

   ```json
   "binding": "ROOM_INDEX",
   "id": "your-kv-namespace-id"
   ```

3. Optional: enable R2 in the Cloudflare Dashboard, create `sharely-relay`, and add the `RELAY_BUCKET` binding shown above.

4. Optional: enable Analytics Engine in the Cloudflare Dashboard and add the `ANALYTICS` binding shown above.

5. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub repository secrets.

6. Push to `main` or `master`, or run `Cloudflare Worker Deploy` manually from GitHub Actions.

7. Open the workflow run summary. The preview job shows build size and dry-run logs; the deploy job shows the deployment URL and final Wrangler log tail.

## Privacy Notes

- Direct file bytes move over WebRTC DataChannel, not through the Worker.
- Relay upload requires `X-Sharely-Encrypted` and is intended only for encrypted chunks.
- Transfer history stays in browser IndexedDB.
- Analytics events must never include file names, content, exact IPs, messages, or persistent user identifiers.
