import type { CreateRoomResponse, ValidateRoomResponse } from "../../shared/protocol";

export async function createRoom(): Promise<CreateRoomResponse> {
  const response = await fetch("/api/rooms", { method: "POST" });
  if (!response.ok) throw new Error("Could not create a room.");
  return response.json() as Promise<CreateRoomResponse>;
}

export async function validateRoom(roomCode: string): Promise<ValidateRoomResponse> {
  const response = await fetch(`/api/rooms/${roomCode}`);
  if (!response.ok) return { exists: false, peerCount: 0, ttl: 0 };
  return response.json() as Promise<ValidateRoomResponse>;
}

export async function deleteRoom(roomCode: string, roomToken: string): Promise<void> {
  await fetch(`/api/rooms/${roomCode}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${roomToken}` }
  });
}

export function socketUrl(roomCode: string): string {
  const url = new URL(`/api/rooms/${roomCode}/socket`, window.location.href);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}
