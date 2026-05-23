import { describe, expect, it } from "vitest";
import { ROOM_CODE_LENGTH } from "../src/shared/constants";
import { generateRoomCode, isRoomCode, normalizeRoomCode } from "../src/shared/room";

describe("room utilities", () => {
  it("generates share-safe room codes", () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(ROOM_CODE_LENGTH);
    expect(isRoomCode(code)).toBe(true);
  });

  it("normalizes pasted room codes", () => {
    expect(normalizeRoomCode(" ab-c123 ")).toBe("ABC123");
  });

  it("rejects ambiguous characters", () => {
    expect(isRoomCode("IO0L11")).toBe(false);
  });
});
