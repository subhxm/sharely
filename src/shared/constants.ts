export const ROOM_CODE_LENGTH = 6;
export const ROOM_TTL_SECONDS = 30 * 60;
export const CHUNK_SIZE_BYTES = 64 * 1024;
export const MAX_PARALLEL_CHUNKS = 8;
export const DATA_CHANNEL_LABEL = "sharely-files";
export const PROTOCOL_VERSION = 1;
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.l.google.com:19302" }
];
