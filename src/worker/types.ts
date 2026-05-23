import type { SignalRoom } from "./signal-room";

export interface Env {
  SIGNAL_ROOM: DurableObjectNamespace<SignalRoom>;
  ROOM_INDEX: KVNamespace;
  ASSETS?: Fetcher;
}
