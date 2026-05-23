import { Hono } from "hono";
import { cors } from "hono/cors";
import { ROOM_TTL_SECONDS } from "../shared/constants";
import type { CreateRoomResponse, RelayUploadResponse, RoomRecord, ValidateRoomResponse } from "../shared/protocol";
import { generateRoomCode, isRoomCode, makeToken, normalizeRoomCode } from "../shared/room";
import { SignalRoom } from "./signal-room";
import type { Env } from "./types";

export { SignalRoom };

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors());

app.get("/api/health", (c) => c.json({ ok: true, service: "sharely", version: 1 }));

app.post("/api/rooms", async (c) => {
  const roomCode = await reserveRoomCode(c.env);
  const id = c.env.SIGNAL_ROOM.idFromName(roomCode);
  const token = makeToken();
  const now = Date.now();
  const record: RoomRecord = {
    roomCode,
    doName: id.toString(),
    tokenHash: await sha256(token),
    createdAt: now,
    expiresAt: now + ROOM_TTL_SECONDS * 1000
  };

  await c.env.ROOM_INDEX.put(roomCode, JSON.stringify(record), { expirationTtl: ROOM_TTL_SECONDS });
  writeEvent(c.env, "room_created", roomCode);

  const url = new URL(c.req.url);
  const response: CreateRoomResponse = {
    roomCode,
    roomToken: token,
    shareUrl: `${url.origin}/r/${roomCode}`,
    ttl: ROOM_TTL_SECONDS
  };
  return c.json(response, 201);
});

app.get("/api/rooms/:code", async (c) => {
  const roomCode = normalizeRoomCode(c.req.param("code"));
  if (!isRoomCode(roomCode)) {
    return c.json({ exists: false, peerCount: 0, ttl: 0 } satisfies ValidateRoomResponse, 400);
  }

  const record = await getRoom(c.env, roomCode);
  if (!record) {
    return c.json({ exists: false, peerCount: 0, ttl: 0 } satisfies ValidateRoomResponse);
  }

  const ttl = Math.max(0, Math.ceil((record.expiresAt - Date.now()) / 1000));
  const response: ValidateRoomResponse = { exists: true, peerCount: 0, ttl };
  return c.json(response);
});

app.delete("/api/rooms/:code", async (c) => {
  const roomCode = normalizeRoomCode(c.req.param("code"));
  const authorization = c.req.header("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  const record = await getRoom(c.env, roomCode);
  if (!record) return c.json({ ok: true });

  if ((await sha256(token)) !== record.tokenHash) {
    return c.json({ error: "Unauthorized room delete" }, 401);
  }

  await c.env.ROOM_INDEX.delete(roomCode);
  writeEvent(c.env, "room_deleted", roomCode);
  return c.json({ ok: true });
});

app.get("/api/rooms/:code/socket", async (c) => {
  const roomCode = normalizeRoomCode(c.req.param("code"));
  const record = await getRoom(c.env, roomCode);
  if (!record) return c.text("Room not found", 404);

  const id = c.env.SIGNAL_ROOM.idFromName(roomCode);
  return c.env.SIGNAL_ROOM.get(id).fetch(c.req.raw);
});

app.post("/api/relay/upload", async (c) => {
  const roomCode = normalizeRoomCode(c.req.query("room") ?? "");
  if (!isRoomCode(roomCode)) return c.json({ error: "Invalid room" }, 400);
  if (!c.req.header("X-Sharely-Encrypted")) {
    return c.json({ error: "Relay chunks must be encrypted client-side" }, 400);
  }

  const body = await c.req.arrayBuffer();
  const objectKey = `${roomCode}/${crypto.randomUUID()}.bin`;
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  await c.env.RELAY_BUCKET.put(objectKey, body, {
    customMetadata: { roomCode, encrypted: "true", expiresAt: String(expiresAt) }
  });
  writeEvent(c.env, "relay_uploaded", roomCode);
  return c.json({ objectKey, expiresAt } satisfies RelayUploadResponse, 201);
});

app.get("/api/relay/*", async (c) => {
  const object = await c.env.RELAY_BUCKET.get(c.req.path.replace("/api/relay/", ""));
  if (!object) return c.text("Not found", 404);
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "no-store"
    }
  });
});

app.get("*", async (c) => {
  if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req.raw);
  return c.text("Sharely worker is running. Build assets for the web app.", 200);
});

export default app;

async function reserveRoomCode(env: Env): Promise<string> {
  for (let attempts = 0; attempts < 8; attempts += 1) {
    const code = generateRoomCode();
    if (!(await env.ROOM_INDEX.get(code))) return code;
  }
  throw new Error("Unable to reserve a room code");
}

async function getRoom(env: Env, roomCode: string): Promise<RoomRecord | null> {
  const raw = await env.ROOM_INDEX.get(roomCode);
  if (!raw) return null;
  const record = JSON.parse(raw) as RoomRecord;
  if (record.expiresAt <= Date.now()) {
    await env.ROOM_INDEX.delete(roomCode);
    return null;
  }
  return record;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function writeEvent(env: Env, event: string, roomCode: string): void {
  env.ANALYTICS?.writeDataPoint({
    blobs: [event, roomCode],
    doubles: [Date.now()],
    indexes: [roomCode]
  });
}
