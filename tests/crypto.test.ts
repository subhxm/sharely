import { describe, expect, it } from "vitest";
import {
  createSessionKeys,
  decryptChunk,
  deriveSession,
  encryptChunk,
  sha256Hex
} from "../src/client/lib/crypto";

describe("crypto helpers", () => {
  it("derives matching AES sessions between peers", async () => {
    const alice = await createSessionKeys();
    const bob = await createSessionKeys();
    const aliceSession = await deriveSession(alice.privateKey, bob.publicKey);
    const bobSession = await deriveSession(bob.privateKey, alice.publicKey);
    const plaintext = new TextEncoder().encode("sharely transfer").buffer;

    const encrypted = await encryptChunk(aliceSession.aesKey, plaintext, "file-1", 0);
    const decrypted = await decryptChunk(bobSession.aesKey, encrypted, "file-1", 0);

    expect(new TextDecoder().decode(decrypted)).toBe("sharely transfer");
    expect(aliceSession.fingerprint).toBe(bobSession.fingerprint);
  });

  it("hashes payloads consistently", async () => {
    await expect(sha256Hex("sharely")).resolves.toHaveLength(64);
  });
});
