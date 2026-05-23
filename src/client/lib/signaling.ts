import type { PeerRole, SignalClientMessage, SignalServerMessage } from "../../shared/protocol";
import { makePeerId } from "../../shared/room";
import { socketUrl } from "./api";
import { createSessionKeys, type SessionKeys } from "./crypto";

export interface SignalingSession {
  peerId: string;
  keys: SessionKeys;
  socket: WebSocket;
  send(message: SignalClientMessage): void;
  close(): void;
}

export async function connectSignaling(
  roomCode: string,
  role: PeerRole,
  onMessage: (message: SignalServerMessage) => void,
  onStatus: (status: string) => void
): Promise<SignalingSession> {
  const peerId = makePeerId();
  const keys = await createSessionKeys();
  const socket = new WebSocket(socketUrl(roomCode));

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Signalling timed out.")), 10_000);
    socket.onopen = () => {
      window.clearTimeout(timeout);
      socket.send(JSON.stringify({ type: "join", roomCode, peerId, publicKey: keys.publicKey, role }));
      onStatus("Signalling connected");
      resolve();
    };
    socket.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Signalling failed."));
    };
  });

  socket.onmessage = (event) => onMessage(JSON.parse(event.data as string) as SignalServerMessage);
  socket.onclose = () => onStatus("Signalling closed");

  return {
    peerId,
    keys,
    socket,
    send(message) {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    },
    close() {
      socket.close();
    }
  };
}
