import { randomUUID } from "node:crypto";

export type ShareRecord = {
  token: string;
  managementToken: string;
  year: number;
  createdAt: string;
  revokedAt: string | null;
};

export type PublicShareRecord = Omit<ShareRecord, "managementToken">;

type ShareStore = {
  records: Map<string, ShareRecord>;
};

const shareStoreKey = "__annual_photo_album_share_store__";

function getShareStore(): ShareStore {
  const globalStore = globalThis as typeof globalThis & {
    [shareStoreKey]?: ShareStore;
  };

  if (!globalStore[shareStoreKey]) {
    globalStore[shareStoreKey] = { records: new Map() };
  }

  return globalStore[shareStoreKey];
}

export function createShareLinkRecord(year: number, now = new Date()) {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error("Invalid album year");
  }

  const record: ShareRecord = {
    token: randomUUID().replaceAll("-", ""),
    managementToken: randomUUID().replaceAll("-", ""),
    year,
    createdAt: now.toISOString(),
    revokedAt: null
  };

  getShareStore().records.set(record.token, record);
  return record;
}

export function toPublicShareRecord(record: ShareRecord): PublicShareRecord {
  const { managementToken: _managementToken, ...publicRecord } = record;
  return publicRecord;
}

export function getShareRecord(token: string) {
  return getShareStore().records.get(token) ?? null;
}

export function getActiveShareRecord(token: string) {
  const record = getShareRecord(token);

  if (!record || record.revokedAt) {
    return null;
  }

  return record;
}

export function revokeShareRecord({
  token,
  managementToken,
  now = new Date()
}: {
  token: string;
  managementToken: string;
  now?: Date;
}) {
  const record = getShareRecord(token);

  if (!record || record.managementToken !== managementToken) {
    return null;
  }

  const revoked = {
    ...record,
    revokedAt: record.revokedAt ?? now.toISOString()
  };

  getShareStore().records.set(token, revoked);
  return revoked;
}

export function clearShareRecordsForTests() {
  getShareStore().records.clear();
}
