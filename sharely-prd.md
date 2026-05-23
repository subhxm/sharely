# SHARELY
## Product Requirements Document (PRD)
### Version 1.0 — May 2026

---

> **Sharely** is a serverless, end-to-end encrypted peer-to-peer file sharing and chat platform built on Cloudflare's edge network. It combines the fastest P2P protocols with a bold neobrutalist UI and an AI-powered assistant layer — designed to be a complete, privacy-first alternative to centralized file-sharing and messaging platforms.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Vision & Mission](#3-vision--mission)
4. [Target Audience & User Personas](#4-target-audience--user-personas)
5. [Market Landscape & Competitive Analysis](#5-market-landscape--competitive-analysis)
6. [Product Scope & Phased Roadmap](#6-product-scope--phased-roadmap)
7. [Core Architecture](#7-core-architecture)
8. [Security & Encryption Model](#8-security--encryption-model)
9. [Feature Specifications — Phase 1: P2P File Sharing](#9-feature-specifications--phase-1-p2p-file-sharing)
10. [Feature Specifications — Phase 2: P2P Chat](#10-feature-specifications--phase-2-p2p-chat)
11. [Feature Specifications — Phase 3: AI Integration](#11-feature-specifications--phase-3-ai-integration)
12. [UI/UX Design System — Neobrutalism](#12-uiux-design-system--neobrutalism)
13. [Tech Stack & Cloudflare Deployment](#13-tech-stack--cloudflare-deployment)
14. [API Design](#14-api-design)
15. [Data Model](#15-data-model)
16. [Performance & Scalability Requirements](#16-performance--scalability-requirements)
17. [Accessibility & Internationalisation](#17-accessibility--internationalisation)
18. [Monetisation Strategy](#18-monetisation-strategy)
19. [Analytics & Observability](#19-analytics--observability)
20. [Legal, Compliance & Privacy](#20-legal-compliance--privacy)
21. [Go-to-Market Strategy](#21-go-to-market-strategy)
22. [Success Metrics & KPIs](#22-success-metrics--kpis)
23. [Risks & Mitigations](#23-risks--mitigations)
24. [Open Questions](#24-open-questions)

---

## 1. Executive Summary

Sharely is a **serverless, fully peer-to-peer file sharing and chat platform** that stores nothing on centralised servers. Files travel directly between peers over WebRTC DataChannels, encrypted end-to-end with DTLS-SRTP and an application-layer ECDH key agreement. Signalling coordination (the only server-touching moment in the lifecycle) happens through Cloudflare Workers + Durable Objects deployed across 300+ edge locations — giving sub-50ms round-trip times globally.

The product launches in three phases:

- **Phase 1** — Fast, unlimited, E2E-encrypted P2P file transfer (web app, no install required).
- **Phase 2** — Full-featured P2P chat: DMs, group rooms, voice, video, presence, reactions, threads.
- **Phase 3** — On-device and edge AI: smart file tagging, AI chat assistant, semantic file search, translation.

Sharely's differentiation is the intersection of four properties that no current product satisfies simultaneously: **truly serverless transfers**, **end-to-end encryption by default**, **unlimited file sizes**, and a **neobrutalist UI** that feels unapologetically bold in a sea of bland SaaS sameness.

---

## 2. Problem Statement

### 2.1 User Pain Points

| Pain Point | Current Solutions' Failure |
|---|---|
| File size limits (WeTransfer: 2 GB free, Google Drive: 15 GB cap) | Arbitrary limits not rooted in technical necessity |
| Files stored on third-party servers permanently | Privacy, data sovereignty, and trust concerns |
| Slow transfers that route through central servers | Server bandwidth caps introduce artificial bottlenecks |
| Fragmented tools — one app for files, another for chat | Context-switching and workflow friction |
| No AI-assisted file management | Files accumulate with no intelligent organisation |
| Opaque encryption — trust me bro | Users cannot verify encryption claims without source audits |

### 2.2 Market Gap

The P2P file transfer space has a paradox: the technically superior approach (direct peer-to-peer) exists via WebRTC but is deployed poorly — either as clunky experimental tools, or hamstrung by poor UX. The messaging space has excellent E2E encryption (Signal, Element) but poor file capabilities. No product merges them with a polished, modern, AI-augmented experience built natively on edge infrastructure.

---

## 3. Vision & Mission

**Vision:** A world where sharing files and conversations never touches a server you don't trust.

**Mission:** Build the fastest, most private, most delightful P2P sharing platform — running entirely on the edge, encrypted by default, and intelligent by design.

**Core Principles:**

- **Privacy first** — E2E encryption is not a feature toggle; it is the default, non-optional architecture.
- **Zero data hoarding** — Sharely never stores file content. Metadata stored is minimal, ephemeral, and user-deletable.
- **Speed over ceremony** — A file transfer should start within 3 seconds of the link being shared.
- **Radical transparency** — Open-source protocol layer. Published security audits. Reproducible builds.
- **Delightfully opinionated UI** — Neobrutalism as a design statement: raw, honest, functional, memorable.

---

## 4. Target Audience & User Personas

### 4.1 Primary Personas

**Persona 1: The Privacy-Conscious Professional ("Dev Dilnoza")**
- Age 28–40, software engineer, designer, journalist, or legal professional
- Needs to share large files or sensitive documents without trusting a cloud provider
- Values: open-source, auditability, zero-knowledge architecture
- Pain point: Dropbox/Drive stores plaintext copies server-side; corporate IT restricts cloud tools
- Willingness to pay: High — would pay for team plan if it integrates with their workflow

**Persona 2: The Creative Collaborator ("Creator Chirag")**
- Age 22–35, video editor, musician, graphic designer, game developer
- Regularly transfers 10–50 GB files; hates WeTransfer limits and Dropbox costs
- Values: speed, simplicity, no-login friction for the recipient
- Pain point: Has to compress or split files; recipient needs an account on most platforms
- Willingness to pay: Medium — will pay for "Pro" if it removes limits and adds team workspaces

**Persona 3: The Remote Team ("Squad Meera")**
- Startup or distributed team of 3–20 people
- Wants one tool for file sharing AND chat, rather than Slack + Google Drive + Zoom
- Values: low latency comms, file permanence (optional), thread-based conversations
- Pain point: Tool sprawl, expensive per-seat pricing at scale
- Willingness to pay: High — team pricing model is compelling

**Persona 4: The Casual Power User ("Gamer Arjun")**
- Age 18–30, sends large game archives, mods, or media to friends
- Values: share-a-link simplicity, no account required for recipients
- Pain point: Discord has 25 MB limits; most tools require sign-up
- Willingness to pay: Low, but potential to convert via Pro for recurring use

### 4.2 Secondary Audiences

- Enterprise security teams wanting self-hostable or Cloudflare-hosted zero-trust file transfer
- Academic institutions sharing large research datasets
- Journalists sharing leaked documents with sources (high trust model)

---

## 5. Market Landscape & Competitive Analysis

### 5.1 Competitive Matrix

| Product | P2P | E2E Encrypted | Unlimited Files | Chat | AI | Serverless | UI Quality |
|---|---|---|---|---|---|---|---|
| **Sharely** | ✅ | ✅ | ✅ | ✅ (Phase 2) | ✅ (Phase 3) | ✅ | Neobrutalist ★★★★★ |
| WeTransfer | ❌ (server relay) | ❌ | ❌ (2 GB free) | ❌ | Limited | ❌ | Minimalist ★★★★ |
| Dropbox | ❌ (server) | ❌ (at rest only) | ❌ (storage cap) | Basic | Limited | ❌ | Corporate ★★★ |
| Signal | ❌ (server relay) | ✅ | ❌ (file size cap) | ✅ | ❌ | ❌ | Clean ★★★★ |
| Element/Matrix | Partial | ✅ | Partial | ✅ | ❌ | ❌ | Complex ★★ |
| Wormhole.app | ✅ (WebRTC) | ✅ | ✅ | ❌ | ❌ | Partial | Minimal ★★★ |
| SnapDrop | ✅ (LAN) | ✅ | ✅ | ❌ | ❌ | No (Node.js) | Basic ★★ |
| Briar | ✅ | ✅ | ❌ | ✅ | ❌ | N/A (Android) | Utilitarian ★★ |

### 5.2 Competitive Positioning

Sharely occupies a distinct quadrant: **high privacy + high usability + high file capability + chat-native**. The closest competitor is Wormhole.app (P2P + E2E + unlimited) but it lacks chat, AI, team features, and runs on traditional Node.js servers (not edge). Signal has best-in-class chat E2E encryption but is not P2P, has file size limits, and has no file-centric workflow.

### 5.3 Market Size

- Global file sharing market: USD 9.4B in 2024, projected USD 18.2B by 2030 (CAGR ~11.7%)
- Secure messaging market: USD 12.8B in 2024, growing at ~18% CAGR driven by privacy regulation
- Enterprise file transfer (MFT) market: USD 2.7B in 2024
- Total addressable market (TAM) combining all three segments: ~USD 25B
- Serviceable addressable market (SAM) — privacy-first P2P tools with AI: ~USD 2B
- Serviceable obtainable market (SOM) at Year 3: ~USD 40–80M (niche leader position)

---

## 6. Product Scope & Phased Roadmap

### Phase 1 — P2P File Sharing (MVP) | Target: Q3 2026

**Goal:** Prove the core technical value proposition. Ship the fastest, most private file transfer tool that works in any browser, no install required.

- WebRTC P2P DataChannel file transfer
- ECDH + DTLS E2E encryption
- Cloudflare Workers signalling server
- Room-code based sharing (6-character alphanumeric)
- No account required for either peer
- Chunked transfer with resumability
- Progress, speed, and ETA indicators
- Transfer history (local storage only, never server-stored)
- Neobrutalist web UI (React + Vite)
- Mobile-responsive design
- QR code room joining for mobile
- Multi-file batch transfers
- Transfer link sharing (optional server-assisted room routing for async links)

**Phase 1 Success Gate:** 10,000 unique transfers in first 60 days, NPS > 50, p95 connection time < 4s.

### Phase 2 — P2P Chat Platform | Target: Q1 2027

**Goal:** Layer a full-featured chat product on top of the P2P infrastructure. Compete with Signal for power users and with Slack for small teams.

- User identity (DID-based or passphrase-based keypair, no email/phone required)
- 1:1 encrypted DMs
- Group rooms (up to 50 peers, mesh topology with SFU fallback for large rooms)
- Voice calls (WebRTC audio)
- Video calls (WebRTC video, up to 8 participants)
- Screen sharing
- Message reactions, threads, pinned messages
- File sharing natively inside chat
- Presence indicators (online/away/DND)
- Push notifications (Web Push API, no FCM dependency)
- Message expiry / ephemeral messages
- Read receipts (optional, user-configurable)
- Chat export (local, encrypted)
- Desktop PWA + mobile PWA

**Phase 2 Success Gate:** 50,000 registered keypairs, 5,000 DAU, D30 retention > 35%.

### Phase 3 — AI Layer | Target: Q3 2027

**Goal:** Make Sharely an intelligent assistant for your files and conversations.

- AI file summarisation (PDFs, docs, transcripts) — on-device where possible, Workers AI at edge
- Smart auto-tagging and categorisation of received files
- Semantic file search across transfer history
- AI chat assistant per room (opt-in, context-aware)
- Real-time translation of messages (multilingual teams)
- AI transcription of voice calls
- Smart reply suggestions (opt-in)
- Spam/malware heuristic detection at transfer handshake (metadata-only, no content scanning)

---

## 7. Core Architecture

### 7.1 Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser / PWA)                      │
│                                                                    │
│  ┌──────────────┐   ┌───────────────┐   ┌──────────────────────┐  │
│  │  React UI    │   │ WebRTC Engine │   │  Crypto Layer        │  │
│  │ (Neobrutalist│   │ (DataChannel  │   │  (ECDH + AES-GCM     │  │
│  │  Design Sys) │   │  + ICE + DTLS)│   │   + DTLS-SRTP)       │  │
│  └──────┬───────┘   └───────┬───────┘   └──────────────────────┘  │
│         │                   │                                       │
└─────────┼───────────────────┼───────────────────────────────────────┘
          │                   │
          │ HTTPS (signalling) │ UDP/TCP (P2P media/data — DIRECT)
          │                   │
┌─────────▼───────────────────┼───────────────────────────────────────┐
│              CLOUDFLARE EDGE (300+ PoPs)                            │
│                                                                      │
│  ┌──────────────────────┐   ┌──────────────────────────────────┐    │
│  │  Cloudflare Worker   │   │  Durable Object (SignalRoom)      │    │
│  │  (API Gateway / Auth │   │  - WebSocket session management   │    │
│  │   Routing / KV ops)  │   │  - SDP/ICE candidate relay        │    │
│  └──────────────────────┘   │  - Room state (ephemeral, TTL)    │    │
│                              └──────────────────────────────────┘    │
│  ┌─────────────┐  ┌────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Cloudflare  │  │  KV    │  │  D1 (SQLite) │  │  R2 Object   │   │
│  │ Workers AI  │  │(Session│  │ (User prefs, │  │  Storage     │   │
│  │(Whisper,LLMS│  │ Cache) │  │ room meta)   │  │(Relay fallbk)│   │
│  └─────────────┘  └────────┘  └──────────────┘  └──────────────┘   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │     Cloudflare STUN (stun.cloudflare.com) + TURN ($0.05/GB)   │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.2 Connection Lifecycle

1. **Room Creation** — Peer A generates a room code and cryptographic keypair. Room metadata posted to Worker → Durable Object instantiated at nearest PoP.
2. **Signalling** — Peer A and Peer B connect to the Durable Object via WebSocket. SDP offers/answers and ICE candidates are relayed through the Durable Object.
3. **Key Exchange** — ECDH key agreement happens over the signalling channel (itself TLS-secured). Peers derive a shared AES-256-GCM session key. This key never leaves the clients.
4. **Direct Connection** — ICE negotiation attempts STUN first (free, direct); falls back to Cloudflare TURN only if direct NAT traversal fails (~10–15% of cases). Success rate target: >95% direct connections.
5. **Transfer** — Files are chunked (default 64 KB chunks), encrypted chunk-by-chunk with AES-256-GCM, and sent over the WebRTC DataChannel. No data touches the server.
6. **Completion** — Room Durable Object is destroyed (TTL: 30 minutes of inactivity). Server has never seen file content.

### 7.3 Signalling Durable Object Design

Each room maps to one Durable Object instance. Durable Objects are co-located with the WebSocket connection, minimising latency. The Hibernation API is used so the object sleeps between messages — dramatically reducing Cloudflare billing.

```typescript
// Pseudocode — SignalRoom Durable Object
class SignalRoom extends DurableObject {
  peers: Map<string, WebSocket> = new Map();
  
  async fetch(request: Request) {
    const ws = new WebSocketPair();
    this.ctx.acceptWebSocket(ws.server);
    return new Response(null, { status: 101, webSocket: ws.client });
  }

  async webSocketMessage(ws: WebSocket, msg: string) {
    const { type, to, payload } = JSON.parse(msg);
    // Relay SDP/ICE to target peer only — never stored, never logged
    if (type === 'offer' || type === 'answer' || type === 'ice-candidate') {
      this.peers.get(to)?.send(JSON.stringify({ type, from: peerId, payload }));
    }
  }
}
```

### 7.4 Fallback Architecture — Relay Mode

When P2P is unavailable (symmetric double-NAT, corporate firewall), Sharely falls back to a chunked relay via Cloudflare R2:

- Sender encrypts chunks locally (AES-256-GCM) and uploads to ephemeral R2 object.
- Object key shared with receiver via signalling channel.
- Receiver downloads and decrypts locally.
- R2 object auto-deleted after 24 hours or first successful download.
- Cloudflare never possesses the decryption key.

---

## 8. Security & Encryption Model

### 8.1 Threat Model

| Threat | Mitigation |
|---|---|
| Man-in-the-middle on signalling | TLS 1.3 on all signalling; DTLS-SRTP on WebRTC channels mandatory |
| Server-side data exposure | File content never stored server-side (P2P direct only) |
| Replay attacks on file chunks | Each chunk has a unique AES-GCM nonce (96-bit random); chunk sequence counter validated |
| Key impersonation | Out-of-band fingerprint verification (SAS — Short Authentication String) displayed on both peers |
| IP address exposure | TURN relay mode anonymises peer IP; optional by user preference |
| Malicious file delivery | File metadata hash verified post-transfer; MIME type double-checked client-side |
| Room code enumeration | Room codes are 6-char base62 (56 billion combinations); rate-limited to 5 attempts/IP/minute |

### 8.2 Cryptographic Primitives

| Layer | Protocol/Algorithm | Notes |
|---|---|---|
| Transport (signalling) | TLS 1.3 (Cloudflare-managed) | Perfect forward secrecy via ECDHE |
| Transport (P2P data) | DTLS 1.3 | Mandatory; WebRTC enforces this |
| Key Agreement | ECDH over P-256 (or X25519) | Keys generated fresh per session; no persistence |
| Symmetric encryption | AES-256-GCM | Each file chunk encrypted independently |
| Chunk integrity | GCM authentication tag (128-bit) + chunk index | Prevents reordering attacks |
| Identity fingerprint | SHA-256 of public key, encoded as SAS | Optional user-visible verification |
| Post-quantum roadmap | CRYSTALS-Kyber (KEM) hybrid | Phase 3 — following Signal's 2025 PQXDH approach |

### 8.3 Key Management Rules

- Session keypairs are generated in the browser using the Web Crypto API (`SubtleCrypto`).
- Private keys are held only in memory for the duration of the session.
- No private key material is ever sent to any server.
- Optional: User may persist an identity keypair in browser `indexedDB` using password-based key derivation (PBKDF2, 600,000 iterations, per NIST SP 800-132).
- No key escrow. Sharely has zero ability to decrypt any transfer.

### 8.4 Security Audits & Transparency

- Open-source cryptographic layer (MIT licensed).
- Bi-annual third-party security audits (budget: $30,000/year); reports published publicly.
- Bug bounty program from Day 1 (HackerOne platform; critical severity: $5,000 maximum).
- Certificate transparency monitoring for the Sharely domain.

---

## 9. Feature Specifications — Phase 1: P2P File Sharing

### 9.1 File Transfer — Core Flow

**FR-001: Room Creation**
- User clicks "Share Files" on homepage.
- System generates a 6-character alphanumeric room code and renders a QR code.
- System creates a Durable Object for the room with a 30-minute TTL.
- The room code is displayed in a large neobrutalist card with a "Copy Link" button.
- Shareable URL format: `https://sharely.app/r/{roomCode}`

**FR-002: Room Joining**
- Recipient opens the URL or enters the code on the homepage.
- System looks up the Durable Object via KV (room code → DO stub).
- If room exists: WebSocket connection established immediately.
- If room expired: "Room not found" error displayed with option to create new room.

**FR-003: File Selection**
- Drag-and-drop zone or file picker button accepts any file type.
- No file size limit enforced by Sharely. Files above 1 TB: chunked parallel transfer with resume support.
- Multiple files selectable at once; displayed as a file queue with size/type indicators.
- Estimated transfer time calculated based on current throughput measurement.

**FR-004: Transfer Execution**
- Chunk size: adaptive (starts at 64 KB, auto-adjusts up to 512 KB based on connection quality).
- Parallel chunk streams: up to 8 concurrent per DataChannel.
- Progress shown per file and overall (percentage bar + speed in MB/s + ETA).
- Pause/resume per transfer.
- Cancel: closes DataChannel; ephemeral room is not immediately destroyed (receiver may reconnect within TTL).

**FR-005: Receive & Download**
- Recipient sees incoming files listed with names, sizes, and sender-provided labels.
- Each file: "Save" button triggers browser download of reconstructed file.
- File integrity verified by SHA-256 hash comparison (hash sent in-band after transfer).
- "Save All" button for batch download.

**FR-006: No-Account Flow**
- Both sender and receiver operate without accounts in Phase 1.
- Room codes are the only shared state.
- Transfer history stored in browser `localStorage` only; never server-synced.

**FR-007: Transfer Link (Async Mode)**
- Sender may set a link expiry (1 hour / 24 hours / 7 days).
- During async window: sender's browser (or background Service Worker) holds the file; recipient connects when ready.
- If sender's browser closes: server relay fallback (R2 encrypted object) activates automatically.
- Relay objects self-destruct after first download or on expiry.

### 9.2 Non-Functional Requirements — Phase 1

| Requirement | Target |
|---|---|
| Time-to-first-byte (P2P connected) | < 3 seconds from room join |
| P2P connection success rate | ≥ 92% direct (STUN only); ≥ 99.5% combined (STUN + TURN) |
| Max file size | Unlimited (tested to 1 TB in staging) |
| Chunk encryption overhead | < 2% throughput reduction vs unencrypted baseline |
| Browser support | Chrome 90+, Firefox 88+, Safari 15+, Edge 90+, Mobile Chrome/Safari |
| Bundle size (initial JS) | < 200 KB gzipped |
| Lighthouse performance score | ≥ 90 on mobile, ≥ 95 on desktop |

---

## 10. Feature Specifications — Phase 2: P2P Chat

### 10.1 Identity System

**FR-100: Keychain Identity**
- Users generate an identity keypair (X25519) on first use, stored encrypted in `indexedDB`.
- Display name + avatar (user-set; no server validation).
- Identity exported as a passphrase-encrypted file (12-word BIP39 mnemonic + JSON backup).
- No phone number. No email. No government ID. Pure cryptographic identity.
- Optional: Link email for recovery only (email not used as identity; stored as HMAC hash).

**FR-101: Contact Discovery**
- Contacts added by sharing a QR code / link containing public key + display name.
- No central directory. Contact list stored locally, encrypted with identity key.
- Optional server-assisted discovery: users opt in to publish a username hash to KV (pseudonymous lookup).

### 10.2 Messaging

**FR-110: 1:1 Direct Messages**
- E2E encrypted using Signal Protocol-style Double Ratchet (or libsodium Box for simplicity in Phase 2 MVP).
- Messages never stored on server. Delivered P2P when both online; stored encrypted in sender's `indexedDB` for async delivery via relay.
- Message types: text, emoji, file attachment, voice note, image/video.
- Markdown support in messages (bold, italic, code blocks, links).
- Link preview (metadata fetched server-side to avoid exposing recipient IP to external sites).

**FR-111: Group Rooms**
- Up to 50 participants.
- Full mesh P2P for rooms ≤ 8. Selective Forwarding Unit (Cloudflare Realtime SFU) for rooms > 8.
- Room admin roles: creator, moderators, members.
- Invite via link or QR code.
- Room join/leave events shown as system messages.
- Persistent room history: optional. If enabled, messages encrypted with a room key stored in member devices.
- Message threading: reply-to chain with UI nesting.
- Reactions: emoji picker; reaction counts aggregated via DO for group rooms.
- Pinned messages (admin only).
- Room name, description, avatar (stored in Durable Object metadata).

**FR-112: Voice & Video Calls**
- 1:1 calls: pure WebRTC P2P, no media server needed.
- Group calls (up to 8 participants): Cloudflare Realtime SFU (TURN + selective forwarding). Cost: $0.05/GB (passed through in Pro tier).
- Adaptive bitrate based on connection quality.
- Noise suppression: WebRTC built-in `noiseSuppression: true`.
- Screen sharing: `getDisplayMedia()` API, full screen or window capture.
- Picture-in-picture mode.
- Call recording: local-only; stored encrypted in `indexedDB`; not available server-side.

**FR-113: Presence & Status**
- Online/Away/DND: broadcast via Durable Object WebSocket heartbeat.
- "Last seen" timestamp: optional, user-configurable.
- Typing indicators: sent only to active conversation peer, not stored.
- Read receipts: optional, user-controlled toggle.

**FR-114: Message Expiry**
- Per-message or per-conversation configurable timer: 1 hour / 24 hours / 7 days / 30 days / never.
- Deletion request broadcast to all peers; client-side enforcement (no server verification — by design).
- "Disappearing messages" mode toggle.

**FR-115: Notifications**
- Web Push notifications (VAPID keys managed by Worker).
- No third-party push infrastructure (no FCM/APNs dependency for web PWA).
- Native push for iOS PWA: iOS 16.4+ Web Push; Android PWA: full support.
- Notification payload: encrypted push (RFC 8291 Web Push encryption); only "new message" signal sent; content never in push payload.

### 10.3 File Sharing in Chat

- Inline file share within any chat or group room.
- Inherits full Phase 1 P2P transfer engine.
- Images and videos rendered inline (thumbnail generated client-side).
- Files appear in a "Files" tab within each conversation (local index only).

---

## 11. Feature Specifications — Phase 3: AI Integration

### 11.1 Architecture Principle — Privacy-Preserving AI

All AI features operate under the following hierarchy:

1. **On-device first** — Use WebAssembly models (e.g., Whisper.cpp WASM, Transformers.js) where latency and model size permit.
2. **Edge inference second** — Cloudflare Workers AI (GPU-backed) for heavier models; user data sent to edge but not persisted beyond the inference call.
3. **No third-party AI APIs** — No OpenAI/Anthropic API calls that would expose user data outside the Cloudflare ecosystem unless user explicitly opts in.

### 11.2 AI Features

**FR-200: Document Summarisation**
- User uploads a PDF, .docx, or .txt file; triggers on-demand (not automatic).
- Phase 3a: Workers AI LLM (Meta Llama 3.1 8B or Mistral) processes the document.
- Summary displayed in a slide-out panel; never stored server-side.
- Available for files received via Sharely or uploaded directly.

**FR-201: Smart File Tagging**
- On file receipt, MIME type + filename analysed on-device.
- Optional: content-based tagging using on-device Transformers.js classifier.
- Tags: document / media / archive / code / spreadsheet / presentation / image / video / audio.
- User can edit/remove tags.
- Tags stored in local `indexedDB` file index.

**FR-202: Semantic File Search**
- Local vector index of file metadata + AI-generated descriptions.
- Query: natural language ("the video from the design review last Tuesday").
- Embedding model: `all-MiniLM-L6-v2` via Transformers.js (on-device).
- If user opts into cloud sync: Cloudflare Vectorize for cross-device search (embeddings only, not file content).

**FR-203: AI Chat Assistant (Sharely AI)**
- Opt-in per room; toggled by room admin.
- Assists with: summarising conversation history, answering questions about shared files, drafting replies.
- Context window: last 50 messages + file metadata (no file content unless user explicitly shares).
- Model: Cloudflare Workers AI (Llama or Mistral).
- User-visible disclaimer: "Sharely AI processes this context at Cloudflare's edge. No content is stored after the response."

**FR-204: Real-Time Translation**
- Message translation on-demand (tap to translate).
- Supported languages: top 25 by global usage (English, Hindi, Spanish, French, Arabic, Portuguese, Russian, Japanese, Korean, German, etc.).
- Model: Workers AI translation model or LibreTranslate WASM for on-device.

**FR-205: Voice Transcription**
- Voice notes and call recordings transcribed locally using Whisper.cpp WASM (tiny.en or medium model).
- Transcription stored in `indexedDB` alongside the audio.
- Searchable via FR-202.

**FR-206: Spam & Malware Heuristics**
- Transfer metadata analysed on-device: filename, extension, MIME type, file size anomalies.
- Suspicion score displayed to receiver before download.
- No file content scanning (would break E2E guarantee).
- User warned for: double extensions (.pdf.exe), suspiciously small "video" files, known malware filename patterns.

---

## 12. UI/UX Design System — Neobrutalism

### 12.1 Design Philosophy

Sharely's UI is unapologetically raw and functional. Neobrutalism is chosen not as a gimmick but as a philosophical statement: _we do not hide what we are_. The UI's honesty mirrors the product's encryption promise — no veneer, no obfuscation. Every element is structurally visible.

Neobrutalism principles applied to Sharely:

- **Bold borders** — All interactive elements have a 2–4px solid black border. Cards use 4–6px offset hard box shadows (`4px 4px 0px #000`).
- **High-contrast colour** — Primary palette: stark white (`#FFFFFF`) + jet black (`#0A0A0A`) + electric yellow (`#FFEE00`) + acid green (`#00FF88`) + hot coral (`#FF4444`).
- **Structural typography** — Space Grotesk (rejected per guidelines) → use **Syne** for display headings (brutalist and technical) + **IBM Plex Mono** for all data, codes, file names, and status text (reinforces the technical, transparent character of the product).
- **Raw interactions** — Buttons depress visually (box-shadow collapses to 2px on `:active`). No smooth fades — instant state changes. Click feedback is physical.
- **Grid-honest layouts** — Content sits on a visible 8px grid. Columns align. Nothing floats arbitrarily.
- **Functional ornamentation** — Decorative elements must carry information: transfer speed visualised as an animated bar chart, not a spinning loader.

### 12.2 Colour Tokens

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#FAFAFA` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, panels |
| `--color-border` | `#0A0A0A` | All borders and box shadows |
| `--color-accent-primary` | `#FFEE00` | CTAs, highlights, active states |
| `--color-accent-success` | `#00FF88` | Transfer complete, connected status |
| `--color-accent-danger` | `#FF4444` | Errors, disconnected, cancel |
| `--color-accent-info` | `#3B82F6` | Informational badges, AI elements |
| `--color-text-primary` | `#0A0A0A` | Body text |
| `--color-text-secondary` | `#5A5A5A` | Metadata, timestamps |
| `--color-text-on-accent` | `#0A0A0A` | Text on yellow accent (black maintains contrast) |

### 12.3 Typography Scale

| Role | Font | Size | Weight |
|---|---|---|---|
| Hero headline | Syne | 64px / 4rem | 800 |
| Section header | Syne | 32px / 2rem | 700 |
| Card title | Syne | 20px / 1.25rem | 700 |
| Body | Syne | 16px / 1rem | 400 |
| Monospace data | IBM Plex Mono | 14px / 0.875rem | 400 |
| Code / hashes | IBM Plex Mono | 13px / 0.8125rem | 400 |
| Label / tag | Syne | 12px / 0.75rem | 600 uppercase |

### 12.4 Component Library

**Button:**
```
Default: White bg, black border 2px, black shadow 4px 4px 0px
Hover:   Shadow shifts to 6px 6px 0px (lifts)
Active:  Shadow 1px 1px 0px (presses in)
Primary: Yellow (#FFEE00) bg
Danger:  Coral (#FF4444) bg
```

**Card:**
```
White bg
Black border: 2px solid
Box shadow:   5px 5px 0px #0A0A0A
Padding:      24px
Border radius: 0 (flat corners — brutalist)
```

**Input:**
```
White bg
Black border: 2px solid
Focus ring:   Yellow 3px outline (no border-radius)
Placeholder:  Gray text, IBM Plex Mono
```

**Progress Bar (Transfer):**
```
Track: Light gray, black border 2px
Fill:  Acid green animated with CSS @keyframes width transition
Speed indicator: IBM Plex Mono overlay text (e.g., "4.2 MB/s")
```

**Room Code Display:**
```
Giant IBM Plex Mono, 48px bold
Character spacing: 0.2em
Grouped: XXX-XXX with a dash
Background: Yellow accent card
Black border 4px, shadow 8px 8px 0px
```

### 12.5 Screen Layouts

**Homepage / Landing:**
- Hero: large heading "Share anything. Privately." + large room code input + two CTAs (Send / Receive)
- Below fold: Features grid, security explainer, comparison table
- Footer: minimal, black background, white text, GitHub link, audit link

**Transfer Screen (Sender):**
- Left panel: file drop zone (dashed border becomes solid on drag-over, yellow flash on drop)
- Right panel: room code + QR code + connection status indicator (dot: red/yellow/green)
- Bottom bar: transfer queue with per-file progress bars

**Transfer Screen (Receiver):**
- Incoming file list with file type icons (monochrome SVGs)
- Per-file download button (large, neobrutalist)
- Aggregate "Save All" button (yellow CTA)
- Connection quality indicator (ping, throughput)

**Chat Interface (Phase 2):**
- Left sidebar: contact list / room list with unread badge counts
- Center: message thread, neobrutalist bubble design (sender: yellow bg, receiver: white bg, black border)
- Right sidebar: file tab, member list (collapsible)
- Bottom bar: message input + file attach + voice note + emoji picker

### 12.6 Motion & Animation

- Page transitions: instant (no crossfades). Content loads with a 100ms stagger on list items.
- Transfer progress bar: CSS `transition: width 200ms linear`.
- Connection status dot: CSS pulse animation (scale 1→1.3→1, 2s repeat) in success green.
- Button press: CSS `transform: translate(3px, 3px)` on `:active` matching shadow collapse.
- Drag-over state: yellow border flash, dashed → solid, `transform: scale(1.02)`.
- Error shake: `@keyframes shake` (3 quick horizontal oscillations, 300ms).

### 12.7 Accessibility

- WCAG 2.2 AA compliance minimum; target AAA for critical flows.
- Black on yellow: contrast ratio 12.6:1 (far exceeds 4.5:1 AA).
- All interactive elements keyboard navigable; focus states: 3px yellow outline.
- `aria-live` regions for transfer status updates.
- Screen reader friendly: all icons have `aria-label`; progress bars use `role="progressbar"` with `aria-valuenow`.
- `prefers-reduced-motion`: all animations disabled; progress shown numerically.
- `prefers-color-scheme: dark`: dark neobrutalism variant (black bg, white borders, yellow + green accents).

---

## 13. Tech Stack & Cloudflare Deployment

### 13.1 Frontend

| Layer | Technology | Rationale |
|---|---|---|
| Framework | React 19 + Vite | Mature ecosystem, fast HMR, tree-shaking |
| Language | TypeScript 5.x | Type safety for crypto and WebRTC types |
| Styling | Tailwind CSS 4 + CSS Variables | Utility-first with design token integration |
| P2P Engine | `simple-peer` (WebRTC abstraction) + native `RTCPeerConnection` | Simple-peer for initial speed; native API for advanced control |
| Crypto | Web Crypto API (`SubtleCrypto`) | Browser-native, hardware-accelerated, no library dependency |
| State | Zustand | Minimal, non-opinionated store |
| Storage | `idb` (IndexedDB wrapper) | Async, structured, encrypted local storage |
| PWA | Vite PWA plugin + Workbox | Offline support, installable |
| Testing | Vitest + Playwright | Unit and E2E tests |

### 13.2 Backend (Cloudflare-only)

| Service | Usage |
|---|---|
| **Cloudflare Workers** | API gateway, authentication middleware, rate limiting, room code generation, KV operations |
| **Durable Objects** | One DO per active room — WebSocket hub for signalling (SDP/ICE relay), presence state, typing indicators |
| **Workers KV** | Room code → DO stub mapping (TTL-based), session tokens, feature flags |
| **Cloudflare D1** | User accounts (Phase 2), room metadata archive, audit log (anonymised) |
| **Cloudflare R2** | Encrypted relay chunk storage (fallback only); link-based async transfer temporary storage |
| **Cloudflare Queues** | Async notification delivery, relay cleanup jobs |
| **Workers AI** | LLM inference (Llama 3.1 8B), transcription (Whisper), translation |
| **Vectorize** | Semantic file search vector store (Phase 3) |
| **Cloudflare STUN** | `stun.cloudflare.com` — free ICE candidate discovery |
| **Cloudflare TURN/SFU** | Cloudflare Realtime — $0.05/GB relay fallback and group call media forwarding |
| **Cloudflare Pages** | Static frontend hosting + edge-rendered routes |
| **Workers Analytics Engine** | Custom event tracking without third-party analytics |
| **Cloudflare Turnstile** | Bot protection on room creation without CAPTCHA UX friction |

### 13.3 Backend Language

TypeScript throughout, targeting Cloudflare's `workerd` runtime. No Node.js-specific APIs. Uses Hono framework for routing within Workers.

### 13.4 Development & Deployment Pipeline

```
Local Dev:     Wrangler Dev (local emulation of Workers + DO + D1 + KV)
CI/CD:         GitHub Actions → Wrangler Deploy → Cloudflare Pages
Environments:  dev.sharely.app / staging.sharely.app / sharely.app
Testing:       Vitest (unit) + Playwright (E2E) + Wrangler test environment
Secrets:       Cloudflare Workers Secrets (never in wrangler.toml)
Monorepo:      Turborepo — packages: /apps/web, /packages/crypto, /packages/p2p, /packages/ui
```

### 13.5 Third-Party Dependencies (Minimal Policy)

Sharely maintains a strict minimal-dependency policy. Any new dependency requires:

- Security audit (Snyk / npm audit)
- License review (MIT/Apache 2.0 preferred)
- Bundle size impact assessment (< 10 KB addition requires no review; > 50 KB requires architecture review)

Critical dependencies NOT used:
- No Firebase / FCM
- No Segment / Mixpanel / GA (Workers Analytics Engine instead)
- No Stripe SDK (use Stripe Checkout hosted page with webhook)
- No AWS SDK (Cloudflare R2 uses S3-compatible API)

---

## 14. API Design

### 14.1 REST Endpoints (Workers)

```
POST   /api/rooms                  Create a new room → { roomCode, doId, ttl }
GET    /api/rooms/:code            Validate room exists → { exists, peerCount, ttl }
DELETE /api/rooms/:code            Destroy room (sender only, authenticated by room token)

POST   /api/users                  Create identity (Phase 2) → { userId, publicKey }
GET    /api/users/:userId          Fetch public key + display name
PUT    /api/users/:userId/profile  Update display name / avatar hash

POST   /api/relay/upload           Upload encrypted chunk to R2 → { objectKey, expiresAt }
GET    /api/relay/:objectKey       Download encrypted chunk from R2

POST   /api/notifications/subscribe  Register Web Push subscription
DELETE /api/notifications/subscribe  Unsubscribe

POST   /api/ai/summarise           Trigger document summarisation (authenticated)
POST   /api/ai/translate           Translate message text
```

### 14.2 WebSocket Protocol (Durable Object)

Messages are JSON-encoded. All payloads containing signal data are opaque to the server.

```typescript
// Client → Server
type SignalMessage =
  | { type: 'join';           roomCode: string; peerId: string; publicKey: string }
  | { type: 'offer';          to: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer';         to: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate';  to: string; candidate: RTCIceCandidateInit }
  | { type: 'leave' }
  | { type: 'ping' }

// Server → Client
type SignalResponse =
  | { type: 'peer-joined';  peerId: string; publicKey: string; peerCount: number }
  | { type: 'peer-left';    peerId: string }
  | { type: 'offer';        from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer';       from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate';from: string; candidate: RTCIceCandidateInit }
  | { type: 'pong' }
  | { type: 'error';        code: string; message: string }
```

### 14.3 File Transfer Wire Protocol (P2P DataChannel)

```typescript
// Control messages (small, JSON-encoded)
type TransferControl =
  | { type: 'file-offer';    fileId: string; name: string; size: number; mime: string; chunks: number; hash: string }
  | { type: 'file-accept';   fileId: string }
  | { type: 'file-reject';   fileId: string; reason: string }
  | { type: 'file-complete'; fileId: string; hash: string }
  | { type: 'file-cancel';   fileId: string }
  | { type: 'ack';           fileId: string; chunkIndex: number }

// Data messages (binary, ArrayBuffer)
// Layout: [4 bytes: fileId hash] [4 bytes: chunk index] [16 bytes: GCM nonce] [N bytes: encrypted chunk data]
```

---

## 15. Data Model

### 15.1 Server-Side (Cloudflare D1 — Phase 2)

```sql
-- Users (pseudonymous)
CREATE TABLE users (
  id            TEXT PRIMARY KEY,         -- UUID v4
  public_key    TEXT NOT NULL,            -- X25519 public key, base64
  display_name  TEXT,                     -- User-set, unverified
  avatar_hash   TEXT,                     -- Hash of avatar; image stored in R2 or IPFS
  created_at    INTEGER NOT NULL,         -- Unix timestamp
  last_seen     INTEGER                   -- Updated on auth; nullable if user opts out
);

-- Rooms (ephemeral, cleaned up by Queues worker)
CREATE TABLE rooms (
  code          TEXT PRIMARY KEY,         -- 6-char alphanumeric
  do_id         TEXT NOT NULL,            -- Durable Object stub ID
  creator_id    TEXT,                     -- NULL for anonymous rooms
  created_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,
  peer_count    INTEGER DEFAULT 0
);

-- Relay Objects (encrypted file chunks in R2)
CREATE TABLE relay_objects (
  object_key    TEXT PRIMARY KEY,         -- R2 object path
  room_code     TEXT,
  created_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,
  downloaded    INTEGER DEFAULT 0         -- Boolean: 0/1
);
```

### 15.2 Client-Side (IndexedDB — All Phases)

```typescript
interface LocalTransfer {
  id:          string;          // UUID
  direction:   'sent' | 'received';
  fileName:    string;
  fileSize:    number;
  mimeType:    string;
  hash:        string;          // SHA-256 of file
  roomCode:    string;
  timestamp:   number;
  tags:        string[];        // AI-generated or user-set
  aiSummary?:  string;          // Cached AI summary
  vectors?:    Float32Array;    // Local embedding for semantic search
}

interface LocalContact {
  id:          string;
  publicKey:   string;          // X25519 public key
  displayName: string;
  avatarHash?: string;
  addedAt:     number;
  notes?:      string;
}

interface LocalMessage {
  id:          string;
  conversationId: string;       // Contact ID or room ID
  content:     Uint8Array;      // Encrypted with contact's key
  timestamp:   number;
  expiresAt?:  number;
  status:      'sent' | 'delivered' | 'read';
  type:        'text' | 'file' | 'voice' | 'system';
}
```

---

## 16. Performance & Scalability Requirements

### 16.1 Throughput Targets

| Scenario | Target |
|---|---|
| P2P transfer speed on 100 Mbps connection | ≥ 85 Mbps (limited by WebRTC overhead, not Sharely) |
| Time-to-connected (same city, STUN) | < 2 seconds (p50), < 4 seconds (p95) |
| Time-to-connected (cross-continent, TURN) | < 6 seconds (p95) |
| Signalling message relay latency | < 50ms (edge-to-edge via DO) |
| API response time (room create/validate) | < 100ms (p99) |
| Chunk processing overhead (encrypt + transmit) | < 5% vs raw transfer |

### 16.2 Scalability

- Cloudflare Workers: auto-scales to millions of requests/day globally. No config needed.
- Durable Objects: one per room; horizontally partitioned by design. 300+ PoPs.
- R2: effectively unlimited storage; no egress cost.
- D1: handles up to 100GB per database; sharding strategy prepared for > 1M users.
- Durable Object Hibernation API used throughout to minimise compute cost during idle periods.

### 16.3 Cost Model (Cloudflare Workers Paid Plan — $5/month)

| Service | Free Tier | Paid (estimated at 10K DAU) |
|---|---|---|
| Workers Requests | 100K/day | ~$0.50/day |
| Durable Objects | Compute + storage | ~$2/day (Hibernation reduces by ~80%) |
| R2 Storage (relay) | 10 GB | ~$0.015/GB/month |
| R2 Egress | Free | Free (Cloudflare guarantee) |
| TURN bandwidth | $0.05/GB | ~$50/month (estimate 1TB relay) |
| Workers AI | 10K neurons/day free | Variable — ~$2/day at scale |
| D1 | 5M reads/day free | ~$0.30/day at 10K DAU |
| **Total (10K DAU estimate)** | — | **~$150–200/month** |

At 1,000 paying Pro users ($8/month = $8,000 MRR), infrastructure is comfortably covered.

---

## 17. Accessibility & Internationalisation

### 17.1 Accessibility Standards

- WCAG 2.2 AA mandatory; AAA for file transfer core flow.
- Full keyboard navigation: Tab order, Enter/Space activation, Escape to dismiss.
- ARIA roles: `progressbar`, `status`, `log`, `dialog`, `alert`.
- Screen reader tested on: NVDA + Chrome (Windows), VoiceOver + Safari (macOS/iOS), TalkBack (Android).
- Colour-blind safe: all status indicators use both colour AND shape/text (never colour alone).

### 17.2 Internationalisation (i18n)

- i18n framework: `react-i18next`.
- Phase 1 languages: English (en), Hindi (hi), Spanish (es), French (fr), Arabic (ar, RTL).
- Phase 2 languages: Portuguese, Russian, Japanese, Korean, German, Simplified Chinese.
- All date/time: locale-aware via `Intl.DateTimeFormat`.
- File sizes: locale-aware via `Intl.NumberFormat`.
- RTL support: CSS `direction: rtl` + Tailwind `rtl:` variant.
- Translations managed in `/locales/{lang}/common.json`; community contributions via Crowdin.

---

## 18. Monetisation Strategy

### 18.1 Pricing Tiers

**Free — "Sharely Open"**
- Unlimited P2P file transfers (no size limit)
- Basic E2E encryption
- 1 active room at a time
- File relay (fallback): 1 GB temporary storage
- Chat: 1:1 DMs (Phase 2)
- Group rooms: up to 5 members
- AI: smart tagging only (Phase 3)

**Pro — "Sharely Pro" — $8/month (or $72/year)**
- Everything in Free
- Simultaneous rooms: unlimited
- File relay storage: 50 GB
- Group rooms: up to 50 members
- Voice/video calls: unlimited
- Group calls: up to 8 participants
- AI: document summarisation, semantic search, translation
- Custom room aliases (e.g., `sharely.app/r/myteam`)
- Transfer analytics (speed history, data transferred)
- Priority TURN routing
- Export transfer history (CSV/JSON)

**Teams — "Sharely Teams" — $18/seat/month (min 3 seats)**
- Everything in Pro
- Shared team workspace with persistent rooms
- Admin dashboard: user management, room history, audit log
- SSO integration (SAML 2.0 / OIDC)
- File retention policy controls
- SLA: 99.9% uptime guarantee
- Dedicated support (< 4 hour response)
- Compliance exports (SOC 2-ready audit log)

**Enterprise — Custom pricing**
- Custom deployment (Cloudflare dedicated Workers for Enterprise)
- Self-managed keys (BYOK)
- Custom data retention policies
- Volume discount
- Annual contracts
- Security audit report sharing
- Custom AI model fine-tuning for organisation vocabulary

### 18.2 Revenue Projections

| Year | Users (Total) | Paying (Conversion %) | MRR | ARR |
|---|---|---|---|---|
| Y1 (MVP live) | 20,000 | 400 (2%) | $3,200 | $38,400 |
| Y2 | 150,000 | 4,500 (3%) | $36,000 | $432,000 |
| Y3 | 500,000 | 20,000 (4%) | $200,000 | $2,400,000 |

Assumptions: Blended ARPU $10/month (mix of Pro + Teams); viral coefficient 1.3 (each active user refers 1.3 new users).

### 18.3 Growth Loop

```
User shares file → Recipient experiences Sharely for first time
    → "Powered by Sharely" subtle badge on receive page (can be disabled in Pro)
    → Recipient converts to Free user → organic viral loop
```

---

## 19. Analytics & Observability

### 19.1 Product Analytics

Using Cloudflare Workers Analytics Engine (no third-party; zero data sold):

- Events tracked: room_created, room_joined, transfer_started, transfer_completed, transfer_failed, transfer_size_bytes, connection_type (P2P_direct/TURN/relay), time_to_connected_ms.
- Never tracked: file names, file content, user messages, IP addresses (hashed only for rate limiting).
- Dashboard: custom Grafana dashboard querying Analytics Engine GraphQL.

### 19.2 Error Monitoring

- Cloudflare Workers built-in error logs + `console.error` sampling.
- Sentry (self-hosted on a cheap VPS) for frontend JS errors — no PII in error payloads.
- Alert thresholds: transfer failure rate > 5% → PagerDuty alert.

### 19.3 Performance Monitoring

- Real User Monitoring: Web Vitals via `web-vitals` library → posted to Workers Analytics Engine.
- Synthetic monitoring: Playwright tests running hourly on CI against staging.
- WebRTC stats: `getStats()` API used to report connection quality; anonymised aggregate stored per session.

---

## 20. Legal, Compliance & Privacy

### 20.1 Privacy by Architecture

Sharely's core privacy claim is architectural, not policy-based:

- **No file content on servers** — enforced by the P2P architecture, not a policy promise.
- **No message content on servers** — enforced by E2E encryption.
- **Minimal server metadata** — room codes (ephemeral), user pseudonymous IDs (optional), relay object keys (expiring).

### 20.2 GDPR / Data Privacy Compliance

- Data Processing Agreement (DPA) available for Teams/Enterprise customers.
- Right to erasure: user deletes account → D1 rows deleted + KV keys purged + R2 relay objects deleted. Immediate, automated.
- Data minimisation: no analytics tied to individuals; only aggregated, anonymised event counts.
- Privacy policy written in plain language (Flesch-Kincaid Grade ≤ 8).
- DPO appointed at 10,000 EU users milestone.
- Privacy-by-design documented and maintained as a living technical specification.

### 20.3 Terms of Service

- Prohibited uses: malware distribution, CSAM, illegal file distribution.
- Sharely cannot technically view content; but account-level bans enforced on credible abuse reports.
- Law enforcement: Sharely can only provide minimal metadata (room creation timestamps, relay object keys); cannot provide file content or messages.
- DMCA takedown policy: published; relay objects can be revoked; P2P transfers cannot be revoked.

### 20.4 Export Control

- ECDH/AES-256 encryption: compliant with US EAR (Export Administration Regulations) under ENC exception for publicly available software.
- No intentional sale or export to OFAC-sanctioned countries.

### 20.5 Regulatory Watch Items

- **EU AI Act (2026 application):** Sharely AI features must be classified; expected to fall under "minimal risk" (assistive tools with no prohibited use cases). Documentation required.
- **Online Safety Act (UK):** No user-generated public content; Sharely is 1:1/small group private comms. Likely exempt from duty-of-care provisions.
- **EARN IT Act (US, proposed):** Monitored; E2E encryption architecture is compliant with current law; legal counsel retained for regulatory monitoring.

---

## 21. Go-to-Market Strategy

### 21.1 Phase 1 Launch (Q3 2026)

**Target channel: Developer and privacy community**

- **Product Hunt launch:** Coordinated Day 1 push. Goal: Top 5 Product of the Day.
- **Hacker News "Show HN":** Technical post emphasising the Cloudflare Workers + Durable Objects architecture.
- **Reddit:** r/privacy, r/selfhosted, r/webdev, r/sysadmin.
- **Twitter/X + Bluesky:** Tech founder + privacy advocate outreach. Influencer gifting (Pro accounts for prominent privacy advocates).
- **GitHub:** Open-source the P2P engine and crypto layer. Stars as a distribution metric.
- **Dev.to + Hashnode:** Technical deep-dive posts on WebRTC E2E file transfer, Cloudflare Durable Objects architecture.

**Phase 1 success targets:** 10,000 users in first 30 days, 50,000 by Day 90.

### 21.2 Phase 2 Launch (Q1 2027)

**Target channel: Remote teams + indie creators**

- **Positioning shift:** "The private alternative to Slack + WeTransfer, in one tab."
- **Integration partnerships:** Notion (link unfurl), Linear (file attach), Obsidian (plugin).
- **Content marketing:** "How we built end-to-end encrypted group chat with zero server storage" — engineering blog series.
- **YouTube:** Demo videos, comparison videos vs Telegram/Signal/WeTransfer.
- **AppSumo:** One-time deal to seed paying user base.

### 21.3 Phase 3 Launch (Q3 2027)

**Target channel: Knowledge workers + enterprise**

- **Positioning:** "AI-powered private workspace — your files, your conversations, your AI."
- **Enterprise outreach:** Direct sales to legal, healthcare, and financial sectors where data sovereignty is regulated.
- **SOC 2 Type II certification:** Unlock enterprise procurement.
- **Conference presence:** DEF CON, Black Hat (security positioning), Web Summit.

---

## 22. Success Metrics & KPIs

### 22.1 Phase 1 KPIs

| Metric | Target (60 days) | Target (6 months) |
|---|---|---|
| Total transfers completed | 10,000 | 100,000 |
| Unique senders | 5,000 | 50,000 |
| P2P direct connection rate | ≥ 92% | ≥ 94% |
| Transfer failure rate | < 2% | < 1% |
| Net Promoter Score | ≥ 50 | ≥ 60 |
| Page Lighthouse score (mobile) | ≥ 90 | ≥ 93 |
| GitHub stars (open-source engine) | 500 | 2,000 |

### 22.2 Phase 2 KPIs

| Metric | Target (3 months post-launch) |
|---|---|
| Registered identities | 50,000 |
| Daily Active Users (DAU) | 5,000 |
| DAU/MAU ratio | ≥ 30% |
| D30 retention | ≥ 35% |
| Messages sent per DAU per day | ≥ 15 |
| Files transferred per DAU per day | ≥ 2 |
| MRR | ≥ $15,000 |

### 22.3 Phase 3 KPIs

| Metric | Target (3 months post-launch) |
|---|---|
| AI feature activation rate (% of users) | ≥ 25% |
| Free-to-Pro conversion uplift from AI | +1.5% vs pre-AI baseline |
| Summarisation queries per DAU | ≥ 0.5 |
| Enterprise leads generated | ≥ 20 |
| ARR | ≥ $500,000 |

---

## 23. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| WebRTC blocked by corporate firewalls | Medium | High | TURN relay fallback; HTTP upgrade fallback; documented IT allowlist |
| Cloudflare pricing changes (Durable Objects) | Low | High | Architecture designed to be multi-cloud portable; Fastly Workers alternative validated |
| Browser WebRTC API deprecation | Very Low | Critical | Standards-tracked; backed by W3C + IETF; contingency is native app (Tauri) |
| Regulatory ban on E2E encryption (UK OSA, AU TOLA) | Medium | High | Legal counsel; architecture audit; EU entity for data residency |
| Abuse: malware distribution via relay | Medium | High | FR-206 heuristics; relay-object revocation; abuse@ email; hash-based blocklist of known malware |
| Competitor (Signal, Telegram) copies feature | High | Medium | Speed to market; neobrutalist brand moat; AI differentiation; community network effect |
| TURN costs exceed projections | Medium | Medium | User-level TURN usage quotas; Pro tier includes TURN; Free tier TURN capped at 500 MB/month |
| Low free-to-paid conversion | Medium | High | Aggressive freemium gate on team features; AI features locked to Pro; usage-based nudges |
| Security vulnerability in crypto layer | Low | Critical | Open-source audit; bug bounty; sandboxed crypto module with no external dependencies |
| Mobile WebRTC battery drain complaints | Medium | Low | Adaptive chunk size reduces DataChannel CPU; service worker used for background transfers |

---

## 24. Open Questions

1. **Identity Model Depth:** Should Phase 2 support federated identity (ActivityPub / AT Protocol) to enable cross-platform contact discovery? Trade-off: complexity vs network effect.

2. **Persistent Group Room History:** If users want optional persistent message history, what is the right encrypted storage model? Options: client-side (IndexedDB, synced via E2E-encrypted blob to R2), or Matrix-compatible homeserver sidecar.

3. **Mobile Native Apps:** Web PWA first is the plan. But iOS WebRTC reliability is historically poor. Should React Native (Expo) apps be in the Phase 2 scope or Phase 3?

4. **Post-Quantum Timeline:** CRYSTALS-Kyber hybrid is in Phase 3 roadmap. Given Signal's 2025 PQXDH announcement, should this be pulled forward to Phase 2?

5. **Self-Hosting Option:** Many privacy-focused users want to self-host the signalling server. Should Sharely publish a one-click Cloudflare deploy (Deploy to Cloudflare button) for the signalling layer? Risk: reduces lock-in; benefit: massive trust-building.

6. **Relay Persistence for Power Users:** Some users request file "vaults" — persistent encrypted storage. This is fundamentally different from Sharely's zero-storage promise. Should this be a separate product (Sharely Vault) or an opt-in paid feature with explicit privacy trade-off disclosure?

7. **AI Model Strategy:** Workers AI (Cloudflare-hosted Llama/Mistral) vs partnering with Anthropic Claude API for higher quality. Trade-off: Claude API exposes user data to Anthropic; Workers AI keeps it in Cloudflare's boundary.

8. **Pricing Elasticity:** Is $8/month Pro optimal for the privacy-tech demographic? Research suggests $5–12 is the sweet spot. A/B test at launch.

---

## Appendix A — Glossary

| Term | Definition |
|---|---|
| WebRTC | Web Real-Time Communication — browser API for P2P audio, video, and data |
| DTLS | Datagram Transport Layer Security — encryption protocol used by WebRTC DataChannels |
| SRTP | Secure Real-Time Transport Protocol — encrypts WebRTC audio/video streams |
| ICE | Interactive Connectivity Establishment — protocol for finding P2P network path |
| STUN | Session Traversal Utilities for NAT — discovers public IP for ICE |
| TURN | Traversal Using Relays around NAT — relay server when direct P2P fails |
| ECDH | Elliptic-Curve Diffie-Hellman — key agreement protocol for session key derivation |
| AES-GCM | AES Galois/Counter Mode — authenticated symmetric encryption |
| SDP | Session Description Protocol — format for WebRTC connection parameters |
| Durable Object | Cloudflare stateful compute unit — single-threaded, globally distributed |
| SAS | Short Authentication String — human-verifiable key fingerprint |
| E2EE | End-to-End Encryption — content encrypted on sender's device; only decryptable by recipient |
| PQXDH | Post-Quantum Extended Diffie-Hellman — Signal's hybrid classical/quantum-resistant key agreement |
| SFU | Selective Forwarding Unit — media server that routes WebRTC streams without decoding |
| PWA | Progressive Web App — web app installable as native-like app |
| DID | Decentralised Identifier — W3C standard for cryptographic identity without central authority |
| VAPID | Voluntary Application Server Identification — Web Push authentication standard |

## Appendix B — References

- Cloudflare Durable Objects Documentation: https://developers.cloudflare.com/durable-objects/
- Cloudflare Realtime (WebRTC SFU): https://developers.cloudflare.com/realtime/
- WebRTC Security Model (Rescorla, IETF RFC 8826): https://datatracker.ietf.org/doc/rfc8826/
- Signal Protocol Specification: https://signal.org/docs/
- NIST Post-Quantum Cryptography Standards (2024): https://csrc.nist.gov/pqcrypto
- Nielsen Norman Group — Neobrutalism UX: https://www.nngroup.com/articles/neobrutalism/
- WCAG 2.2 Guidelines: https://www.w3.org/TR/WCAG22/

---

*Document Owner: Product Team — Sharely*
*Version: 1.0*
*Last Updated: May 2026*
*Next Review: August 2026*
*Status: Approved for Development*
