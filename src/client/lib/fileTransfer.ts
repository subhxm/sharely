import { CHUNK_SIZE_BYTES } from "../../shared/constants";
import type { ChatMessage, TransferControl } from "../../shared/protocol";
import { decryptChunk, encryptChunk, sha256Hex } from "./crypto";

export interface TransferProgress {
  fileId: string;
  fileName: string;
  totalBytes: number;
  sentBytes: number;
  receivedBytes: number;
  speed: number;
  eta: number;
  state: "idle" | "offered" | "transferring" | "paused" | "complete" | "failed" | "cancelled";
}

export interface TransferRuntime {
  pause(): void;
  resume(): void;
  cancel(): void;
  sendFiles(files: File[]): Promise<void>;
  sendChatMessage(body: string): ChatMessage;
  handleMessage(data: string | ArrayBuffer): Promise<void>;
}

type ProgressHandler = (progress: TransferProgress) => void;
type DownloadHandler = (file: Blob, name: string, hash: string) => void;
type ChatHandler = (message: ChatMessage) => void;

interface IncomingFile {
  meta: Extract<TransferControl, { type: "file-offer" }>;
  chunks: ArrayBuffer[];
  receivedBytes: number;
  startedAt: number;
}

export function createTransferRuntime(
  channel: RTCDataChannel,
  aesKey: CryptoKey,
  onProgress: ProgressHandler,
  onDownload: DownloadHandler,
  onChatMessage: ChatHandler
): TransferRuntime {
  let paused = false;
  let cancelled = false;
  const incoming = new Map<string, IncomingFile>();

  async function sendFiles(files: File[]): Promise<void> {
    for (const file of files) {
      if (cancelled) return;
      const fileId = crypto.randomUUID();
      const hash = await sha256Hex(file);
      const chunks = Math.ceil(file.size / CHUNK_SIZE_BYTES);
      sendControl({ type: "file-offer", fileId, name: file.name, size: file.size, mime: file.type, chunks, hash });
      await waitForBufferedAmount(channel);

      const startedAt = performance.now();
      let sentBytes = 0;
      for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex += 1) {
        while (paused) await sleep(150);
        if (cancelled) {
          sendControl({ type: "file-cancel", fileId });
          return;
        }
        const start = chunkIndex * CHUNK_SIZE_BYTES;
        const chunk = await file.slice(start, start + CHUNK_SIZE_BYTES).arrayBuffer();
        const encrypted = await encryptChunk(aesKey, chunk, fileId, chunkIndex);
        channel.send(encodeDataMessage(fileId, chunkIndex, encrypted));
        sentBytes += chunk.byteLength;
        const elapsed = Math.max(1, performance.now() - startedAt) / 1000;
        const speed = sentBytes / elapsed;
        onProgress({
          fileId,
          fileName: file.name,
          totalBytes: file.size,
          sentBytes,
          receivedBytes: 0,
          speed,
          eta: (file.size - sentBytes) / Math.max(1, speed),
          state: "transferring"
        });
        await waitForBufferedAmount(channel);
      }
      sendControl({ type: "file-complete", fileId, hash });
      onProgress({
        fileId,
        fileName: file.name,
        totalBytes: file.size,
        sentBytes,
        receivedBytes: 0,
        speed: 0,
        eta: 0,
        state: "complete"
      });
    }
  }

  async function handleMessage(data: string | ArrayBuffer): Promise<void> {
    if (typeof data === "string") {
      const message = JSON.parse(data) as TransferControl;
      if (message.type === "chat-message") {
        onChatMessage({
          id: message.id,
          body: message.body,
          sentAt: message.sentAt,
          direction: "received"
        });
        return;
      }
      if (message.type === "file-offer") {
        incoming.set(message.fileId, {
          meta: message,
          chunks: Array.from({ length: message.chunks }),
          receivedBytes: 0,
          startedAt: performance.now()
        });
        sendControl({ type: "file-accept", fileId: message.fileId });
        onProgress({
          fileId: message.fileId,
          fileName: message.name,
          totalBytes: message.size,
          sentBytes: 0,
          receivedBytes: 0,
          speed: 0,
          eta: 0,
          state: "offered"
        });
      }
      if (message.type === "file-cancel") {
        const record = incoming.get(message.fileId);
        if (record) {
          onProgress(emptyProgress(record.meta, "cancelled"));
          incoming.delete(message.fileId);
        }
      }
      return;
    }

    const packet = decodeDataMessage(data);
    const record = incoming.get(packet.fileId);
    if (!record) return;

    const decrypted = await decryptChunk(aesKey, packet.payload, packet.fileId, packet.chunkIndex);
    record.chunks[packet.chunkIndex] = decrypted;
    record.receivedBytes += decrypted.byteLength;
    const elapsed = Math.max(1, performance.now() - record.startedAt) / 1000;
    const speed = record.receivedBytes / elapsed;
    onProgress({
      fileId: packet.fileId,
      fileName: record.meta.name,
      totalBytes: record.meta.size,
      sentBytes: 0,
      receivedBytes: record.receivedBytes,
      speed,
      eta: (record.meta.size - record.receivedBytes) / Math.max(1, speed),
      state: record.receivedBytes >= record.meta.size ? "complete" : "transferring"
    });

    if (record.receivedBytes >= record.meta.size) {
      const blob = new Blob(record.chunks, { type: record.meta.mime || "application/octet-stream" });
      const hash = await sha256Hex(blob);
      if (hash !== record.meta.hash) {
        onProgress(emptyProgress(record.meta, "failed"));
        return;
      }
      onDownload(blob, record.meta.name, hash);
      incoming.delete(packet.fileId);
    }
  }

  return {
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    cancel() {
      cancelled = true;
    },
    sendChatMessage(body: string) {
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        body,
        sentAt: Date.now(),
        direction: "sent"
      };
      sendControl({ type: "chat-message", id: message.id, body: message.body, sentAt: message.sentAt });
      return message;
    },
    sendFiles,
    handleMessage
  };

  function sendControl(message: TransferControl): void {
    channel.send(JSON.stringify(message));
  }
}

function encodeDataMessage(fileId: string, chunkIndex: number, encrypted: ArrayBuffer): ArrayBuffer {
  const idBytes = new TextEncoder().encode(fileId);
  const payload = new Uint8Array(encrypted);
  const out = new Uint8Array(2 + idBytes.length + 4 + payload.byteLength);
  const view = new DataView(out.buffer);
  view.setUint16(0, idBytes.length);
  out.set(idBytes, 2);
  view.setUint32(2 + idBytes.length, chunkIndex);
  out.set(payload, 2 + idBytes.length + 4);
  return out.buffer;
}

function decodeDataMessage(buffer: ArrayBuffer): { fileId: string; chunkIndex: number; payload: ArrayBuffer } {
  const view = new DataView(buffer);
  const idLength = view.getUint16(0);
  const id = new TextDecoder().decode(new Uint8Array(buffer, 2, idLength));
  const chunkIndex = view.getUint32(2 + idLength);
  return { fileId: id, chunkIndex, payload: buffer.slice(2 + idLength + 4) };
}

function emptyProgress(
  meta: Pick<Extract<TransferControl, { type: "file-offer" }>, "fileId" | "name" | "size">,
  state: TransferProgress["state"]
): TransferProgress {
  return {
    fileId: meta.fileId,
    fileName: meta.name,
    totalBytes: meta.size,
    sentBytes: 0,
    receivedBytes: 0,
    speed: 0,
    eta: 0,
    state
  };
}

async function waitForBufferedAmount(channel: RTCDataChannel): Promise<void> {
  while (channel.bufferedAmount > CHUNK_SIZE_BYTES * 16) await sleep(25);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
