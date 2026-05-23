import {
  Check,
  Copy,
  Download,
  FilePlus2,
  Link as LinkIcon,
  Pause,
  Play,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Upload,
  X
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoom, deleteRoom, validateRoom } from "./lib/api";
import { formatBytes, formatEta, formatSpeed } from "./lib/format";
import { createTransferRuntime, type TransferProgress, type TransferRuntime } from "./lib/fileTransfer";
import { addTransfer, listTransfers } from "./lib/history";
import { connectSignaling, type SignalingSession } from "./lib/signaling";
import { createPeerRuntime, handleSignal, type PeerRuntime } from "./lib/webrtc";
import type { LocalTransfer, PeerRole, SignalPeer, SignalServerMessage } from "../shared/protocol";
import { isRoomCode, normalizeRoomCode } from "../shared/room";

type AppMode = "home" | "send" | "receive";

export function App() {
  const routeRoom = useMemo(() => {
    const match = window.location.pathname.match(/^\/r\/([A-Za-z0-9]{6})/);
    return match ? normalizeRoomCode(match[1]) : "";
  }, []);
  const [mode, setMode] = useState<AppMode>(routeRoom ? "receive" : "home");
  const [roomCode, setRoomCode] = useState(routeRoom);
  const [roomToken, setRoomToken] = useState("");
  const [shareUrl, setShareUrl] = useState(routeRoom ? window.location.href : "");
  const [joinCode, setJoinCode] = useState(routeRoom);
  const [qr, setQr] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<TransferProgress | undefined>();
  const [fingerprint, setFingerprint] = useState("");
  const [history, setHistory] = useState<LocalTransfer[]>([]);
  const [copied, setCopied] = useState(false);
  const roleRef = useRef<PeerRole>("sender");
  const signalingRef = useRef<SignalingSession>();
  const peerRef = useRef<PeerRuntime>();
  const transferRef = useRef<TransferRuntime>();
  const remotePeerRef = useRef<SignalPeer>();
  const filesRef = useRef<File[]>([]);
  const routeStartedRef = useRef(false);

  useEffect(() => {
    void listTransfers().then(setHistory);
  }, []);

  useEffect(() => {
    if (shareUrl) void QRCode.toDataURL(shareUrl, { margin: 1, width: 220 }).then(setQr);
  }, [shareUrl]);

  useEffect(() => {
    if (routeRoom && !routeStartedRef.current) {
      routeStartedRef.current = true;
      void startReceiver(routeRoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeRoom]);

  async function startSender() {
    try {
      setError("");
      setStatus("Creating private room");
      roleRef.current = "sender";
      const room = await createRoom();
      setRoomCode(room.roomCode);
      setRoomToken(room.roomToken);
      setShareUrl(room.shareUrl);
      setMode("send");
      await connect(room.roomCode, "sender");
      window.history.replaceState({}, "", `/r/${room.roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Room creation failed.");
    }
  }

  async function startReceiver(code = joinCode) {
    try {
      setError("");
      const normalized = normalizeRoomCode(code);
      if (!isRoomCode(normalized)) throw new Error("Enter a valid 6-character room code.");
      setStatus("Checking room");
      const room = await validateRoom(normalized);
      if (!room.exists) throw new Error("Room not found or expired.");
      roleRef.current = "receiver";
      setRoomCode(normalized);
      setMode("receive");
      await connect(normalized, "receiver");
      window.history.replaceState({}, "", `/r/${normalized}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the room.");
    }
  }

  async function connect(code: string, role: PeerRole) {
    let runtime: PeerRuntime | undefined;
    const pendingSignals: SignalServerMessage[] = [];
    const signaling = await connectSignaling(code, role, handleSignalMessage, setStatus);
    signalingRef.current = signaling;

    async function handleSignalMessage(message: SignalServerMessage) {
      if (message.type === "joined") {
        setStatus(message.peers.length ? "Peer found" : "Waiting for peer");
        const target = message.peers.find((peer) => peer.role !== role);
        if (target) await startPeer(target);
      } else if (message.type === "peer-joined" && message.peer.role !== role) {
        await startPeer(message.peer);
      } else if (
        message.type === "offer" ||
        message.type === "answer" ||
        message.type === "ice-candidate"
      ) {
        if (!runtime) {
          pendingSignals.push(message);
          return;
        }
        await handleSignal(message, runtime, signaling, remotePeerRef.current?.peerId ?? message.from);
      } else if (message.type === "peer-left") {
        setStatus("Peer disconnected");
      } else if (message.type === "error") {
        setError(message.message);
      }
    }

    async function startPeer(peer: SignalPeer) {
      if (runtime) return;
      remotePeerRef.current = peer;
      setStatus("Building encrypted peer link");
      runtime = await createPeerRuntime(
        role,
        signaling.keys,
        signaling,
        peer,
        (channel, session) => {
          setFingerprint(session.fingerprint);
          setStatus("Secure channel ready");
          const transfer = createTransferRuntime(channel, session.aesKey, setProgress, saveDownload);
          transferRef.current = transfer;
          channel.onmessage = (event) => void transfer.handleMessage(event.data as string | ArrayBuffer);
          if (role === "sender" && filesRef.current.length > 0) void transfer.sendFiles(filesRef.current);
        },
        setStatus
      );
      peerRef.current = runtime;
      while (pendingSignals.length > 0) {
        const pending = pendingSignals.shift()!;
        await handleSignal(pending, runtime, signaling, remotePeerRef.current?.peerId ?? peer.peerId);
      }
    }
  }

  async function sendSelectedFiles(selected: FileList | null) {
    const nextFiles = selected ? Array.from(selected) : [];
    filesRef.current = nextFiles;
    setFiles(nextFiles);
    if (transferRef.current && nextFiles.length > 0) await transferRef.current.sendFiles(nextFiles);
  }

  async function saveDownload(blob: Blob, name: string, hash: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
    const record: LocalTransfer = {
      id: crypto.randomUUID(),
      direction: "received",
      fileName: name,
      fileSize: blob.size,
      mimeType: blob.type,
      hash,
      roomCode,
      timestamp: Date.now(),
      status: "completed"
    };
    await addTransfer(record);
    setHistory(await listTransfers());
  }

  async function persistSentRecord() {
    if (!progress || progress.state !== "complete") return;
    const file = files.find((candidate) => candidate.name === progress.fileName);
    if (!file) return;
    await addTransfer({
      id: crypto.randomUUID(),
      direction: "sent",
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      hash: "verified-by-receiver",
      roomCode,
      timestamp: Date.now(),
      status: "completed"
    });
    setHistory(await listTransfers());
  }

  useEffect(() => {
    void persistSentRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress?.state]);

  function reset() {
    if (roomCode && roomToken) void deleteRoom(roomCode, roomToken);
    signalingRef.current?.close();
    peerRef.current?.connection.close();
    setMode("home");
    setRoomCode("");
    setRoomToken("");
    setShareUrl("");
    setQr("");
    filesRef.current = [];
    setFiles([]);
    setProgress(undefined);
    setFingerprint("");
    setStatus("Ready");
    setError("");
    window.history.replaceState({}, "", "/");
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <Header status={status} />
        {mode === "home" && (
          <div className="grid flex-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="brutal-panel flex flex-col justify-between gap-8 bg-acid p-6 sm:p-8">
              <div>
                <p className="label">Private file transfer</p>
                <h1 className="mt-4 max-w-3xl text-5xl font-black leading-none sm:text-7xl">
                  Share anything. Privately.
                </h1>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button className="primary-action bg-coral" onClick={startSender}>
                  <Upload aria-hidden /> Send files
                </button>
                <label className="primary-action cursor-pointer bg-sky">
                  <FilePlus2 aria-hidden /> Pick and send
                  <input
                    className="sr-only"
                    type="file"
                    multiple
                    onChange={(event) => {
                      void startSender().then(() => sendSelectedFiles(event.currentTarget.files));
                    }}
                  />
                </label>
              </div>
            </section>
            <section className="brutal-panel bg-white p-5 sm:p-6">
              <p className="label">Join a room</p>
              <div className="mt-5 flex flex-col gap-3">
                <input
                  className="room-input"
                  value={joinCode}
                  maxLength={6}
                  onChange={(event) => setJoinCode(normalizeRoomCode(event.target.value))}
                  placeholder="ABC123"
                  aria-label="Room code"
                />
                <button className="secondary-action bg-violet text-white" onClick={() => void startReceiver()}>
                  <LinkIcon aria-hidden /> Receive files
                </button>
              </div>
              <HistoryList history={history} />
            </section>
          </div>
        )}

        {mode !== "home" && (
          <div className="grid flex-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="brutal-panel bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="label">{mode === "send" ? "Send room" : "Receive room"}</p>
                  <div className="room-code mt-3">{roomCode}</div>
                </div>
                <button className="icon-button" onClick={reset} aria-label="Start over">
                  <RotateCcw aria-hidden />
                </button>
              </div>
              {mode === "send" && (
                <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr]">
                  <div className="qr-box">{qr ? <img src={qr} alt="Room QR code" /> : <QrCode />}</div>
                  <div className="flex flex-col gap-3">
                    <button className="secondary-action bg-sky" onClick={copyShareLink}>
                      {copied ? <Check aria-hidden /> : <Copy aria-hidden />} {copied ? "Copied" : "Copy link"}
                    </button>
                    <label className="secondary-action cursor-pointer bg-acid">
                      <FilePlus2 aria-hidden /> Add files
                      <input
                        className="sr-only"
                        type="file"
                        multiple
                        onChange={(event) => void sendSelectedFiles(event.currentTarget.files)}
                      />
                    </label>
                  </div>
                </div>
              )}
              <div className="mt-5 rounded-none border-4 border-ink bg-paper p-4">
                <div className="flex items-center gap-2 font-black">
                  <ShieldCheck aria-hidden className="h-5 w-5" /> Secure channel
                </div>
                <p className="mt-2 text-sm font-bold">{fingerprint || "Fingerprint appears after peer link."}</p>
              </div>
            </section>

            <section className="brutal-panel bg-white p-5 sm:p-6">
              <TransferPanel
                progress={progress}
                files={files}
                onPause={() => transferRef.current?.pause()}
                onResume={() => transferRef.current?.resume()}
                onCancel={() => transferRef.current?.cancel()}
              />
              <HistoryList history={history} compact />
            </section>
          </div>
        )}

        {error && (
          <div className="border-4 border-ink bg-coral p-4 font-black" role="alert">
            {error}
          </div>
        )}
      </section>
    </main>
  );
}

function Header({ status }: { status: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-ink pb-4">
      <div className="text-3xl font-black tracking-normal">SHARELY</div>
      <div className="flex items-center gap-2 border-4 border-ink bg-white px-3 py-2 font-black shadow-brutalSm">
        <span className="h-3 w-3 bg-acid ring-2 ring-ink" aria-hidden />
        <span role="status">{status}</span>
      </div>
    </header>
  );
}

function TransferPanel({
  progress,
  files,
  onPause,
  onResume,
  onCancel
}: {
  progress?: TransferProgress;
  files: File[];
  onPause(): void;
  onResume(): void;
  onCancel(): void;
}) {
  const done = progress ? Math.max(progress.sentBytes, progress.receivedBytes) : 0;
  const percent = progress ? Math.round((done / progress.totalBytes) * 100) : 0;
  return (
    <div>
      <p className="label">Transfer</p>
      <div className="mt-4 border-4 border-ink bg-paper p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">{progress?.fileName ?? "Waiting for files"}</h2>
            <p className="mt-1 font-bold">
              {progress ? `${formatBytes(done)} of ${formatBytes(progress.totalBytes)}` : `${files.length} queued`}
            </p>
          </div>
          <span className="border-4 border-ink bg-acid px-3 py-1 font-black uppercase">
            {progress?.state ?? "idle"}
          </span>
        </div>
        <div
          className="mt-5 h-8 border-4 border-ink bg-white"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className="h-full bg-violet" style={{ width: `${Math.min(100, percent)}%` }} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric label="Speed" value={formatSpeed(progress?.speed ?? 0)} />
          <Metric label="ETA" value={formatEta(progress?.eta ?? 0)} />
          <Metric label="Done" value={`${percent || 0}%`} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="mini-action" onClick={onPause}>
            <Pause aria-hidden /> Pause
          </button>
          <button className="mini-action" onClick={onResume}>
            <Play aria-hidden /> Resume
          </button>
          <button className="mini-action bg-coral" onClick={onCancel}>
            <X aria-hidden /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-4 border-ink bg-white p-3">
      <div className="text-xs font-black uppercase">{label}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

function HistoryList({ history, compact = false }: { history: LocalTransfer[]; compact?: boolean }) {
  return (
    <div className={compact ? "mt-5" : "mt-8"}>
      <p className="label">Local history</p>
      <div className="mt-3 grid gap-2">
        {history.length === 0 && <p className="font-bold">No transfers on this browser yet.</p>}
        {history.slice(0, compact ? 3 : 6).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 border-4 border-ink bg-paper p-3">
            <div className="min-w-0">
              <div className="truncate font-black">{item.fileName}</div>
              <div className="text-sm font-bold">
                {item.direction} - {formatBytes(item.fileSize)}
              </div>
            </div>
            <Download className="h-5 w-5 shrink-0" aria-hidden />
          </div>
        ))}
      </div>
    </div>
  );
}
