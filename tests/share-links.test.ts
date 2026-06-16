import assert from "node:assert/strict";
import test from "node:test";
import {
  clearShareRecordsForTests,
  createShareLinkRecord,
  getActiveShareRecord,
  revokeShareRecord,
  toPublicShareRecord
} from "../src/lib/share-links";

test("share records expose read token separately from management token", () => {
  clearShareRecordsForTests();

  const record = createShareLinkRecord(
    2026,
    new Date("2026-06-16T08:00:00.000Z")
  );
  const publicRecord = toPublicShareRecord(record);

  assert.equal(record.year, 2026);
  assert.equal(record.revokedAt, null);
  assert.ok(record.token.length > 20);
  assert.ok(record.managementToken.length > 20);
  assert.notEqual(record.token, record.managementToken);
  assert.equal("managementToken" in publicRecord, false);
});

test("share links require management token to revoke read access", () => {
  clearShareRecordsForTests();

  const record = createShareLinkRecord(
    2026,
    new Date("2026-06-16T08:00:00.000Z")
  );

  assert.equal(
    revokeShareRecord({
      token: record.token,
      managementToken: "wrong",
      now: new Date("2026-06-16T08:05:00.000Z")
    }),
    null
  );
  assert.equal(getActiveShareRecord(record.token)?.year, 2026);

  const revoked = revokeShareRecord({
    token: record.token,
    managementToken: record.managementToken,
    now: new Date("2026-06-16T08:10:00.000Z")
  });

  assert.equal(revoked?.revokedAt, "2026-06-16T08:10:00.000Z");
  assert.equal(getActiveShareRecord(record.token), null);
});
