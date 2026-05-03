import type { OfflineReportQueueItem } from "@/lib/demo/types";

export const OFFLINE_REPORT_QUEUE_DB_NAME = "clinicpulse-offline-reports";
export const OFFLINE_REPORT_QUEUE_STORE = "reports";
export const OFFLINE_REPORT_QUEUE_SCHEMA_VERSION = 1;

const SYNCED_REPORT_RETENTION_MS = 5 * 60 * 1000;

type OfflineReportQueueAdapter = {
  put(item: OfflineReportQueueItem): Promise<void>;
  getAll(): Promise<unknown[]>;
  delete(clientReportId: string): Promise<void>;
};

let testAdapter: OfflineReportQueueAdapter | null = null;

export function __setOfflineReportQueueAdapterForTests(
  adapter: OfflineReportQueueAdapter | null,
) {
  testAdapter = adapter;
}

function canUseIndexedDb() {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function isOfflineReportQueueItem(value: unknown): value is OfflineReportQueueItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (value as { schemaVersion?: unknown }).schemaVersion === OFFLINE_REPORT_QUEUE_SCHEMA_VERSION;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  });
}

function openOfflineQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(
      OFFLINE_REPORT_QUEUE_DB_NAME,
      OFFLINE_REPORT_QUEUE_SCHEMA_VERSION,
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(OFFLINE_REPORT_QUEUE_STORE)) {
        db.createObjectStore(OFFLINE_REPORT_QUEUE_STORE, {
          keyPath: "clientReportId",
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function createIndexedDbAdapter(): OfflineReportQueueAdapter | null {
  if (!canUseIndexedDb()) {
    return null;
  }

  return {
    async put(item) {
      const db = await openOfflineQueueDb();

      try {
        const transaction = db.transaction(OFFLINE_REPORT_QUEUE_STORE, "readwrite");
        transaction.objectStore(OFFLINE_REPORT_QUEUE_STORE).put(item);
        await transactionDone(transaction);
      } finally {
        db.close();
      }
    },
    async getAll() {
      const db = await openOfflineQueueDb();

      try {
        const transaction = db.transaction(OFFLINE_REPORT_QUEUE_STORE, "readonly");
        const records = await requestToPromise(
          transaction.objectStore(OFFLINE_REPORT_QUEUE_STORE).getAll(),
        );
        await transactionDone(transaction);
        return records;
      } finally {
        db.close();
      }
    },
    async delete(clientReportId) {
      const db = await openOfflineQueueDb();

      try {
        const transaction = db.transaction(OFFLINE_REPORT_QUEUE_STORE, "readwrite");
        transaction.objectStore(OFFLINE_REPORT_QUEUE_STORE).delete(clientReportId);
        await transactionDone(transaction);
      } finally {
        db.close();
      }
    },
  };
}

function getAdapter() {
  return testAdapter ?? createIndexedDbAdapter();
}

export async function addOfflineReport(item: OfflineReportQueueItem): Promise<void> {
  await getAdapter()?.put(item);
}

export async function listOfflineReports(): Promise<OfflineReportQueueItem[]> {
  const records = await getAdapter()?.getAll();

  return (records ?? []).filter(isOfflineReportQueueItem);
}

export async function updateOfflineReport(item: OfflineReportQueueItem): Promise<void> {
  await getAdapter()?.put(item);
}

export async function removeOfflineReport(clientReportId: string): Promise<void> {
  await getAdapter()?.delete(clientReportId);
}

export async function clearSyncedOfflineReports(now = new Date()): Promise<void> {
  const adapter = getAdapter();

  if (!adapter) {
    return;
  }

  const cutoff = now.getTime() - SYNCED_REPORT_RETENTION_MS;
  const reports = (await adapter.getAll()).filter(isOfflineReportQueueItem);
  const expiredSyncedReports = reports.filter((report) => {
    if (report.syncStatus !== "synced") {
      return false;
    }

    return Date.parse(report.updatedAt) <= cutoff;
  });

  await Promise.all(
    expiredSyncedReports.map((report) => adapter.delete(report.clientReportId)),
  );
}
