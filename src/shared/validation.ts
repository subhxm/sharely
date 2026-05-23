import { z } from "zod";
import { ROOM_CODE_LENGTH } from "./constants";

export const roomCodeSchema = z
  .string()
  .trim()
  .length(ROOM_CODE_LENGTH)
  .regex(/^[A-HJ-NP-Z2-9]+$/);

export const peerRoleSchema = z.union([z.literal("sender"), z.literal("receiver")]);

export const signalClientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("join"),
    roomCode: roomCodeSchema,
    peerId: z.string().min(8).max(64),
    publicKey: z.string().min(16),
    role: peerRoleSchema
  }),
  z.object({
    type: z.literal("offer"),
    from: z.string(),
    to: z.string(),
    sdp: z.any()
  }),
  z.object({
    type: z.literal("answer"),
    from: z.string(),
    to: z.string(),
    sdp: z.any()
  }),
  z.object({
    type: z.literal("ice-candidate"),
    from: z.string(),
    to: z.string(),
    candidate: z.any()
  }),
  z.object({
    type: z.literal("ping"),
    at: z.number()
  })
]);
