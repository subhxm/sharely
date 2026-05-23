import { openDB } from "idb";
import type { DBSchema } from "idb";
import type { LocalTransfer } from "../../shared/protocol";

interface SharelyDb extends DBSchema {
  transfers: {
    key: string;
    value: LocalTransfer;
    indexes: { "by-timestamp": number };
  };
}

const dbPromise = openDB<SharelyDb>("sharely-local", 1, {
  upgrade(db) {
    const store = db.createObjectStore("transfers", { keyPath: "id" });
    store.createIndex("by-timestamp", "timestamp");
  }
});

export async function addTransfer(record: LocalTransfer): Promise<void> {
  const db = await dbPromise;
  await db.put("transfers", record);
}

export async function listTransfers(): Promise<LocalTransfer[]> {
  const db = await dbPromise;
  const transfers = await db.getAllFromIndex("transfers", "by-timestamp");
  return transfers.sort((a, b) => b.timestamp - a.timestamp);
}
