export type PeerRole = "sender" | "receiver";

export interface RoomRecord {
  roomCode: string;
  doName: string;
  tokenHash: string;
  createdAt: number;
  expiresAt: number;
}

export interface CreateRoomResponse {
  roomCode: string;
  roomToken: string;
  shareUrl: string;
  ttl: number;
}

export interface ValidateRoomResponse {
  exists: boolean;
  peerCount: number;
  ttl: number;
}

export interface RelayUploadResponse {
  objectKey: string;
  expiresAt: number;
}

export type SignalClientMessage =
  | { type: "join"; roomCode: string; peerId: string; publicKey: string; role: PeerRole }
  | { type: "offer"; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice-candidate"; from: string; to: string; candidate: RTCIceCandidateInit }
  | { type: "ping"; at: number };

export type SignalServerMessage =
  | { type: "joined"; roomCode: string; peerId: string; peers: SignalPeer[] }
  | { type: "peer-joined"; peer: SignalPeer }
  | { type: "peer-left"; peerId: string }
  | { type: "offer"; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice-candidate"; from: string; candidate: RTCIceCandidateInit }
  | { type: "pong"; at: number }
  | { type: "error"; code: string; message: string };

export interface SignalPeer {
  peerId: string;
  publicKey: string;
  role: PeerRole;
  joinedAt: number;
}

export type TransferControl =
  | {
      type: "file-offer";
      fileId: string;
      name: string;
      size: number;
      mime: string;
      chunks: number;
      hash: string;
    }
  | { type: "file-accept"; fileId: string }
  | { type: "file-reject"; fileId: string; reason: string }
  | { type: "file-complete"; fileId: string; hash: string }
  | { type: "file-cancel"; fileId: string }
  | { type: "ack"; fileId: string; chunkIndex: number }
  | { type: "transfer-paused"; fileId: string }
  | { type: "transfer-resumed"; fileId: string };

export interface LocalTransfer {
  id: string;
  direction: "sent" | "received";
  fileName: string;
  fileSize: number;
  mimeType: string;
  hash: string;
  roomCode: string;
  timestamp: number;
  status: "completed" | "failed" | "cancelled";
}
