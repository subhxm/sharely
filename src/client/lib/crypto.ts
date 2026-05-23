export interface SessionKeys {
  publicKey: string;
  privateKey: CryptoKey;
}

export interface DerivedSession {
  aesKey: CryptoKey;
  fingerprint: string;
}

const encoder = new TextEncoder();

export async function createSessionKeys(): Promise<SessionKeys> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  return {
    privateKey: keyPair.privateKey,
    publicKey: btoa(JSON.stringify(publicJwk))
  };
}

export async function deriveSession(privateKey: CryptoKey, remotePublicKey: string): Promise<DerivedSession> {
  const remoteJwk = JSON.parse(atob(remotePublicKey)) as JsonWebKey;
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    remoteJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  const sharedBits = await crypto.subtle.deriveBits({ name: "ECDH", public: publicKey }, privateKey, 256);
  const hkdfKey = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey", "deriveBits"]);
  const salt = encoder.encode("sharely-phase-1");
  const info = encoder.encode("file-transfer-v1");
  const aesKey = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  const fingerprintBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: encoder.encode("fingerprint-v1") },
    hkdfKey,
    40
  );
  return { aesKey, fingerprint: toHex(new Uint8Array(fingerprintBits)).match(/.{1,4}/g)!.join(" ") };
}

export async function sha256Hex(data: Blob | ArrayBuffer | string): Promise<string> {
  const buffer =
    typeof data === "string"
      ? encoder.encode(data)
      : data instanceof Blob
        ? await data.arrayBuffer()
        : data;
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return toHex(new Uint8Array(digest));
}

export async function encryptChunk(
  key: CryptoKey,
  chunk: ArrayBuffer,
  fileId: string,
  chunkIndex: number
): Promise<ArrayBuffer> {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const aad = encoder.encode(`${fileId}:${chunkIndex}`);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce, additionalData: aad }, key, chunk);
  const out = new Uint8Array(12 + encrypted.byteLength);
  out.set(nonce, 0);
  out.set(new Uint8Array(encrypted), 12);
  return out.buffer;
}

export async function decryptChunk(
  key: CryptoKey,
  payload: ArrayBuffer,
  fileId: string,
  chunkIndex: number
): Promise<ArrayBuffer> {
  const bytes = new Uint8Array(payload);
  const nonce = bytes.slice(0, 12);
  const encrypted = bytes.slice(12);
  const aad = encoder.encode(`${fileId}:${chunkIndex}`);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce, additionalData: aad }, key, encrypted);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
