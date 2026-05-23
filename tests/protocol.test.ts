import { describe, expect, it } from "vitest";
import { signalClientMessageSchema } from "../src/shared/validation";

describe("signalling protocol validation", () => {
  it("accepts valid join messages", () => {
    const result = signalClientMessageSchema.safeParse({
      type: "join",
      roomCode: "ABC234",
      peerId: "peer-123456",
      publicKey: "public-key-material",
      role: "sender"
    });
    expect(result.success).toBe(true);
  });

  it("rejects malformed room codes", () => {
    const result = signalClientMessageSchema.safeParse({
      type: "join",
      roomCode: "IO0L11",
      peerId: "peer-123456",
      publicKey: "public-key-material",
      role: "receiver"
    });
    expect(result.success).toBe(false);
  });
});
