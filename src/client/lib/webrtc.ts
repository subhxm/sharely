import { DATA_CHANNEL_LABEL, ICE_SERVERS } from "../../shared/constants";
import type { PeerRole, SignalPeer, SignalServerMessage } from "../../shared/protocol";
import { deriveSession, type DerivedSession, type SessionKeys } from "./crypto";
import type { SignalingSession } from "./signaling";

export interface PeerRuntime {
  connection: RTCPeerConnection;
  channel: RTCDataChannel;
  session: DerivedSession;
}

export async function createPeerRuntime(
  role: PeerRole,
  localKeys: SessionKeys,
  signaling: SignalingSession,
  remotePeer: SignalPeer,
  onChannel: (channel: RTCDataChannel, session: DerivedSession) => void,
  onStatus: (status: string) => void
): Promise<PeerRuntime> {
  const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  const session = await deriveSession(localKeys.privateKey, remotePeer.publicKey);
  const channel = connection.createDataChannel(DATA_CHANNEL_LABEL, {
    ordered: true,
    negotiated: true,
    id: 0
  });

  connection.onicecandidate = (event) => {
    if (event.candidate) {
      signaling.send({
        type: "ice-candidate",
        from: signaling.peerId,
        to: remotePeer.peerId,
        candidate: event.candidate.toJSON()
      });
    }
  };
  connection.onconnectionstatechange = () => onStatus(`Peer ${connection.connectionState}`);

  channel.binaryType = "arraybuffer";
  channel.onopen = () => onChannel(channel, session);
  channel.onclose = () => onStatus("Data channel closed");

  if (role === "sender") {
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    signaling.send({ type: "offer", from: signaling.peerId, to: remotePeer.peerId, sdp: offer });
  }

  return { connection, channel, session };
}

export async function handleSignal(
  message: SignalServerMessage,
  runtime: PeerRuntime | undefined,
  signaling: SignalingSession,
  remotePeerId: string
): Promise<void> {
  if (!runtime) return;
  if (message.type === "offer") {
    await runtime.connection.setRemoteDescription(message.sdp);
    const answer = await runtime.connection.createAnswer();
    await runtime.connection.setLocalDescription(answer);
    signaling.send({ type: "answer", from: signaling.peerId, to: remotePeerId, sdp: answer });
  }
  if (message.type === "answer") {
    await runtime.connection.setRemoteDescription(message.sdp);
  }
  if (message.type === "ice-candidate") {
    await runtime.connection.addIceCandidate(message.candidate);
  }
}
