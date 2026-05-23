import { DurableObject } from "cloudflare:workers";
import type {
  SignalClientMessage,
  SignalPeer,
  SignalServerMessage
} from "../shared/protocol";
import { signalClientMessageSchema } from "../shared/validation";
import type { Env } from "./types";

interface Attachment {
  peer?: SignalPeer;
}

export class SignalRoom extends DurableObject<Env> {
  private peers = new Map<WebSocket, SignalPeer>();

  async fetch(request: Request): Promise<Response> {
    const upgrade = request.headers.get("Upgrade");
    if (upgrade !== "websocket") {
      return Response.json({ error: "Expected WebSocket upgrade" }, { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== "string") {
      this.send(ws, { type: "error", code: "bad_message", message: "Binary signalling is not supported." });
      return;
    }

    let parsed: SignalClientMessage;
    try {
      parsed = signalClientMessageSchema.parse(JSON.parse(message)) as SignalClientMessage;
    } catch {
      this.send(ws, { type: "error", code: "bad_message", message: "Malformed signalling message." });
      return;
    }

    if (parsed.type === "join") {
      const existing = this.findPeer(parsed.peerId);
      if (existing && existing !== ws) {
        this.send(ws, { type: "error", code: "duplicate_peer", message: "Peer id is already in use." });
        ws.close(1008, "duplicate_peer");
        return;
      }

      const peer: SignalPeer = {
        peerId: parsed.peerId,
        publicKey: parsed.publicKey,
        role: parsed.role,
        joinedAt: Date.now()
      };
      this.peers.set(ws, peer);
      this.ctx.setWebSocketAutoResponse(
        new WebSocketRequestResponsePair(JSON.stringify({ type: "ping" }), JSON.stringify({ type: "pong" }))
      );
      ws.serializeAttachment({ peer } satisfies Attachment);

      const peers = this.activePeers().filter((candidate) => candidate.peerId !== peer.peerId);
      this.send(ws, { type: "joined", roomCode: parsed.roomCode, peerId: peer.peerId, peers });
      this.broadcast({ type: "peer-joined", peer }, ws);
      return;
    }

    if (parsed.type === "ping") {
      this.send(ws, { type: "pong", at: parsed.at });
      return;
    }

    const sender = this.peers.get(ws) ?? this.deserializePeer(ws);
    if (!sender || parsed.from !== sender.peerId) {
      this.send(ws, { type: "error", code: "not_joined", message: "Join the room before relaying." });
      return;
    }

    const target = this.findPeer(parsed.to);
    if (!target) {
      this.send(ws, { type: "error", code: "peer_missing", message: "Target peer is not connected." });
      return;
    }

    if (parsed.type === "offer" || parsed.type === "answer") {
      this.send(target, { type: parsed.type, from: parsed.from, sdp: parsed.sdp });
      return;
    }

    if (parsed.type === "ice-candidate") {
      this.send(target, { type: "ice-candidate", from: parsed.from, candidate: parsed.candidate });
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    this.removePeer(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.removePeer(ws);
  }

  private removePeer(ws: WebSocket): void {
    const peer = this.peers.get(ws) ?? this.deserializePeer(ws);
    this.peers.delete(ws);
    if (peer) {
      this.broadcast({ type: "peer-left", peerId: peer.peerId }, ws);
    }
  }

  private findPeer(peerId: string): WebSocket | undefined {
    for (const ws of this.ctx.getWebSockets()) {
      const peer = this.peers.get(ws) ?? this.deserializePeer(ws);
      if (peer?.peerId === peerId) return ws;
    }
    return undefined;
  }

  private activePeers(): SignalPeer[] {
    return this.ctx
      .getWebSockets()
      .map((ws) => this.peers.get(ws) ?? this.deserializePeer(ws))
      .filter((peer): peer is SignalPeer => Boolean(peer));
  }

  private deserializePeer(ws: WebSocket): SignalPeer | undefined {
    const attachment = ws.deserializeAttachment() as Attachment | undefined;
    if (attachment?.peer) this.peers.set(ws, attachment.peer);
    return attachment?.peer;
  }

  private broadcast(message: SignalServerMessage, except?: WebSocket): void {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== except) this.send(ws, message);
    }
  }

  private send(ws: WebSocket, message: SignalServerMessage): void {
    ws.send(JSON.stringify(message));
  }
}
